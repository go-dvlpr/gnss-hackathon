package main

import (
	"bytes"
	"context"
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"log/slog"
	"mime"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
)

const (
	addr              = "127.0.0.1:8080"
	openAIModel       = "gpt-6.2-sol"
	openAIURL         = "https://api.openai.com/v1/responses"
	maxRecordingBytes = 2 << 20
)

const instructions = `Transcribe the visible American Sign Language (ASL) sequence. Give the identifiable signs in order, with approximate inclusive start and end frames. Ignore neutral movement and intermediate poses of a single sign. Return an empty signs array if nothing is identifiable.
The input contains the full sequence of hand landmarks from a manually delimited clip. Each frame is [elapsed milliseconds, hands]. A hand is [estimated Left or Right, points]. Each point is [x,y,z], normalized by MediaPipe and scaled by 1000. X increases right, Y down, and Z is relative to the wrist. Landmark 0 is the wrist; 1–4 thumb, 5–8 index, 9–12 middle, 13–16 ring, 17–20 pinky. Frame numbers are zero-based indices in the supplied sequence. The aspect ratio describes the source frame geometry.
Read motion_samples first, then consult the full frame sequence for short transitions or ambiguous handshapes. A motion sample is [frame index, hands, gaps]. Each summarized hand is [side, wrist x/y as percent of the image, finger flex string, thumb proximity string]. For both strings the four characters are index, middle, ring, little. Flex E = extended, B = bent, C = curled. Thumb proximity + = nearby, - = apart. The two gaps are nearest fingertip-to-fingertip and palm-center-to-opposite-wrist-or-knuckle distances in the image, both in tenths of a palm length (-1 when fewer than two hands are visible). Small gaps suggest proximity, not proof of contact. Lower wrist y means upward movement.
Compare changes over time: whether hands approach and separate, lift together, stay vertically stacked, or change finger shape independently. Use wrist trajectories, relative fingertip positions, and palm orientation to distinguish handshapes and motion. Some signs require face or body landmarks. These are unavailable; report only signs supported by the hand data. A held handshape can finish a sign.
Recognize fingerspelling when consecutive one-handed poses show alphabet letters. Inspect each sustained pose in sequence. Distinguish the thumb along the side of a fist from a thumb across the front; distinguish an isolated raised index from a raised index with the other fingertips touching the thumb. Collapse repeatedly sampled poses, keeping deliberate repeated letters. Join the letters of a name or word into one gloss, even if it is unfamiliar. Do not guess a familiar word or an extra letter.
Return uppercase English glosses, a short Russian translation or name transliteration, and mark fingerspelled items as such. The transcript is literal ASL gloss order, without invented connecting words.
ASL reference for commonly confused motion and handshapes:
- A flat palm held against the signer's chest expresses MY or MINE; an index pointing to the chest is ME or I. A flat hand travels out from the lips or chin for THANK-YOU. Resting the hand on the chest and then lowering it does not make that outward movement.
- When both hands extend the index and middle fingers together and one pair taps crosswise on the other near chest level, consider NAME. MEET brings two upright index fingers together.
- MORE brings two similar flattened-O handshapes together at the fingertips. For HELP, one open hand supports a loose fist or thumb-up hand. Look for the supporting palm below the fist and their coordinated movement, including the fist coming onto the supporting palm and any following lift. Identify each only when its shape and movement are present. Judge any other sign on its own evidence.
- An uninterrupted series of stable alphabet poses usually represents a single fingerspelled token. V versus TWO depends on the surrounding sequence. L extends index and thumb at right angles. In A the thumb rests beside the index knuckle; in S it crosses the front of curled fingers. D extends the index with the thumb touching curled fingertips to form a loop; ONE has a folded-in thumb and no loop. I extends the little finger.
- A circular motion of an H-hand near the face can be HAWAII. Check the wrist trajectory for that circular motion.
Describe the hand shapes and motion inferred from the coordinates in observations first, then give signs. Report only signs supported by those observations.
`

//go:embed web
var assets embed.FS

type point [3]int

func (p *point) UnmarshalJSON(data []byte) error {
	var values []*int
	if err := json.Unmarshal(data, &values); err != nil {
		return err
	}
	if len(values) != len(p) || values[0] == nil || values[1] == nil || values[2] == nil {
		return errors.New("point must contain three integers")
	}
	*p = point{*values[0], *values[1], *values[2]}
	return nil
}

type hand struct {
	Side   string  `json:"side"`
	Points []point `json:"points"`
}

type frame struct {
	TimestampMS int    `json:"timestamp_ms"`
	Hands       []hand `json:"hands"`
}

type recording struct {
	AspectRatio float64 `json:"aspect_ratio,omitempty"`
	Frames      []frame `json:"frames"`
}

func (r recording) validate() (bool, error) {
	if len(r.Frames) == 0 || r.AspectRatio < 0 {
		return false, errors.New("invalid recording")
	}
	hasHands := false
	previous := -1
	for _, f := range r.Frames {
		if f.TimestampMS <= previous || len(f.Hands) > 2 {
			return false, errors.New("invalid frame timestamp or hand count")
		}
		previous = f.TimestampMS
		for _, h := range f.Hands {
			if (h.Side != "Left" && h.Side != "Right") || len(h.Points) != 21 {
				return false, errors.New("expected a hand label and 21 points")
			}
			hasHands = true
		}
	}
	return hasHands, nil
}

func (r recording) modelInput() ([]byte, error) {
	frames := make([][2]any, len(r.Frames))
	for i, frame := range r.Frames {
		hands := make([][2]any, len(frame.Hands))
		for j, hand := range frame.Hands {
			hands[j] = [2]any{hand.Side, hand.Points}
		}
		frames[i] = [2]any{frame.TimestampMS, hands}
	}
	return json.Marshal(struct {
		AspectRatio float64  `json:"aspect_ratio,omitempty"`
		Motion      [][3]any `json:"motion_samples"`
		Frames      [][2]any `json:"frames"`
	}{r.AspectRatio, r.motionSamples(), frames})
}

type sign struct {
	Gloss         string `json:"gloss"`
	Translation   string `json:"translation"`
	StartFrame    int    `json:"start_frame"`
	EndFrame      int    `json:"end_frame"`
	Fingerspelled bool   `json:"fingerspelled"`
}

type recognition struct {
	Signs []sign `json:"signs"`
}

type recognizer interface {
	recognize(context.Context, recording) (recognition, error)
}

var (
	errOpenAIQuota     = errors.New("OpenAI quota exhausted")
	errOpenAIRateLimit = errors.New("OpenAI request limit exceeded")
)

type openAIRecognizer struct {
	client        *http.Client
	url           string
	key           string
	model         string
	requestLogDir string
}

func (l openAIRecognizer) recognize(ctx context.Context, input recording) (recognition, error) {
	landmarks, err := input.modelInput()
	if err != nil {
		return recognition{}, fmt.Errorf("encode landmarks: %w", err)
	}
	effort := "none"
	if strings.HasPrefix(l.model, "gpt-6.2-") || l.model == "gpt-6.1-terra" {
		effort = "low"
	}
	payload, err := json.Marshal(map[string]any{
		"model":             l.model,
		"instructions":      instructions,
		"input":             string(landmarks),
		"store":             false,
		"reasoning":         map[string]string{"effort": effort},
		"max_output_tokens": 2048,
		"text": map[string]any{"format": map[string]any{
			"type":   "json_schema",
			"name":   "asl_transcript",
			"strict": true,
			"schema": map[string]any{
				"type":                 "object",
				"additionalProperties": false,
				"required":             []string{"observations", "signs"},
				"properties": map[string]any{
					"observations": map[string]string{"type": "string"},
					"signs": map[string]any{
						"type": "array",
						"items": map[string]any{
							"type":                 "object",
							"additionalProperties": false,
							"required":             []string{"gloss", "translation", "start_frame", "end_frame", "fingerspelled"},
							"properties": map[string]any{
								"gloss":         map[string]string{"type": "string"},
								"translation":   map[string]string{"type": "string"},
								"start_frame":   map[string]string{"type": "integer"},
								"end_frame":     map[string]string{"type": "integer"},
								"fingerspelled": map[string]string{"type": "boolean"},
							},
						},
					},
				},
			},
		}},
	})
	if err != nil {
		return recognition{}, fmt.Errorf("encode model request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, l.url, bytes.NewReader(payload))
	if err != nil {
		return recognition{}, fmt.Errorf("create model request: %w", err)
	}
	if l.requestLogDir != "" {
		path, err := saveModelRequest(l.requestLogDir, payload)
		if err != nil {
			return recognition{}, err
		}
		slog.InfoContext(ctx, "recognition request saved", "model", l.model, "frames", len(input.Frames), "request_log", path)
	}
	req.Header.Set("Authorization", "Bearer "+l.key)
	req.Header.Set("Content-Type", "application/json")
	resp, err := l.client.Do(req)
	if err != nil {
		return recognition{}, fmt.Errorf("send model request: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusTooManyRequests {
		var failure struct {
			Error struct {
				Code string `json:"code"`
			} `json:"error"`
		}
		if err := json.NewDecoder(io.LimitReader(resp.Body, 8<<10)).Decode(&failure); err == nil && failure.Error.Code == "insufficient_quota" {
			return recognition{}, errOpenAIQuota
		}
		return recognition{}, errOpenAIRateLimit
	}
	if resp.StatusCode != http.StatusOK {
		return recognition{}, fmt.Errorf("OpenAI returned HTTP %d", resp.StatusCode)
	}

	var result struct {
		Status string `json:"status"`
		Usage  *struct {
			InputTokens  int `json:"input_tokens"`
			OutputTokens int `json:"output_tokens"`
			InputDetails struct {
				CachedTokens int `json:"cached_tokens"`
				CacheWrites  struct {
					TTL30Minutes int `json:"ttl_30m_tokens"`
					TTL12Hours   int `json:"ttl_12h_tokens"`
				} `json:"cache_write_tokens_details"`
			} `json:"input_tokens_details"`
		} `json:"usage"`
		Output []struct {
			Type    string `json:"type"`
			Content []struct {
				Type string `json:"type"`
				Text string `json:"text"`
			} `json:"content"`
		} `json:"output"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 64<<10)).Decode(&result); err != nil {
		return recognition{}, fmt.Errorf("decode OpenAI response: %w", err)
	}
	if usage := result.Usage; usage != nil {
		log.Printf("recognition usage model=%s frames=%d input_tokens=%d cached_tokens=%d cache_write_30m_tokens=%d cache_write_12h_tokens=%d output_tokens=%d",
			l.model, len(input.Frames), usage.InputTokens, usage.InputDetails.CachedTokens,
			usage.InputDetails.CacheWrites.TTL30Minutes, usage.InputDetails.CacheWrites.TTL12Hours, usage.OutputTokens)
	}
	if result.Status != "completed" {
		return recognition{}, errors.New("OpenAI response did not complete")
	}
	for _, item := range result.Output {
		if item.Type != "message" {
			continue
		}
		for _, content := range item.Content {
			switch content.Type {
			case "refusal":
				return recognition{}, nil
			case "output_text":
				var transcript recognition
				if err := json.Unmarshal([]byte(content.Text), &transcript); err != nil {
					return recognition{}, errors.New("OpenAI returned invalid recognition JSON")
				}
				transcript.normalize(len(input.Frames))
				log.Printf("recognition result frames=%d signs=%d", len(input.Frames), len(transcript.Signs))
				return transcript, nil
			}
		}
	}
	return recognition{}, errors.New("OpenAI response contained no recognition")
}

func (r *recognition) normalize(totalFrames int) {
	valid := r.Signs[:0]
	for _, sign := range r.Signs {
		sign.Gloss = strings.ToUpper(strings.Join(strings.Fields(sign.Gloss), " "))
		sign.Translation = strings.TrimSpace(sign.Translation)
		if sign.Gloss == "" || sign.Gloss == "?" || sign.StartFrame < 0 || sign.StartFrame > sign.EndFrame || sign.EndFrame >= totalFrames {
			continue
		}
		valid = append(valid, sign)
	}
	sort.SliceStable(valid, func(i, j int) bool { return valid[i].StartFrame < valid[j].StartFrame })
	r.Signs = valid
}

func recognizeHandler(model recognizer) http.HandlerFunc {
	inFlight := make(chan struct{}, 1)
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-store")
		if r.Header.Get("Sec-Fetch-Site") == "cross-site" {
			http.Error(w, "cross-site request", http.StatusForbidden)
			return
		}
		contentType, _, _ := mime.ParseMediaType(r.Header.Get("Content-Type"))
		if contentType != "application/json" {
			http.Error(w, "expected application/json", http.StatusUnsupportedMediaType)
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, maxRecordingBytes)
		var input recording
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&input); err != nil {
			var tooLarge *http.MaxBytesError
			if errors.As(err, &tooLarge) {
				http.Error(w, "Запись слишком длинная. Запишите более короткую фразу.", http.StatusRequestEntityTooLarge)
				return
			}
			http.Error(w, "invalid recording JSON", http.StatusBadRequest)
			return
		}
		if decoder.Decode(new(json.RawMessage)) != io.EOF {
			http.Error(w, "unexpected data after recording", http.StatusBadRequest)
			return
		}
		hasHands, err := input.validate()
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		var transcript recognition
		if hasHands {
			if model == nil {
				http.Error(w, "Укажите OPENAI_API_KEY на сервере.", http.StatusServiceUnavailable)
				return
			}
			select {
			case inFlight <- struct{}{}:
				defer func() { <-inFlight }()
			default:
				http.Error(w, "Модель занята. Повторите позже.", http.StatusTooManyRequests)
				return
			}

			transcript, err = model.recognize(r.Context(), input)
			if r.Context().Err() != nil {
				return
			}
			if err != nil {
				log.Printf("recognition failed: %v", err)
				switch {
				case errors.Is(err, errOpenAIQuota):
					http.Error(w, "Квота OpenAI исчерпана.", http.StatusTooManyRequests)
				case errors.Is(err, errOpenAIRateLimit):
					http.Error(w, "Достигнут лимит запросов OpenAI. Повторите фразу позже.", http.StatusTooManyRequests)
				default:
					http.Error(w, "Ошибка OpenAI. Подробности в логе сервера.", http.StatusBadGateway)
				}
				return
			}
		}
		if transcript.Signs == nil {
			transcript.Signs = []sign{}
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(transcript)
	}
}

func main() {
	var model recognizer
	if key := strings.TrimSpace(os.Getenv("OPENAI_API_KEY")); key != "" {
		modelName := strings.TrimSpace(os.Getenv("OPENAI_MODEL"))
		if modelName == "" {
			modelName = openAIModel
		}
		model = openAIRecognizer{
			client:        &http.Client{Timeout: 15 * time.Second},
			url:           openAIURL,
			key:           key,
			model:         modelName,
			requestLogDir: strings.TrimSpace(os.Getenv("OPENAI_REQUEST_LOG_DIR")),
		}
		log.Printf("recognition model: %s", modelName)
	} else {
		log.Print("OPENAI_API_KEY is missing; camera works, recognition is disabled")
	}
	web, err := fs.Sub(assets, "web")
	if err != nil {
		log.Fatal(err)
	}
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/recognize", recognizeHandler(model))
	files := http.FileServerFS(web)
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache")
		files.ServeHTTP(w, r)
	})
	server := http.Server{
		Addr: addr, Handler: mux,
		ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 5 * time.Second,
		WriteTimeout: 20 * time.Second, IdleTimeout: 30 * time.Second,
	}
	log.Printf("ASL demo listening on http://%s", addr)
	log.Fatal(server.ListenAndServe())
}
