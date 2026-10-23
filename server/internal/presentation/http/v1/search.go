package v1

import (
	"fmt"
	"net/http"
	"strings"
	"unicode/utf8"

	"task-trail/internal/application/service/search"
	"task-trail/internal/domain"
	"task-trail/internal/pkg/contextmanager"
	"task-trail/internal/presentation/http/v1/request"
	"task-trail/internal/presentation/http/v1/response"
	"task-trail/internal/utils"

	"github.com/gin-gonic/gin"
)

// maxSearchQuery — the longest q in characters after trimming (ADR-0030).
const maxSearchQuery = 100

// searchRoutes is search: /v1/search in the contract (ADR-0030).
type searchRoutes struct {
	cm       *contextmanager.GinContextManager
	services *search.SearchModule
}

func (r *searchRoutes) search(c *gin.Context) {
	q, err := searchQuery(c)
	if err != nil {
		_ = c.Error(err)
		return
	}
	result, err := r.services.Search.Execute(c, utils.Must(r.cm.GetUserID(c)), q)
	if err != nil {
		_ = c.Error(err)
		return
	}
	c.JSON(http.StatusOK, response.NewSearchResult(result))
}

// searchQuery is q from the query string: 1–100 characters after trimming, otherwise VALIDATION_FAILED
// with details.q.
func searchQuery(c *gin.Context) (string, error) {
	q := strings.TrimSpace(c.Query("q"))
	switch {
	case q == "":
		return "", domain.ErrInputValidation(0, request.FieldErrors{"q": "обязательное поле"})
	case utf8.RuneCountInString(q) > maxSearchQuery:
		return "", domain.ErrInputValidation(0, request.FieldErrors{"q": fmt.Sprintf("не длиннее %d", maxSearchQuery)})
	}
	return q, nil
}

func NewSearchRouter(
	router *gin.RouterGroup,
	services *search.SearchModule,
	authMW gin.HandlerFunc,
	cm *contextmanager.GinContextManager,
) {
	r := &searchRoutes{cm: cm, services: services}
	router.GET("/search", authMW, r.search)
}
