// Package contract проверяет ответы HTTP-обработчиков по контракту api/openapi.yaml (ADR-0019).
// Используется только в тестах: в бинарник сервера kin-openapi не попадает.
package contract

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"sync"
	"testing"

	"github.com/getkin/kin-openapi/openapi3"
	"github.com/getkin/kin-openapi/openapi3filter"
	"github.com/getkin/kin-openapi/routers"
	"github.com/getkin/kin-openapi/routers/gorillamux"
)

var (
	loadOnce sync.Once
	loaded   *Validator
	loadErr  error
)

// Validator находит операцию контракта по запросу и проверяет по ней ответ.
type Validator struct {
	router routers.Router
}

// Load читает и проверяет контракт один раз на процесс тестов. Контракт, который
// kin-openapi не может разобрать (битая ссылка, неверная структура), роняет тест.
func Load(t testing.TB) *Validator {
	t.Helper()
	loadOnce.Do(func() { loaded, loadErr = load() })
	if loadErr != nil {
		t.Fatalf("контракт api/openapi.yaml: %v", loadErr)
	}
	return loaded
}

// findContract ищет api/openapi.yaml вверх от рабочей папки: go test запускает тесты
// в папке пакета, а путь из runtime.Caller с -trimpath относительный.
func findContract() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		path := filepath.Join(dir, "api", "openapi.yaml")
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", errors.New("не найден ни в одной родительской папке")
		}
		dir = parent
	}
}

func load() (*Validator, error) {
	// Файл из GET /v1/files/{fileId} — любого типа (`*/*` в контракте): незнакомый тип, например
	// image/png, kin-openapi иначе не разберёт. JSON и другие известные типы разбираются как прежде.
	openapi3filter.RegisterBodyDecoder("*/*", openapi3filter.FileBodyDecoder)
	path, err := findContract()
	if err != nil {
		return nil, err
	}
	doc, err := openapi3.NewLoader().LoadFromFile(path)
	if err != nil {
		return nil, err
	}
	if err := doc.Validate(context.Background()); err != nil {
		return nil, err
	}
	// Обработчики в тестах вызываются без префикса API и с любым хостом.
	doc.Servers = openapi3.Servers{{URL: "/"}}
	router, err := gorillamux.NewRouter(doc)
	if err != nil {
		return nil, err
	}
	return &Validator{router: router}, nil
}

// Форматы в JSON Schema 2020-12 — лишь пометки: без явных проверок прошли бы числовой ID
// вместо UUID, относительная ссылка вместо адреса и время не в UTC (ADR-0018).
var formats = map[string]openapi3.StringFormatValidator{
	"uuid":      openapi3.NewRegexpFormatValidator(openapi3.FormatOfStringForUUIDOfRFC9562),
	"email":     openapi3.NewRegexpFormatValidator(openapi3.FormatOfStringForEmail),
	"date-time": openapi3.NewRegexpFormatValidator(`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$`),
	"uri": openapi3.NewCallbackValidator(func(value string) error {
		u, err := url.Parse(value)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
			return errors.New("нужен полный адрес http(s)")
		}
		return nil
	}),
}

// Check проверяет ответ, записанный в rec, на запрос req: операция и статус есть
// в контракте, заголовки и тело соответствуют схеме, лишних полей в теле нет.
func (v *Validator) Check(t testing.TB, req *http.Request, rec *httptest.ResponseRecorder) {
	t.Helper()
	// Result — снимок на момент WriteHeader: заголовки, поставленные позже, клиент не получит.
	res := rec.Result()
	body, _ := io.ReadAll(res.Body)
	if err := v.validate(req, res.StatusCode, res.Header, body); err != nil {
		t.Errorf("%s %s → %d не по контракту: %v", req.Method, req.URL.Path, res.StatusCode, err)
	}
}

func (v *Validator) validate(req *http.Request, status int, header http.Header, body []byte) error {
	route, params, err := v.router.FindRoute(req)
	if err != nil {
		return err
	}
	err = openapi3filter.ValidateResponse(context.Background(), &openapi3filter.ResponseValidationInput{
		RequestValidationInput: &openapi3filter.RequestValidationInput{Request: req, PathParams: params, Route: route},
		Status:                 status,
		Header:                 header,
		Body:                   io.NopCloser(bytes.NewReader(body)),
		Options: &openapi3filter.Options{
			IncludeResponseStatus:   true,
			SchemaValidationOptions: []openapi3.SchemaValidationOption{openapi3.WithStringFormatValidators(formats)},
		},
	})
	if err != nil {
		return err
	}
	return checkUnknownFields(route.Operation.Responses.Status(status), header, body)
}

// checkUnknownFields ищет в JSON-ответе поля, которых нет в схеме. kin-openapi их пропускает,
// а так незаметно остались бы поля старого API, например permissions рядом с role.
func checkUnknownFields(response *openapi3.ResponseRef, header http.Header, body []byte) error {
	mediaType, _, _ := mime.ParseMediaType(header.Get("Content-Type"))
	if response == nil || mediaType != "application/json" || len(body) == 0 {
		return nil
	}
	media := response.Value.Content.Get(mediaType)
	if media == nil || media.Schema == nil {
		return nil
	}
	var value any
	if err := json.Unmarshal(body, &value); err != nil {
		return err
	}
	if unknown := unknownFields(media.Schema.Value, value, "$"); len(unknown) > 0 {
		return fmt.Errorf("поля, которых нет в контракте: %v", unknown)
	}
	return nil
}

var arrayIndex = regexp.MustCompile(`\[\d+\]`)

func unknownFields(schema *openapi3.Schema, value any, path string) []string {
	var out []string
	switch v := value.(type) {
	case map[string]any:
		props := map[string]*openapi3.SchemaRef{}
		if collectProperties(schema, props) {
			return nil
		}
		for name, child := range v {
			prop, ok := props[name]
			if !ok {
				out = append(out, path+"."+name)
				continue
			}
			out = append(out, unknownFields(prop.Value, child, path+"."+name)...)
		}
	case []any:
		if items := arrayItems(schema); items != nil {
			for i, child := range v {
				out = append(out, unknownFields(items, child, fmt.Sprintf("%s[%d]", path, i))...)
			}
		}
	}
	slices.Sort(out)
	// В массиве одно и то же лишнее поле повторяется в каждом элементе
	for i := range out {
		out[i] = arrayIndex.ReplaceAllString(out[i], "[]")
	}
	return slices.Compact(out)
}

// collectProperties собирает свойства схемы с учётом allOf и вариантов oneOf/anyOf
// (например, объект или null). Возвращает true, если схема разрешает любые поля.
func collectProperties(schema *openapi3.Schema, props map[string]*openapi3.SchemaRef) bool {
	if schema.AdditionalProperties.Schema != nil ||
		(schema.AdditionalProperties.Has != nil && *schema.AdditionalProperties.Has) {
		return true
	}
	for name, prop := range schema.Properties {
		props[name] = prop
	}
	open := false
	for _, group := range [][]*openapi3.SchemaRef{schema.AllOf, schema.OneOf, schema.AnyOf} {
		for _, sub := range group {
			if sub.Value.Type.Is("null") {
				continue
			}
			open = collectProperties(sub.Value, props) || open
		}
	}
	return open
}

func arrayItems(schema *openapi3.Schema) *openapi3.Schema {
	if schema.Items != nil {
		return schema.Items.Value
	}
	for _, group := range [][]*openapi3.SchemaRef{schema.AllOf, schema.OneOf, schema.AnyOf} {
		for _, sub := range group {
			if items := arrayItems(sub.Value); items != nil {
				return items
			}
		}
	}
	return nil
}
