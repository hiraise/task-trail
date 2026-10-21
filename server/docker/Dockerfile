FROM golang:1.27 AS builder

ENV CGO_ENABLED=0
WORKDIR /build
COPY . .
RUN go build -C ./cmd/app -o /build/app

FROM alpine
WORKDIR /app
# Миграции встроены в бинарник (server/migrations/migrations.go), отдельно их копировать не нужно
COPY --from=builder /build/app app
CMD ["./app"]
