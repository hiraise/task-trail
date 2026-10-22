package service

// LinkTokenGenerator issues random tokens for invitation and password reset links (ADR-0016).
type LinkTokenGenerator interface {
	Generate() string
}
