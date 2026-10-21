package middleware

import (
	"net/http"
	"reflect"
	"strings"
	"sync"
	"task-trail/internal/infrastructure/service/id"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/pkg/logger"
	"task-trail/internal/presentation/http/v1/response"

	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
)

var bindingOnce sync.Once

// Setup подключает к движку общие middleware и ответы на неизвестный путь. Сервер и тесты
// обработчиков собирают движок одинаково, поэтому тесты видят те же ответы, что и клиент.
func Setup(engine *gin.Engine, ids *id.UUIDGenerator, m *contextmanager.GinContextManager, l logger.Logger) {
	bindingOnce.Do(configureBinding)
	engine.Use(NewRequest(ids, m), NewResponseLog(l, m), NewRecovery(l, m), NewError(l, m))
	notFound := func(c *gin.Context) {
		c.AbortWithStatusJSON(http.StatusNotFound, response.NewApiErr(http.StatusNotFound, response.CodeNotFound, "нет такого пути"))
	}
	engine.NoRoute(notFound)
	engine.NoMethod(notFound)
}

// configureBinding настраивает разбор тел запросов один раз на процесс: настройки gin
// и валидатора глобальные. Лишние поля — ошибка, а в ошибках проверки поля называются
// так же, как в JSON запроса, а не как в структуре Go.
func configureBinding() {
	binding.EnableDecoderDisallowUnknownFields = true
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
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
