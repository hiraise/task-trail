FROM golang:1.24 AS builder
# Setting working directory

WORKDIR /build

ADD go.mod /build/

COPY . /build/

RUN go build -C ./cmd/app ./app

FROM alpine

WORKDIR /build

COPY --from=builder /build/app /build/app

CMD [". /app"]