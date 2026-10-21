package password

type PasswordHasher interface {
	HashPassword(password string) (string, error)
}

type PasswordComparator interface {
	ComparePassword(password string, hash string) (bool, error)
}
type PasswordService interface {
	PasswordHasher
	PasswordComparator
}
