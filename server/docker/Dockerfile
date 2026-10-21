FROM golang:1.27 AS builder
# Setting working directory


ENV CGO_ENABLED=0

WORKDIR /build

COPY . .

RUN go build -C ./cmd/app -o /build/app

FROM alpine

WORKDIR /app

COPY --from=builder /build/app app
COPY --from=builder /build/migrations ./migrations

CMD ["./app"]