FROM golang:alpine AS builder
WORKDIR /app

# copy go.mod/go.sum first so dependency download is cached
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./server


FROM alpine:3.20
RUN adduser -D -u 1001 appuser
WORKDIR /app
COPY --from=builder /server /app/server
USER appuser

EXPOSE 8080
CMD ["/app/server"]