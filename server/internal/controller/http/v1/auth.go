package v1

import (
	"net/http"

	"task-trail/error/validationerr"

	"task-trail/internal/controller/http/helper"
	"task-trail/internal/controller/http/v1/request"
	"task-trail/internal/usecase"
	"task-trail/pkg/logger"

	"github.com/gin-gonic/gin"
)

const (
	refreshPath = "/v1/auth/refresh"
)

type authRoutes struct {
	u usecase.Authentication
	l logger.Logger
}

// @Summary 	login user
// @Description endpoint for login user
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.User true "user email and password"
// @Success 	200
// @Failure		400 {object} customerrors.ErrBase "invalid request body"
// @Failure		401 {object} customerrors.ErrBase "invalid credentials"
// @Failure		500 {object} customerrors.ErrBase "internal error"
// @Router 		/v1/auth/login [post]
func (r *authRoutes) login(c *gin.Context) {
	var body request.User
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		r.l.Warn("invalid request body", "error", err.Error())
		c.Error(validationerr.New(err))
		return
	}
	at, rt, err := r.u.Login(c, body.Email, body.Password)
	if err != nil {
		c.Error(err)
		return
	}
	helper.SetTokens(c, at, rt, refreshPath)
	c.JSON(http.StatusOK, nil)

}

func NewAuthRouter(router *gin.RouterGroup, u usecase.Authentication, l logger.Logger) {
	r := &authRoutes{u: u, l: l}
	g := router.Group("/auth")
	g.POST("/login", r.login)
}
