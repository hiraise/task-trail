package v1

import (
	"net/http"
	"task-trail/internal/controller/http/v1/request"

	"github.com/gin-gonic/gin"
)

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
