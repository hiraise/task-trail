package request

import (
	"strings"

	"task-trail/internal/application/dto"
	"task-trail/internal/domain/entity"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

// createLabelReq — CreateLabelRequest: the name is 1–30 characters after trimming (ADR-0035).
type createLabelReq struct {
	Name  string `json:"name" binding:"required,max=30"`
	Color string `json:"color" binding:"required,labelcolor"`
}

func (r *createLabelReq) normalize() { r.Name = strings.TrimSpace(r.Name) }

// updateLabelReq — UpdateLabelRequest. The contract does not allow null, so null is treated as an absent field.
type updateLabelReq struct {
	Name  *string `json:"name" binding:"omitnil,min=1,max=30"`
	Color *string `json:"color" binding:"omitnil,labelcolor"`
}

func (r *updateLabelReq) normalize() {
	if r.Name != nil {
		name := strings.TrimSpace(*r.Name)
		r.Name = &name
	}
}

// checkUpdateLabel: at least one field is required (minProperties 1).
func checkUpdateLabel(sl validator.StructLevel) {
	if r := sl.Current().Interface().(updateLabelReq); r.Name == nil && r.Color == nil {
		sl.ReportError(r.Name, "name", "Name", "required_without", "color")
	}
}

// setTaskLabelsReq — SetTaskLabelsRequest: repeated IDs are rejected, so the service compares counts exactly.
type setTaskLabelsReq struct {
	LabelIDs []string `json:"labelIds" binding:"required,max=10,unique,dive,uuid"`
}

func (r *setTaskLabelsReq) normalize() { normalizeIDs(r.LabelIDs) }

func labelColor(fl validator.FieldLevel) bool {
	return entity.LabelColor(fl.Field().String()).Valid()
}

func BindCreateLabel(c *gin.Context) (dto.LabelData, error) {
	body, err := validate[createLabelReq](c)
	if err != nil {
		return dto.LabelData{}, err
	}
	return dto.LabelData{Name: body.Name, Color: entity.LabelColor(body.Color)}, nil
}

func BindUpdateLabel(c *gin.Context) (dto.LabelChanges, error) {
	body, err := validate[updateLabelReq](c)
	if err != nil {
		return dto.LabelChanges{}, err
	}
	changes := dto.LabelChanges{Name: body.Name}
	if body.Color != nil {
		color := entity.LabelColor(*body.Color)
		changes.Color = &color
	}
	return changes, nil
}

func BindSetTaskLabels(c *gin.Context) ([]string, error) {
	body, err := validate[setTaskLabelsReq](c)
	if err != nil {
		return nil, err
	}
	return body.LabelIDs, nil
}
