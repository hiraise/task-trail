package request

import (
	"net/url"
	"strconv"

	"github.com/go-playground/validator/v10"
)

// RegisterValidators adds checks the validator lacks:
//   - maxbytes=N — a string of at most N bytes in UTF-8 (password and the bcrypt limit);
//   - httpurl — a full http(s) address without query or fragment: links are built from it (ADR-0015);
//   - taskstatus — a task status from the fixed set (ADR-0003);
//   - taskpriority — a task priority from the fixed set (ADR-0033);
//   - projectkey — a project key (ADR-0026), checked after normalizeProjectKey;
//   - mailbox — the mail sender: an email address, optionally with a name (ADR-0017);
//   - values of Optional fields and required fields that may be null (assigneeId, dueDate).
func RegisterValidators(v *validator.Validate) error {
	if err := v.RegisterValidation("maxbytes", maxBytes); err != nil {
		return err
	}
	if err := v.RegisterValidation("httpurl", httpURL); err != nil {
		return err
	}
	if err := v.RegisterValidation("taskstatus", taskStatus); err != nil {
		return err
	}
	if err := v.RegisterValidation("taskpriority", taskPriority); err != nil {
		return err
	}
	if err := v.RegisterValidation("projectkey", projectKey); err != nil {
		return err
	}
	if err := v.RegisterValidation("mailbox", mailbox); err != nil {
		return err
	}
	v.RegisterCustomTypeFunc(optionalValue[string], Optional[string]{})
	v.RegisterStructValidation(requireUsername, updateCurrentUserReq{})
	v.RegisterStructValidation(checkRename, renameReq{})
	v.RegisterStructValidation(checkUpdateProject, updateProjectReq{})
	v.RegisterStructValidation(requireAssignee, changeTaskAssigneeReq{})
	v.RegisterStructValidation(requireDueDate, changeTaskDueDateReq{})
	return nil
}

// requireUsername: the name is required in the request, null removes the name (UpdateCurrentUserRequest in the contract).
func requireUsername(sl validator.StructLevel) {
	if r := sl.Current().Interface().(updateCurrentUserReq); !r.Username.Set {
		sl.ReportError(r.Username, "username", "Username", "required", "")
	}
}

func maxBytes(fl validator.FieldLevel) bool {
	limit, err := strconv.Atoi(fl.Param())
	return err == nil && len(fl.Field().String()) <= limit
}

func httpURL(fl validator.FieldLevel) bool {
	u, err := url.Parse(fl.Field().String())
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != "" &&
		u.User == nil && u.RawQuery == "" && u.Fragment == "" && !u.ForceQuery
}
