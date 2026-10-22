package request

import (
	"encoding/json"
	"maps"
	"reflect"
	"slices"
	"strings"
)

// Optional is a request body field that may be omitted or set to null (ADR-0018:
// an empty value is null). Set means the field is in the request; Value is nil if null came.
//
// Checks from the binding tag apply to the value when it is not null: `binding:"omitnil,max=100"`.
// For that, each Optional[T] type is registered in RegisterValidators (optionalValue[T]).
// A required field that may be null is checked by the request struct validation
// (RegisterValidators): the required tag cannot tell a missing field from null. encoding/json
// reports a value of the wrong type without the field name: the response is VALIDATION_FAILED with details null.
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

// optionalValue gives the validator the field value: nil when null or missing.
func optionalValue[T any](field reflect.Value) any {
	return field.Interface().(Optional[T]).Value
}

// FieldErrors are validation errors found outside the validator: field path → what is wrong with it.
// The response is VALIDATION_FAILED with these fields in details.
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
