package request

import "github.com/gin-gonic/gin"

// setReadReq — SetNotificationReadRequest: a pointer, so that required tells a missing field from false.
type setReadReq struct {
	Read *bool `json:"read" binding:"required"`
}

// emailNotificationsReq — EmailNotificationsRequest, the same pointer rule.
type emailNotificationsReq struct {
	Enabled *bool `json:"enabled" binding:"required"`
}

func BindSetRead(c *gin.Context) (bool, error) {
	body, err := validate[setReadReq](c)
	if err != nil {
		return false, err
	}
	return *body.Read, nil
}

func BindEmailNotifications(c *gin.Context) (bool, error) {
	body, err := validate[emailNotificationsReq](c)
	if err != nil {
		return false, err
	}
	return *body.Enabled, nil
}
