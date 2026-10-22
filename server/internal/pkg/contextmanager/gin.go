package contextmanager

import (
	"fmt"
	"net/http"
	"task-trail/internal/domain/service"

	"github.com/gin-gonic/gin"
)

// Session cookie paths follow the API prefix (contract): the access token goes to the whole API,
// the refresh token — only to the access endpoints.
const (
	accessTokenPath  = "/"
	refreshTokenPath = "/v1/auth/"
	// legacyRefreshTokenPath — the refresh token cookie path of the old API. Such a cookie
	// with a more specific path is sent first and shadows the new one, so we delete it.
	legacyRefreshTokenPath = "/v1/auth/refresh"
)

type GinContextManager struct {
	ATName       string
	RTName       string
	clock        service.Clock
	atPath       string
	rtPath       string
	legacyRTPath string
}

// NewGin takes the API prefix (APP_ROOT_PATH): cookie paths are counted from it.
func NewGin(atName string, rtName string, rootPath string, clock service.Clock) *GinContextManager {
	return &GinContextManager{
		ATName:       atName,
		RTName:       rtName,
		clock:        clock,
		atPath:       rootPath + accessTokenPath,
		rtPath:       rootPath + refreshTokenPath,
		legacyRTPath: rootPath + legacyRefreshTokenPath,
	}
}

func (m *GinContextManager) DeleteAccessToken(c *gin.Context) {
	m.setCookie(c, m.ATName, "", -1, m.atPath)
}

// DeleteTokens closes the session in the browser: deletes both cookies and the old API cookie.
func (m *GinContextManager) DeleteTokens(c *gin.Context) {
	m.setCookie(c, m.ATName, "", -1, m.atPath)
	m.setCookie(c, m.RTName, "", -1, m.rtPath)
	m.setCookie(c, m.RTName, "", -1, m.legacyRTPath)
}

func (m *GinContextManager) SetTokens(c *gin.Context, at service.IssuedToken, rt service.IssuedToken) {
	now := m.clock.Now()
	m.setCookie(c, m.ATName, at.Token, int(at.ExpiredAt.Sub(now).Seconds()), m.atPath)
	m.setCookie(c, m.RTName, rt.Token, int(rt.ExpiredAt.Sub(now).Seconds()), m.rtPath)
	m.setCookie(c, m.RTName, "", -1, m.legacyRTPath)
}

func (m *GinContextManager) setCookie(c *gin.Context, name, value string, maxAge int, path string) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(name, value, maxAge, path, "", true, true)
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
