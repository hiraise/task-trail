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
		c.JSON(http.StatusUnauthorized, gin.H{"messsage": "invalid login or password"})
	}
	c.JSON(http.StatusOK, nil)
}

func NewRegistrationRouter(router *gin.RouterGroup, u usecase.Registration, l *slog.Logger) {
	r := &registrationRoutes{u: u, l: l}
	g := router.Group("/registration")
	g.POST("", r.register)
}
