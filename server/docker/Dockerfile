# The build context is the repository root: the server embeds the contract from api/ (ADR-0023).
#   docker build -f server/docker/Dockerfile .
# What goes into the context — Dockerfile.dockerignore next to it.
FROM golang:1.27 AS builder

ENV CGO_ENABLED=0
WORKDIR /build
COPY api/ api/
COPY server/ server/
RUN go build -C server/cmd/app -o /build/app

FROM alpine:3.24
WORKDIR /app
# Migrations are embedded in the binary (server/migrations/migrations.go), no need to copy them separately
COPY --from=builder /build/app app
CMD ["./app"]
