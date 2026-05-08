package contextmanager

import (
	"fmt"
	"net/http"
	"task-trail/internal/application/dto"

	"time"

	"github.com/gin-gonic/gin"
)

type Gin interface {
	DeleteAccessToken(c *gin.Context, name string)
	DeleteTokens(c *gin.Context, refreshPath string)
	SetTokens(c *gin.Context, at dto.AccessToken, rt dto.RefreshToken, refreshPath string)
	SetUserID(c *gin.Context, userID string)
	GetUserID(c *gin.Context) (string, error)
	SetRequestID(c *gin.Context)
	GetRequestID(c *gin.Context) string
}

type GinContextManager struct {
	ATName string
	RTName string
}

func NewGin(atName string, rtName string) *GinContextManager {
	return &GinContextManager{ATName: atName, RTName: rtName}
}

func (m *GinContextManager) DeleteAccessToken(c *gin.Context, name string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(name, "", -1, "/", "", true, true)
}

func (m *GinContextManager) DeleteTokens(c *gin.Context, refreshPath string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(m.ATName, "", -1, "/", "", true, true)
	c.SetCookie(m.RTName, "", -1, refreshPath, "", true, true)
}

func (m *GinContextManager) SetTokens(c *gin.Context, at dto.AccessToken, rt dto.RefreshToken, refreshPath string) {
	c.SetSameSite(http.SameSiteLaxMode)
	atTime := int(time.Until(at.ExpiredAt).Seconds())
	rtTime := int(time.Until(rt.ExpiredAt).Seconds())
	c.SetCookie(m.ATName, at.Token, atTime, "/", "", true, true)
	c.SetCookie(m.RTName, rt.Token, rtTime, refreshPath, "", true, true)
}

func (m *GinContextManager) SetUserID(c *gin.Context, userID string) {
	c.Set("userID", userID)
}

func (m *GinContextManager) GetUserID(c *gin.Context) (string, error) {
	id, ok := c.Keys["userID"]
	if ok {
		if userID, ok := id.(string); ok {
			return userID, nil
		}
	}
	return "", fmt.Errorf("user id not found in request")
}

func (m *GinContextManager) SetRequestID(c *gin.Context, id string) {
	c.Set("reqID", id)
}

// return request id or nil if not found
func (m *GinContextManager) GetRequestID(c *gin.Context) string {
	return c.Keys["reqID"].(string)

}
