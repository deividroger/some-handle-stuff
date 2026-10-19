package idgen

import (
	"crypto/rand"
	"encoding/hex"

	"some-handle-stuff/internal/core/ports"
)

type Random struct{}

var _ ports.IDGenerator = Random{}

func (Random) NewID() string {
	b := make([]byte, 8)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
