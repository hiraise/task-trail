package request

import (
	"task-trail/internal/usecase/dto"

	"github.com/gin-gonic/gin"
)

// updateReq represents the request payload for updating a user's information.
type updateReq struct {
	Username string `json:"username" binding:"max=100"`
}

func BindUserUpdateDTO(c *gin.Context, userID int) (*dto.UserUpdate, error) {
	body, err := validate[updateReq](c)
	if err != nil {
		return nil, err
	}
	return &dto.UserUpdate{ID: userID, Username: body.Username}, nil
}
