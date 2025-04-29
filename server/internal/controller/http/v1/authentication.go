package v1

import (
	"net/http"
	"task-trail/internal/controller/http/v1/request"

	"github.com/gin-gonic/gin"
)

func (a *authenticationRoutes) authenticate(c *gin.Context) {
	var body request.Authenticate

	if err := c.ShouldBind(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "invalid body",
		})
		return
	}
	user, err := a.u.Authenticate(c, body.Login, body.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"messsage": "invalid login or password"})
	}
	c.JSON(http.StatusOK, user)
}
