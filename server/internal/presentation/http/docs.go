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

// swaggerInitializer replaces swagger-initializer.js from the Swagger UI build: that one opens
// the petstore example, this one opens the contract next to it.
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

// newDocsRouter serves Swagger UI with the api/openapi.yaml contract (ADR-0005) at /docs/ — always,
// but only to a service administrator (ADR-0014). "Try it out" calls the API with the administrator's
// cookie: the server in the contract is the relative address ".." from openapi.yaml.
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
			c.AbortWithStatusJSON(http.StatusNotFound, response.NewApiErr(http.StatusNotFound, response.CodeNotFound, "no such file"))
			return
		}
		c.FileFromFS(file, http.FS(swaggerfiles.FS))
	}
}
