package response

import (
	"task-trail/internal/usecase/dto"
)

type avatarRes struct {
	AvatarUrl string `json:"avatarUrl"`
}

func NewAvatarResFromDTO(data *dto.UserAvatar) *avatarRes {
	return &avatarRes{AvatarUrl: data.AvatarURL}
}

type currentRes struct {
	ID        int     `json:"id"`
	Email     string  `json:"email"`
	Username  *string `json:"username"`
	AvatarUrl *string `json:"avatarUrl"`
}

func NewCurrentResFromDTO(data *dto.CurrentUser) *currentRes {
	return &currentRes{
		ID:        data.ID,
		Username:  data.Username,
		Email:     data.Email,
		AvatarUrl: data.AvatarURL,
	}
}

type userSimpleRes struct {
	ID       int     `json:"id"`
	Email    string  `json:"email"`
	Username *string `json:"username"`
}

func NewUserSimpleResFromDTO(data *dto.UserSimple) *userSimpleRes {
	return &userSimpleRes{ID: data.ID, Email: data.Email, Username: data.Username}
}

func NewUserSimpleResFromDTOBatch(data []*dto.UserSimple) []*userSimpleRes {
	if len(data) == 0 {
		return []*userSimpleRes{}
	}
	var retVal []*userSimpleRes
	for _, v := range data {
		retVal = append(retVal, NewUserSimpleResFromDTO(v))
	}
	return retVal
}
