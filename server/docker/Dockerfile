FROM golang:1.24 AS builder
# Setting working directory

WORKDIR /build

ADD go.mod .

COPY . .

RUN go build -C ./cmd/app -o /build/app

FROM alpine

WORKDIR /build

COPY --from=builder /build/app /build/app

CMD ["./app"]