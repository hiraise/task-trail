package request

import (
	"net/url"
	"strconv"

	"github.com/go-playground/validator/v10"
)

// RegisterValidators добавляет проверки, которых нет в валидаторе:
//   - maxbytes=N — строка не длиннее N байт в UTF-8 (пароль и предел bcrypt);
//   - httpurl — полный адрес http(s) без параметров и якоря: от него строятся ссылки (ADR-0015).
func RegisterValidators(v *validator.Validate) error {
	if err := v.RegisterValidation("maxbytes", maxBytes); err != nil {
		return err
	}
	return v.RegisterValidation("httpurl", httpURL)
}

func maxBytes(fl validator.FieldLevel) bool {
	limit, err := strconv.Atoi(fl.Param())
	return err == nil && len(fl.Field().String()) <= limit
}

func httpURL(fl validator.FieldLevel) bool {
	u, err := url.Parse(fl.Field().String())
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != "" &&
		u.User == nil && u.RawQuery == "" && u.Fragment == "" && !u.ForceQuery
}
