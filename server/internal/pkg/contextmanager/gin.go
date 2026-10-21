package contextmanager

import (
	"fmt"
	"net/http"
	"task-trail/internal/domain/service"

	"github.com/gin-gonic/gin"
)

// Пути cookie сессии — от префикса API (контракт): access-токен уходит во весь API,
// refresh-токен — только эндпоинтам доступа.
const (
	accessTokenPath  = "/"
	refreshTokenPath = "/v1/auth/"
	// legacyRefreshTokenPath — путь cookie refresh-токена у старого API. Такая cookie
	// с более точным путём уходит первой и заслоняет новую, поэтому её удаляем.
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

// NewGin принимает префикс API (APP_ROOT_PATH): от него считаются пути cookie.
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

// DeleteTokens закрывает сессию в браузере: удаляет обе cookie и cookie старого API.
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
