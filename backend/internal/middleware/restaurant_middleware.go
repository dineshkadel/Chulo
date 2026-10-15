package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/services"
)

const (
	restaurantIDKey    contextKey = "chulo_restaurant_id"
	restaurantEmailKey contextKey = "chulo_restaurant_email"
)

var ErrRestaurantNotInContext = errors.New("restaurant not found in request context")

// RestaurantAuthMiddleware validates JWT access tokens issued specifically for restaurants.
func RestaurantAuthMiddleware(authService services.RestaurantAuthService) func(http.Handler) http.Handler {
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
			if err != nil || claims.TokenType != "access" || claims.Role != "restaurant" {
				dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired restaurant access token", "Please log in again")
				return
			}

			ctx := context.WithValue(r.Context(), restaurantIDKey, claims.RestaurantID)
			ctx = context.WithValue(ctx, restaurantEmailKey, claims.Email)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetRestaurantID(ctx context.Context) (uint, error) {
	val := ctx.Value(restaurantIDKey)
	if id, ok := val.(uint); ok && id > 0 {
		return id, nil
	}
	return 0, ErrRestaurantNotInContext
}

func GetRestaurantEmail(ctx context.Context) (string, error) {
	val := ctx.Value(restaurantEmailKey)
	if email, ok := val.(string); ok && email != "" {
		return email, nil
	}
	return "", ErrRestaurantNotInContext
}
