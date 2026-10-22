package request

import (
	"net/url"
	"strconv"

	"github.com/go-playground/validator/v10"
)

// RegisterValidators добавляет проверки, которых нет в валидаторе:
//   - maxbytes=N — строка не длиннее N байт в UTF-8 (пароль и предел bcrypt);
//   - httpurl — полный адрес http(s) без параметров и якоря: от него строятся ссылки (ADR-0015);
//   - taskstatus — статус задачи из фиксированного набора (ADR-0003);
//   - mailbox — отправитель письма: адрес почты, можно с именем (ADR-0017);
//   - значения полей Optional и обязательные поля, которые могут быть null.
func RegisterValidators(v *validator.Validate) error {
	if err := v.RegisterValidation("maxbytes", maxBytes); err != nil {
		return err
	}
	if err := v.RegisterValidation("httpurl", httpURL); err != nil {
		return err
	}
	if err := v.RegisterValidation("taskstatus", taskStatus); err != nil {
		return err
	}
	if err := v.RegisterValidation("mailbox", mailbox); err != nil {
		return err
	}
	v.RegisterCustomTypeFunc(optionalValue[string], Optional[string]{})
	v.RegisterStructValidation(requireUsername, updateCurrentUserReq{})
	v.RegisterStructValidation(checkRename, renameReq{})
	v.RegisterStructValidation(requireAssignee, changeTaskAssigneeReq{})
	return nil
}

// requireUsername: имя обязательно в запросе, null — убрать имя (UpdateCurrentUserRequest в контракте).
func requireUsername(sl validator.StructLevel) {
	if r := sl.Current().Interface().(updateCurrentUserReq); !r.Username.Set {
		sl.ReportError(r.Username, "username", "Username", "required", "")
	}
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
