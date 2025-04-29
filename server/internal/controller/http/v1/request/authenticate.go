package request

type Authenticate struct {
	Login    string `json:"login"`
	Password string `json:"password"`
}
