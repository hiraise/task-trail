package middleware

import (
	"net/http"
	"reflect"
	"strings"
	"sync"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/logger"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

var bindingOnce sync.Once

// Setup attaches the common middleware and unknown-path responses to the engine. The server and
// handler tests build the engine the same way, so tests see the same responses as the client.
func Setup(engine *gin.Engine, ids *id.UUIDGenerator, m *contextmanager.GinContextManager, l logger.Logger) {
	bindingOnce.Do(configureBinding)
	engine.Use(NewRequest(ids, m), NewResponseLog(l, m), NewRecovery(l, m), NewError(l, m))
	notFound := func(c *gin.Context) {
		c.AbortWithStatusJSON(http.StatusNotFound, response.NewApiErr(http.StatusNotFound, response.CodeNotFound, "no such path"))
	}
	engine.NoRoute(notFound)
	engine.NoMethod(notFound)
}

// configureBinding configures request body parsing once per process: gin and validator
// settings are global. Unknown fields are an error, and validation errors name fields
// as in the request JSON, not as in the Go struct.
func configureBinding() {
	binding.EnableDecoderDisallowUnknownFields = true
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		if err := request.RegisterValidators(v); err != nil {
			panic(err)
		}
		v.RegisterTagNameFunc(func(field reflect.StructField) string {
			name, _, _ := strings.Cut(field.Tag.Get("json"), ",")
			switch name {
			case "-":
				return ""
			case "":
				return field.Name
			}
			return name
		})
	}
}
