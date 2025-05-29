package v1

import (
	"net/http"
	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

type usersRoutes struct {
	u usecase.User
}

// @Summary 	return user by id
// @Description ...
// @Security BearerAuth
// @Tags 		/v1/users
// @Accept 		json
// @Produce 	json
// @Param 		id path int true "user id"
// @Success 	200
// @Router 		/v1/users/{id} [get]
func (r *usersRoutes) getUser(c *gin.Context) {
	// id := c.Param("id")
	c.JSON(http.StatusOK, c.Keys["userID"])
}

func NewUserRouter(router *gin.RouterGroup, u usecase.User, authMW gin.HandlerFunc) {
	r := &usersRoutes{u: u}
	g := router.Group("/users")
	g.GET(":id", authMW, r.getUser)
}
