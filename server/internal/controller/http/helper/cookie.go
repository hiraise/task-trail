package helper

import (
	"net/http"

	"task-trail/internal/pkg/token"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	ATName = "at"
	RTName = "rt"
)

func DeleteAccessToken(c *gin.Context) {
	DeleteCookie(c, ATName)
}

func DeleteRefreshToken(c *gin.Context) {
	DeleteCookie(c, RTName)
}

func DeleteCookie(c *gin.Context, name string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(name, "", -1, "/", "", true, true)
}

func SetTokens(c *gin.Context, at *token.Token, rt *token.Token, refreshPath string) {
	c.SetSameSite(http.SameSiteLaxMode)
	atTime := int(time.Until(at.Exp).Seconds())
	rtTime := int(time.Until(rt.Exp).Seconds())
	c.SetCookie(ATName, at.Token, atTime, "/", "", true, true)
	c.SetCookie(RTName, rt.Token, rtTime, refreshPath, "", true, true)
}
