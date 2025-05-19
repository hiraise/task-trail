package password

type Service interface {
	ComparePassword(password string, hash string) error
	HashPassword(password string) (string, error)
}
