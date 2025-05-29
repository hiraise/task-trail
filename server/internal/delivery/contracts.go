package delivery

import (
	"go/token"

	"github.com/gin-gonic/gin"
)

type GinContextManager interface {
	DeleteAccessToken(c *gin.Context, name string)
	DeleteTokens(c *gin.Context, atName string, rtName string, refreshPath string)
	SetTokens(c *gin.Context, at *token.Token, rt *token.Token, atName string, rtName string, refreshPath string)
	SetUserID(c *gin.Context, userID any)
	GetUserID(c *gin.Context) (any, bool)
	SetRequestID(c *gin.Context)
	GetRequestID(c *gin.Context) (any, bool)
}
