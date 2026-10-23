-include .env
.PHONY: mock, test, testcov, migrate-down, migrate-up, linter

mock:

	mockgen -source=internal/domain/service/password/password.go -destination=test/mocks/mock_password.go -package=mocks -package=mocks -mock_names=Service=MockPasswordService
	mockgen -source=internal/domain/service/access_token.go -destination=test/mocks/mock_access_token.go -package=mocks -mock_names=Service=MockAccessTokenService
	mockgen -source=internal/domain/repository/refresh_token.go -destination=test/mocks/mock_refresh_token.go -package=mocks -mock_names=Service=MockRefreshTokenRepository
	mockgen -source=internal/domain/repository/user.go -destination=test/mocks/mock_user.go -package=mocks -mock_names=Service=MockUserRepository
	mockgen -source=internal/domain/repository/settings.go -destination=test/mocks/mock_settings.go -package=mocks -mock_names=Service=MockSettingsRepository
	mockgen -source=internal/domain/repository/password_reset.go -destination=test/mocks/mock_password_reset.go -package=mocks
	mockgen -source=internal/domain/repository/invitation.go -destination=test/mocks/mock_invitation.go -package=mocks
	mockgen -source=internal/domain/repository/project_member.go -destination=test/mocks/mock_project_member.go -package=mocks
	mockgen -source=internal/domain/repository/project.go -destination=test/mocks/mock_project.go -package=mocks
	mockgen -source=internal/domain/repository/board.go -destination=test/mocks/mock_board.go -package=mocks
	mockgen -source=internal/domain/repository/task.go -destination=test/mocks/mock_task.go -package=mocks
	mockgen -source=internal/domain/repository/comment.go -destination=test/mocks/mock_comment.go -package=mocks
	mockgen -source=internal/domain/repository/task_event.go -destination=test/mocks/mock_task_event.go -package=mocks
	mockgen -source=internal/domain/repository/label.go -destination=test/mocks/mock_label.go -package=mocks
	mockgen -source=internal/domain/service/mailer.go -destination=test/mocks/mock_mailer.go -package=mocks
	mockgen -source=internal/domain/repository/file.go -destination=test/mocks/mock_file.go -package=mocks
	mockgen -source=internal/domain/service/file_storage.go -destination=test/mocks/mock_file_storage.go -package=mocks
	mockgen -source=internal/domain/service/id_generator.go -destination=test/mocks/mock_id_generator.go -package=mocks -mock_names=Service=MockIdGenerator
	mockgen -source=internal/application/transaction/transaction.go -destination=test/mocks/mock_transaction.go -package=mocks -mock_names=Service=MockTxManager

test:
	go test -v -race -covermode atomic -coverprofile=coverage.out ./internal/...

test-integration:
	go test -v -race -covermode atomic -coverprofile=coverage.out ./internal/... --tags=integration

testcov: 
	go test -v -race -coverpkg=./... -covermode atomic -coverprofile=coverage.out ./internal/... --tags=integration
	go tool cover -html=coverage.out 

migrate-up-force:
	migrate -database ${PG_CONNECTION_STRING}\?sslmode=disable -path ./migrations force $(V)

migrate-up:
	migrate -database ${PG_CONNECTION_STRING}\?sslmode=disable -path ./migrations up 

migrate-down:
	migrate -database ${PG_CONNECTION_STRING}\?sslmode=disable -path ./migrations down 1

linter:
	golangci-lint run