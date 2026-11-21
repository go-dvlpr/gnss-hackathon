package main

import (
	"errors"
	"fmt"
	"os"
	"time"
)

// saveModelRequest writes the exact outbound JSON without HTTP headers.
func saveModelRequest(dir string, payload []byte) (string, error) {
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return "", fmt.Errorf("create request log directory: %w", err)
	}

	prefix := time.Now().UTC().Format("20060102T150405.000000000Z-")
	file, err := os.CreateTemp(dir, prefix+"*.json")
	if err != nil {
		return "", fmt.Errorf("create request log: %w", err)
	}

	_, writeErr := file.Write(payload)
	if err := errors.Join(writeErr, file.Close()); err != nil {
		return "", fmt.Errorf("write request log: %w", errors.Join(err, os.Remove(file.Name())))
	}
	return file.Name(), nil
}
