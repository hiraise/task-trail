package service

// LinkTokenGenerator выдаёт случайные токены для ссылок приглашений и сброса пароля (ADR-0016).
type LinkTokenGenerator interface {
	Generate() string
}
