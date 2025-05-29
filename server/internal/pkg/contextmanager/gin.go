package contextmanager

import (
	"net/http"
	"task-trail/internal/pkg/token"
	"task-trail/internal/pkg/uuid"
	"time"

	"github.com/gin-gonic/gin"
)

type Gin interface {
	DeleteAccessToken(c *gin.Context, name string)
	DeleteTokens(c *gin.Context, atName string, rtName string, refreshPath string)
	SetTokens(c *gin.Context, at *token.Token, rt *token.Token, atName string, rtName string, refreshPath string)
	SetUserID(c *gin.Context, userID any)
	GetUserID(c *gin.Context) any
	SetRequestID(c *gin.Context)
	GetRequestID(c *gin.Context) any
}

type GinContextManager struct {
	uuidGenerator uuid.Generator
}

func NewGin(uuidGenerator uuid.Generator) *GinContextManager {
	return &GinContextManager{uuidGenerator: uuidGenerator}
}

func (m *GinContextManager) DeleteAccessToken(c *gin.Context, name string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(name, "", -1, "/", "", true, true)
}

func (m *GinContextManager) DeleteTokens(c *gin.Context, atName string, rtName string, refreshPath string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(atName, "", -1, "/", "", true, true)
	c.SetCookie(rtName, "", -1, refreshPath, "", true, true)
}

func (m *GinContextManager) SetTokens(c *gin.Context, at *token.Token, rt *token.Token, atName string, rtName string, refreshPath string) {
	c.SetSameSite(http.SameSiteLaxMode)
	atTime := int(time.Until(at.Exp).Seconds())
	rtTime := int(time.Until(rt.Exp).Seconds())
	c.SetCookie(atName, at.Token, atTime, "/", "", true, true)
	c.SetCookie(rtName, rt.Token, rtTime, refreshPath, "", true, true)
}

func (m *GinContextManager) SetUserID(c *gin.Context, userID any) {
	c.Set("userID", userID)
}

func (m *GinContextManager) GetUserID(c *gin.Context) any {
	return c.Keys["userID"]
}

func (m *GinContextManager) SetRequestID(c *gin.Context) {
	c.Set("reqID", m.uuidGenerator.Generate())
}

// return request id or nil if not found
func (m *GinContextManager) GetRequestID(c *gin.Context) any {
	return c.Keys["reqID"]

}
