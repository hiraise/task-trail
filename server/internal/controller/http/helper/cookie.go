package helper

import (
	"net/http"

	"task-trail/internal/pkg/token"
	"time"

	"github.com/gin-gonic/gin"
)

func DeleteAccessToken(c *gin.Context, name string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(name, "", -1, "/", "", true, true)
}

func DeleteTokens(c *gin.Context, atName string, rtName string, refreshPath string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(atName, "", -1, "/", "", true, true)
	c.SetCookie(rtName, "", -1, refreshPath, "", true, true)
}

func SetTokens(c *gin.Context, at *token.Token, rt *token.Token, atName string, rtName string, refreshPath string) {
	c.SetSameSite(http.SameSiteLaxMode)
	atTime := int(time.Until(at.Exp).Seconds())
	rtTime := int(time.Until(rt.Exp).Seconds())
	c.SetCookie(atName, at.Token, atTime, "/", "", true, true)
	c.SetCookie(rtName, rt.Token, rtTime, refreshPath, "", true, true)
}
