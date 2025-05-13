FROM golang:1.24 AS builder
# Setting working directory

WORKDIR /build

COPY . .

RUN go build -C ./cmd/app -o /build/app

FROM alpine

WORKDIR /app

COPY --from=builder /build/app app

CMD ["./app"]