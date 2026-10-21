package http

import (
	"io/fs"
	"net/http"
	"strings"

	"task-trail/api"
	"task-trail/internal/presentation/http/v1/response"

	"github.com/gin-gonic/gin"
	swaggerfiles "github.com/swaggo/files/v2"
)

// swaggerInitializer заменяет swagger-initializer.js из сборки Swagger UI: тот открывает
// пример petstore, а этот — контракт рядом с собой.
const swaggerInitializer = `window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: "openapi.yaml",
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: "StandaloneLayout",
  });
};
`

// newDocsRouter отдаёт по /docs/ Swagger UI с контрактом api/openapi.yaml (ADR-0005) — всегда,
// но только администратору сервиса (ADR-0014). «Try it out» ходит в API с cookie
// администратора: сервер в контракте — относительный адрес «..» от openapi.yaml.
func newDocsRouter(router *gin.Engine, authMW, adminMW gin.HandlerFunc) {
	router.GET("/docs/*file", authMW, adminMW, serveDocs)
}

func serveDocs(c *gin.Context) {
	c.Header("X-Content-Type-Options", "nosniff")
	switch file := strings.TrimPrefix(c.Param("file"), "/"); file {
	case "", "index.html":
		page, err := fs.ReadFile(swaggerfiles.FS, "index.html")
		if err != nil {
			_ = c.Error(err)
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", page)
	case "openapi.yaml":
		c.Data(http.StatusOK, "application/yaml; charset=utf-8", api.OpenAPI)
	case "swagger-initializer.js":
		c.Data(http.StatusOK, "text/javascript; charset=utf-8", []byte(swaggerInitializer))
	default:
		if _, err := fs.Stat(swaggerfiles.FS, file); err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, response.NewApiErr(http.StatusNotFound, response.CodeNotFound, "нет такого файла"))
			return
		}
		c.FileFromFS(file, http.FS(swaggerfiles.FS))
	}
}
