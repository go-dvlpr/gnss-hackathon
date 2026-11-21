package main

import "math"

const maxMotionSamples = 16

// motionSamples summarizes hand geometry without changing the original frame stream.
func (r recording) motionSamples() [][3]any {
	count := min(len(r.Frames), maxMotionSamples)
	samples := make([][3]any, count)
	for i := range samples {
		index := i * (len(r.Frames) - 1) / max(1, count-1)
		hands := r.Frames[index].Hands
		shapes := make([][4]any, len(hands))
		for j, hand := range hands {
			shapes[j] = handShape(hand, r.AspectRatio)
		}

		gaps := [2]int{-1, -1}
		if len(hands) == 2 {
			gaps = handGaps(hands[0], hands[1], r.AspectRatio)
		}
		samples[i] = [3]any{index, shapes, gaps}
	}
	return samples
}

func handShape(hand hand, aspect float64) [4]any {
	points := hand.Points
	palm := max(1, handDistance(points[0], points[9], aspect, true))
	var flex [4]byte
	var pinches [4]byte
	for i := range flex {
		tip := 8 + i*4
		a, b, c, d := points[tip-3], points[tip-2], points[tip-1], points[tip]
		fingerLength := handDistance(a, b, aspect, true) + handDistance(b, c, aspect, true) + handDistance(c, d, aspect, true)
		straightness := handDistance(a, d, aspect, true) / max(1, fingerLength)
		switch {
		case straightness >= 0.91:
			flex[i] = 'E'
		case straightness <= 0.76:
			flex[i] = 'C'
		default:
			flex[i] = 'B'
		}
		pinches[i] = '-'
		if handDistance(points[4], d, aspect, true)/palm <= 0.34 {
			pinches[i] = '+'
		}
	}
	wrist := [2]int{int(math.Round(float64(points[0][0]) / 10)), int(math.Round(float64(points[0][1]) / 10))}
	return [4]any{hand.Side, wrist, string(flex[:]), string(pinches[:])}
}

func handGaps(first, second hand, aspect float64) [2]int {
	// MediaPipe resets z at each wrist. Cross-hand depth cannot be compared.
	firstPalm := handDistance(first.Points[0], first.Points[9], aspect, false)
	secondPalm := handDistance(second.Points[0], second.Points[9], aspect, false)
	tips := math.Inf(1)
	for a := 8; a <= 20; a += 4 {
		for b := 8; b <= 20; b += 4 {
			tips = min(tips, handDistance(first.Points[a], second.Points[b], aspect, false))
		}
	}
	firstCenter, secondCenter := palmCenter(first), palmCenter(second)
	palmToKnuckle := math.Inf(1)
	for _, index := range [...]int{0, 5, 9, 13, 17} {
		palmToKnuckle = min(palmToKnuckle,
			handDistance(firstCenter, second.Points[index], aspect, false),
			handDistance(secondCenter, first.Points[index], aspect, false))
	}
	unit := max(1, (firstPalm+secondPalm)/2)
	return [2]int{int(math.Round(10 * tips / unit)), int(math.Round(10 * palmToKnuckle / unit))}
}

func palmCenter(h hand) point {
	wrist, knuckle := h.Points[0], h.Points[9]
	return point{wrist[0]/2 + knuckle[0]/2, wrist[1]/2 + knuckle[1]/2, 0}
}

func handDistance(a, b point, aspect float64, useDepth bool) float64 {
	dx := float64(a[0]) - float64(b[0])
	dy := float64(a[1]) - float64(b[1])
	dz := float64(a[2]) - float64(b[2])
	if aspect > 0 {
		dy /= aspect
	}
	if !useDepth {
		dz = 0
	}
	return math.Sqrt(dx*dx + dy*dy + dz*dz)
}
