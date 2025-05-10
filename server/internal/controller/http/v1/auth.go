package v1

import (
	"log/slog"
	"net/http"
	"time"

	"task-trail/error/validationerr"
	"task-trail/internal/controller/http/v1/request"
	"task-trail/internal/pkg/token"
	"task-trail/internal/usecase"

	"github.com/gin-gonic/gin"
)

type authRoutes struct {
	u usecase.Authentication
	l *slog.Logger
}

// @Summary 	login user
// @Description endpoint for login user
// @Tags 		/v1/auth
// @Accept 		json
// @Produce 	json
// @Param 		body body request.User true "user email and password"
// @Success 	200
// @Failure		400 {object} customerrors.ErrBase
// @Failure		401 {object} customerrors.ErrBase
// @Failure		500 {object} customerrors.ErrBase
// @Router 		/v1/auth/login [post]
func (r *authRoutes) login(c *gin.Context) {
	var body request.User
	if err := c.ShouldBindBodyWithJSON(&body); err != nil {
		c.Error(validationerr.New(err))
		return
	}
	at, rt, err := r.u.Login(c, body.Email, body.Password)
	if err != nil {
		c.Error(err)
		return
	}
	setTokens(c, at, rt)
	c.JSON(http.StatusOK, nil)

}

func setTokens(c *gin.Context, at *token.Token, rt *token.Token) {
	c.SetSameSite(http.SameSiteLaxMode)
	kek := int(time.Until(at.Exp).Seconds())
	lol := int(time.Until(rt.Exp).Seconds())
	c.SetCookie("at", at.Token, kek, "/", "", true, true)
	c.SetCookie("rt", rt.Token, lol, "/v1/auth/refresh", "", true, true)
}
func NewAuthRouter(router *gin.RouterGroup, u usecase.Authentication, l *slog.Logger) {
	r := &authRoutes{u: u, l: l}
	g := router.Group("/auth")
	g.POST("/login", r.login)
}
