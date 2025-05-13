FROM golang:1.24 AS builder
# Setting working directory

WORKDIR /build

ADD go.mod .

COPY . .

RUN go build -C /build/cmd/app /build/app

FROM alpine

WORKDIR /build

COPY --from=builder /build/app /build/app

CMD [". /app"]