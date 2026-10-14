package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/services"
)

type contextKey string

const (
	userIDKey contextKey = "chulo_user_id"
	emailKey  contextKey = "chulo_user_email"
)

var ErrUserNotInContext = errors.New("user not found in request context")

func AuthMiddleware(authService services.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Authorization header is required", "Please provide a Bearer token")
				return
			}

			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
				dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization header format", "Expected format: Bearer <token>")
				return
			}

			tokenString := parts[1]
			claims, err := authService.ParseToken(tokenString)
			if err != nil || claims.TokenType != "access" {
				dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired access token", "Please log in again")
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
			ctx = context.WithValue(ctx, emailKey, claims.Email)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// extracts the authenticated user from the context.
func GetUserID(ctx context.Context) (uint, error) {
	val := ctx.Value(userIDKey)
	if id, ok := val.(uint); ok && id > 0 {
		return id, nil
	}
	return 0, ErrUserNotInContext
}

// extracts the authenticated user email from the context.
func GetUserEmail(ctx context.Context) (string, error) {
	val := ctx.Value(emailKey)
	if email, ok := val.(string); ok && email != "" {
		return email, nil
	}
	return "", ErrUserNotInContext
}
