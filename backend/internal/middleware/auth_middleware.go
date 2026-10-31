package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/services"
)

// ─── Context key type ──────────────────────────────────────────────────────────

type contextKey string

const (
	userIDKey            contextKey = "chulo_user_id"
	emailKey             contextKey = "chulo_user_email"
	userRoleKey          contextKey = "chulo_user_role"
	deliveryPersonIDKey  contextKey = "chulo_delivery_person_id"
)

var (
	ErrUserNotInContext           = errors.New("user not found in request context")
	ErrDeliveryPersonNotInContext = errors.New("delivery person not found in request context")
)

// ─── User Auth Middleware ──────────────────────────────────────────────────────

// AuthMiddleware validates a user Bearer token and injects claims into the request context.
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
			if err != nil || claims.TokenType != "access" || claims.UserID == 0 {
				dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired access token", "Please log in again")
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
			ctx = context.WithValue(ctx, emailKey, claims.Email)
			ctx = context.WithValue(ctx, userRoleKey, claims.Role)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// AdminOnly restricts access to users with the admin role.
func AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		role, _ := r.Context().Value(userRoleKey).(string)
		if !strings.EqualFold(role, "admin") {
			dto.WriteError(w, http.StatusForbidden, "FORBIDDEN", "Admin access required", "")
			return
		}
		next.ServeHTTP(w, r)
	})
}

// GetUserID extracts the authenticated user ID from the context.
func GetUserID(ctx context.Context) (uint, error) {
	val := ctx.Value(userIDKey)
	if id, ok := val.(uint); ok && id > 0 {
		return id, nil
	}
	return 0, ErrUserNotInContext
}

// GetUserEmail extracts the authenticated user email from the context.
func GetUserEmail(ctx context.Context) (string, error) {
	val := ctx.Value(emailKey)
	if email, ok := val.(string); ok && email != "" {
		return email, nil
	}
	return "", ErrUserNotInContext
}

// ─── Delivery Person Auth Middleware ───────────────────────────────────────────

// DeliveryPersonAuthMiddleware validates a delivery person Bearer token and injects claims into the request context.
func DeliveryPersonAuthMiddleware(authService services.DeliveryPersonAuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
				dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization header", "Expected format: Bearer <token>")
				return
			}
			claims, err := authService.ParseToken(parts[1])
			if err != nil || claims.TokenType != "access" || claims.Role != "delivery_person" {
				dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired delivery person access token", "Please log in again")
				return
			}
			ctx := context.WithValue(r.Context(), deliveryPersonIDKey, claims.DeliveryPersonID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetDeliveryPersonID extracts the authenticated delivery person ID from the context.
func GetDeliveryPersonID(ctx context.Context) (uint, error) {
	if id, ok := ctx.Value(deliveryPersonIDKey).(uint); ok && id > 0 {
		return id, nil
	}
	return 0, ErrDeliveryPersonNotInContext
}
