package v1

import (
	"net/http"
	"task-trail/error/validationerr"
	"task-trail/internal/controller/http/v1/request"
	"task-trail/internal/usecase"
	"task-trail/pkg/logger"

	"github.com/gin-gonic/gin"
)

type usersRoutes struct {
	u usecase.User
	l logger.Logger
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

// @Summary 	return user by id
// @Description ...
// @Tags 		/v1/users
// @Accept 		json
// @Produce 	json
// @Param 		id path int true "user id"
// @Success 	200
// @Router 		/v1/users/{id} [get]
func (r *usersRoutes) getUser(c *gin.Context) {
	// id := c.Param("id")
	c.JSON(http.StatusOK, c.Keys["userId"])
}

func NewUserRouter(router *gin.RouterGroup, u usecase.User, l logger.Logger, authMW gin.HandlerFunc) {
	r := &usersRoutes{u: u, l: l}
	g := router.Group("/users")
	g.POST("", r.createNew)
	g.GET(":id", authMW, r.getUser)
}
