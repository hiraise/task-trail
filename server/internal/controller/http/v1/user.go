package v1

import (
	"log/slog"
	"net/http"
	"task-trail/error/validationerr"
	"task-trail/internal/controller/http/v1/request"
	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

type usersRoutes struct {
	u usecase.User
	l *slog.Logger
}

// @Summary 	create new user
// @Description endpoint for create new user
// @Tags 		/v1/users
// @Accept 		json
// @Produce 	json
// @Param 		body body request.User true "user email and password"
// @Success 	200
// @Failure		400 {object} customerrors.ErrBase
// @Failure		409 {object} customerrors.ErrBase
// @Router 		/v1/users [post]
func (r *usersRoutes) createNew(c *gin.Context) {
	var body request.User
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		c.Error(validationerr.New(err))
		return
	}
	err := r.u.CreateNew(c, body.Email, body.Password)
	if err != nil {
		c.Error(err)
		return
	}
	c.JSON(http.StatusOK, nil)
}

func NewUserRouter(router *gin.RouterGroup, u usecase.User, l *slog.Logger) {
	r := &usersRoutes{u: u, l: l}
	g := router.Group("/users")
	g.POST("", r.createNew)
}
