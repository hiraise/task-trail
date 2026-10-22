# Контекст сборки — корень репозитория: сервер встраивает контракт из api/ (ADR-0023).
#   docker build -f server/docker/Dockerfile .
# Что попадает в контекст — Dockerfile.dockerignore рядом.
FROM golang:1.27 AS builder

ENV CGO_ENABLED=0
WORKDIR /build
COPY api/ api/
COPY server/ server/
RUN go build -C server/cmd/app -o /build/app

FROM alpine
WORKDIR /app
# Миграции встроены в бинарник (server/migrations/migrations.go), отдельно их копировать не нужно
COPY --from=builder /build/app app
CMD ["./app"]
