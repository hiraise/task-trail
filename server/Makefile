-include .env
.PHONY: swag, mock, test, testcov, migrate-down, migrate-up, linter

swag:
	swag init -g ./internal/presentation/http/router.go

mock:

	mockgen -source=internal/domain/service/password/password.go -destination=test/mocks/mock_password.go -package=mocks -package=mocks -mock_names=Service=MockPasswordService
	mockgen -source=internal/domain/service/access_token.go -destination=test/mocks/mock_access_token.go -package=mocks -mock_names=Service=MockAccessTokenService
	mockgen -source=internal/domain/repository/confirmation_token.go -destination=test/mocks/mock_confirmation_token.go -package=mocks -mock_names=Service=MockConfirmationTokenRepository
	mockgen -source=internal/domain/repository/refresh_token.go -destination=test/mocks/mock_refresh_token.go -package=mocks -mock_names=Service=MockRefreshTokenRepository
	mockgen -source=internal/domain/repository/user.go -destination=test/mocks/mock_user.go -package=mocks -mock_names=Service=MockUserRepository
	mockgen -source=internal/domain/service/access_notifier.go -destination=test/mocks/mock_access_notifier.go -package=mocks -mock_names=Service=MockAccessNotifier
	mockgen -source=internal/domain/service/id_generator.go -destination=test/mocks/mock_id_generator.go -package=mocks -mock_names=Service=MockIdGenerator
	mockgen -source=internal/application/transaction/transaction.go -destination=test/mocks/mock_transaction.go -package=mocks -mock_names=Service=MockTxManager

test:
	go test -v -race -covermode atomic -coverprofile=coverage.out ./internal/...

test-integration:
	go test -v -race -covermode atomic -coverprofile=coverage.out ./internal/... --tags=integration

testcov: 
	go test -v -race -covermode atomic -coverprofile=coverage.out ./internal/... --tags=integration
	go tool cover -html=coverage.out 

migrate-up-force:
	migrate -database ${PG_CONNECTION_STRING}\?sslmode=disable -path ./migrations force $(V)

migrate-up:
	migrate -database ${PG_CONNECTION_STRING}\?sslmode=disable -path ./migrations up 

migrate-down:
	migrate -database ${PG_CONNECTION_STRING}\?sslmode=disable -path ./migrations down 1

linter:
	golangci-lint run