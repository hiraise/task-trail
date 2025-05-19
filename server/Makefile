.PHONY: swag, mock, test, testcov

swag:
	swag init -g ./internal/controller/http/router.go

mock:

	mockgen -source=internal/pkg/password/contracts.go -destination=test/mocks/mock_password.go -package=mocks -package=mocks -mock_names=Service=MockPasswordService
	mockgen -source=internal/pkg/token/contracts.go -destination=test/mocks/mock_token.go -package=mocks -mock_names=Service=MockTokenService
	mockgen -source=internal/repo/contracts.go -destination=test/mocks/mock_repo.go -package=mocks
	mockgen -source=internal/pkg/uuid/contracts.go -destination=test/mocks/mock_uuid.go -package=mocks

test:
	go test -v -race -covermode atomic -coverprofile=coverage.out ./internal/...

testcov: 
	go test -v -race -covermode atomic -coverprofile=coverage.out ./internal/...
	go tool cover -html=coverage.out 