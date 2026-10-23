package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/services"
)

const deliveryPersonIDKey contextKey = "chulo_delivery_person_id"

var ErrDeliveryPersonNotInContext = errors.New("delivery person not found in request context")

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

func GetDeliveryPersonID(ctx context.Context) (uint, error) {
	if id, ok := ctx.Value(deliveryPersonIDKey).(uint); ok && id > 0 {
		return id, nil
	}
	return 0, ErrDeliveryPersonNotInContext
}
