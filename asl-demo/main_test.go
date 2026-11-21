package main

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"sync/atomic"
	"testing"
)

func TestRecognizeHandler(t *testing.T) {
	var calls atomic.Int32
	logDir := filepath.Join(t.TempDir(), "requests")
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls.Add(1)
		if r.Method != http.MethodPost || r.Header.Get("Authorization") != "Bearer test-key" {
			t.Error("unexpected upstream method or authorization")
		}

		body, err := io.ReadAll(r.Body)
		if err != nil {
			t.Errorf("read upstream request: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		entries, err := os.ReadDir(logDir)
		if err != nil || len(entries) != 1 {
			t.Errorf("expected exactly one request log before HTTP call, got %d, %v", len(entries), err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		path := filepath.Join(logDir, entries[0].Name())
		saved, err := os.ReadFile(path)
		if err != nil || !bytes.Equal(body, saved) || bytes.Contains(saved, []byte("test-key")) {
			t.Errorf("saved request does not match exact outbound body or contains authorization: %v", err)
		}
		if info, err := entries[0].Info(); err != nil || info.Mode().Perm() != 0o600 {
			t.Errorf("request log is not owner-only: %v", err)
		}

		var payload struct {
			Model string `json:"model"`
			Input string `json:"input"`
			Store *bool  `json:"store"`
		}
		if err := json.Unmarshal(body, &payload); err != nil {
			t.Errorf("expected one text input: %v", err)
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if payload.Model != openAIModel || payload.Store == nil || *payload.Store {
			t.Error("unexpected model or storage setting")
		}

		var data struct {
			AspectRatio float64              `json:"aspect_ratio"`
			Frames      [][2]json.RawMessage `json:"frames"`
		}
		if err := json.Unmarshal([]byte(payload.Input), &data); err != nil {
			t.Errorf("decode upstream landmarks: %v", err)
			return
		}
		if len(data.Frames) != 60 || data.AspectRatio != 1.7778 {
			t.Errorf("expected all 60 frames and aspect ratio, got %d frames, %v", len(data.Frames), data.AspectRatio)
			return
		}
		for index, frame := range data.Frames {
			var timestamp int
			if err := json.Unmarshal(frame[0], &timestamp); err != nil || timestamp != index*167 {
				t.Errorf("frame %d: unexpected timestamp %d, %v", index, timestamp, err)
			}
		}
		if string(data.Frames[0][1]) != "[]" || !strings.Contains(string(data.Frames[59][1]), `["Left",[[500,400,-17]`) {
			t.Error("expected empty start and hand coordinates at end")
		}
		_, _ = w.Write([]byte(`{"status":"completed","output":[{"type":"message","content":[{"type":"output_text","text":"{\"signs\":[{\"gloss\":\"HELLO\",\"translation\":\"привет\",\"start_frame\":6,\"end_frame\":9},{\"gloss\":\"hawaii\",\"translation\":\"Гавайи\",\"start_frame\":1,\"end_frame\":5},{\"gloss\":\"invalid\",\"translation\":\"\",\"start_frame\":0,\"end_frame\":60}]}"}]}]}`))
	}))
	defer upstream.Close()

	valid := recording{AspectRatio: 1.7778, Frames: make([]frame, 60)}
	for index := range valid.Frames {
		valid.Frames[index].TimestampMS = index * 167
	}
	empty, err := json.Marshal(valid)
	if err != nil {
		t.Fatal(err)
	}
	valid.Frames[1].Hands = []hand{{Side: "Right", Points: make([]point, 21)}}
	points := make([]point, 21)
	points[0] = point{500, 400, -17}
	valid.Frames[59].Hands = []hand{{Side: "Left", Points: points}}
	populated, err := json.Marshal(valid)
	if err != nil {
		t.Fatal(err)
	}

	proxy := recognizeHandler(openAIRecognizer{client: upstream.Client(), url: upstream.URL, key: "test-key", model: openAIModel, requestLogDir: logDir})
	for _, test := range []struct {
		name   string
		body   string
		status int
		gloss  string
	}{
		{"no hands", string(empty), http.StatusOK, ""},
		{"missing frames", `{"frames":[]}`, http.StatusBadRequest, ""},
		{"bad landmark", strings.Replace(string(populated), "[0,0,0]", "[0,0]", 1), http.StatusBadRequest, ""},
		{"image rejected", strings.TrimSuffix(string(populated), "}") + `,"image":"legacy"}`, http.StatusBadRequest, ""},
		{"timestamps not increasing", strings.Replace(string(populated), `"timestamp_ms":167`, `"timestamp_ms":0`, 1), http.StatusBadRequest, ""},
		{"trailing JSON", string(populated) + "{}", http.StatusBadRequest, ""},
		{"recognized", string(populated), http.StatusOK, "HAWAII HELLO"},
	} {
		t.Run(test.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/recognize", bytes.NewBufferString(test.body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()
			proxy.ServeHTTP(rec, req)
			if rec.Code != test.status {
				t.Fatalf("got HTTP %d, want %d: %s", rec.Code, test.status, rec.Body.String())
			}
			if rec.Code == http.StatusOK {
				var sign recognition
				if err := json.Unmarshal(rec.Body.Bytes(), &sign); err != nil {
					t.Fatal(err)
				}
				var glosses []string
				for _, word := range sign.Signs {
					glosses = append(glosses, word.Gloss)
				}
				if got := strings.Join(glosses, " "); got != test.gloss {
					t.Errorf("got %q, want %q", got, test.gloss)
				}
			}
		})
	}
	if got := calls.Load(); got != 1 {
		t.Errorf("upstream received %d requests, want one", got)
	}
}
