package main

import "testing"

func TestHandShapeDistinguishesExtendedAndCurledFingers(t *testing.T) {
	points := make([]point, 21)
	points[0] = point{200, 500, 0}
	points[4] = point{210, 460, 0}
	for finger := 0; finger < 4; finger++ {
		base := 5 + finger*4
		x := 200 + finger*10
		points[base] = point{x, 450, 0}
		points[base+1] = point{x, 430, 0}
		points[base+2] = point{x, 410, 0}
		points[base+3] = point{x, 390, 0}
	}
	points[12] = points[4]
	shape := handShape(hand{Side: "Right", Points: points}, 1)
	if shape[2] != "ECEE" || shape[3] != "-+--" {
		t.Fatalf("unexpected hand shape: %v", shape)
	}
}

func TestHandGapsUseOnlyComparableImageCoordinates(t *testing.T) {
	left, right := hand{Points: make([]point, 21)}, hand{Points: make([]point, 21)}
	left.Points[9], right.Points[9] = point{0, 100, 0}, point{0, 100, 0}
	for i := 8; i <= 20; i += 4 {
		left.Points[i], right.Points[i] = point{0, 0, -55}, point{30, 0, 100}
	}
	if gaps := handGaps(left, right, 1); gaps != [2]int{3, 5} {
		t.Fatalf("got gaps %v, want [3 5]", gaps)
	}
}

func TestMotionSamplesCoverFirstAndLastFrame(t *testing.T) {
	r := recording{Frames: make([]frame, 50)}
	samples := r.motionSamples()
	if len(samples) != maxMotionSamples || samples[0][0] != 0 || samples[len(samples)-1][0] != 49 {
		t.Fatalf("unexpected coverage: %v", samples)
	}
}
