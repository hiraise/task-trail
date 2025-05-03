package request

type Registration struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
