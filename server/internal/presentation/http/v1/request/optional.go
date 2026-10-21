package request

import (
	"encoding/json"
	"maps"
	"reflect"
	"slices"
	"strings"
)

// Optional — поле тела запроса, которое можно не передать или передать null (ADR-0018:
// пустое значение — null). Set — поле есть в запросе; Value — nil, если пришёл null.
//
// Проверки из тега binding применяются к значению, когда оно не null: `binding:"omitnil,max=100"`.
// Для этого каждый тип Optional[T] зарегистрирован в RegisterValidators (optionalValue[T]).
// Обязательное поле, которое может быть null, проверяет проверка структуры запроса
// (RegisterValidators): тег required не отличит отсутствие поля от null. Значение не того
// типа encoding/json сообщает без имени поля: ответ — VALIDATION_FAILED с details null.
type Optional[T any] struct {
	Set   bool
	Value *T
}

func (o *Optional[T]) UnmarshalJSON(data []byte) error {
	o.Set = true
	if string(data) == "null" {
		o.Value = nil
		return nil
	}
	var v T
	if err := json.Unmarshal(data, &v); err != nil {
		return err
	}
	o.Value = &v
	return nil
}

// optionalValue отдаёт валидатору значение поля: nil при null и при отсутствии.
func optionalValue[T any](field reflect.Value) any {
	return field.Interface().(Optional[T]).Value
}

// FieldErrors — ошибки проверки, найденные не валидатором: путь поля → что с ним не так.
// Ответ — VALIDATION_FAILED с этими полями в details.
type FieldErrors map[string]string

func (e FieldErrors) Error() string {
	var b strings.Builder
	for i, field := range slices.Sorted(maps.Keys(e)) {
		if i > 0 {
			b.WriteString("; ")
		}
		b.WriteString(field + ": " + e[field])
	}
	return b.String()
}
