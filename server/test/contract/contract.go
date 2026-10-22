// Package contract checks HTTP handler responses against the api/openapi.yaml contract (ADR-0019).
// Used only in tests: kin-openapi does not get into the server binary.
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

// Validator finds the contract operation for a request and checks the response against it.
type Validator struct {
	router routers.Router
}

// Load reads and validates the contract once per test process. A contract that
// kin-openapi cannot parse (a broken reference, a wrong structure) fails the test.
func Load(t testing.TB) *Validator {
	t.Helper()
	loadOnce.Do(func() { loaded, loadErr = load() })
	if loadErr != nil {
		t.Fatalf("contract api/openapi.yaml: %v", loadErr)
	}
	return loaded
}

// findContract looks for api/openapi.yaml upward from the working directory: go test runs tests
// in the package directory, and the path from runtime.Caller with -trimpath is relative.
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
			return "", errors.New("not found in any parent directory")
		}
		dir = parent
	}
}

func load() (*Validator, error) {
	// A file from GET /v1/files/{fileId} is of any type (`*/*` in the contract): otherwise kin-openapi cannot
	// parse an unknown type such as image/png. JSON and other known types are parsed as before.
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
	// In tests handlers are called without the API prefix and with any host.
	doc.Servers = openapi3.Servers{{URL: "/"}}
	router, err := gorillamux.NewRouter(doc)
	if err != nil {
		return nil, err
	}
	return &Validator{router: router}, nil
}

// Formats in JSON Schema 2020-12 are only annotations: without explicit checks a numeric ID would pass
// instead of a UUID, a relative link instead of a URL, and a time not in UTC (ADR-0018).
var formats = map[string]openapi3.StringFormatValidator{
	"uuid":      openapi3.NewRegexpFormatValidator(openapi3.FormatOfStringForUUIDOfRFC9562),
	"email":     openapi3.NewRegexpFormatValidator(openapi3.FormatOfStringForEmail),
	"date-time": openapi3.NewRegexpFormatValidator(`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$`),
	"uri": openapi3.NewCallbackValidator(func(value string) error {
		u, err := url.Parse(value)
		if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
			return errors.New("a full http(s) URL is required")
		}
		return nil
	}),
}

// Check checks the response recorded in rec for request req: the operation and the status exist
// in the contract, headers and body match the schema, the body has no extra fields.
func (v *Validator) Check(t testing.TB, req *http.Request, rec *httptest.ResponseRecorder) {
	t.Helper()
	// Result is a snapshot at WriteHeader time: the client will not receive headers set later.
	res := rec.Result()
	body, _ := io.ReadAll(res.Body)
	if err := v.validate(req, res.StatusCode, res.Header, body); err != nil {
		t.Errorf("%s %s → %d does not match the contract: %v", req.Method, req.URL.Path, res.StatusCode, err)
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

// checkUnknownFields looks for fields in a JSON response that are not in the schema. kin-openapi skips them,
// and so fields of the old API, such as permissions next to role, would remain unnoticed.
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
		return fmt.Errorf("fields not in the contract: %v", unknown)
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
	// In an array, the same extra field repeats in every element
	for i := range out {
		out[i] = arrayIndex.ReplaceAllString(out[i], "[]")
	}
	return slices.Compact(out)
}

// collectProperties collects the schema properties taking allOf and oneOf/anyOf variants into account
// (for example, an object or null). Returns true if the schema allows any fields.
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
