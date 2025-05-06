package v1

import (
	"log/slog"
	"net/http"
	"task-trail/internal/controller/http/v1/request"
	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

type registrationRoutes struct {
	u usecase.Registration
	l *slog.Logger
}

// @Summary registration route
// @Schemes
// @Description endpoint for register new user
// @Tags /v1/registration
// @Accept json
// @Produce json
// @Param data body request.Registration true "user email and password"
// @Success 204
// @Router /v1/registration [post]
func (a *registrationRoutes) register(c *gin.Context) {
	var body request.Registration

	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid body",
		})
		return
	}
	err := a.u.Register(c, body.Email, body.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"messsage": err.Error()})
		return
	}
	c.JSON(http.StatusOK, nil)
}

func NewRegistrationRouter(router *gin.RouterGroup, u usecase.Registration, l *slog.Logger) {
	r := &registrationRoutes{u: u, l: l}
	g := router.Group("/registration")
	g.POST("", r.register)
}
