package access

import (
	"errors"

	"task-trail/internal/domain"
)

func hasCode(err error, code domain.ErrorCode) bool {
	var e *domain.DomainError
	return errors.As(err, &e) && e.Code == code
}

func isEntityNotFound(err error) bool { return hasCode(err, domain.EntityNotFound) }

func isEntityAlreadyExists(err error) bool { return hasCode(err, domain.EntityAlreadyExists) }
