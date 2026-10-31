package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/middleware"
	"github.com/dineshkadel/backend/internal/models"
	"github.com/dineshkadel/backend/internal/services"
)

// ─── User Auth Handler ─────────────────────────────────────────────────────────

// AuthHandler handles HTTP requests for user authentication and location.
type AuthHandler struct {
	authService services.AuthService
}

// NewAuthHandler returns a new AuthHandler instance.
func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register creates a new user account with name, email, password, and phone.
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	resp, err := h.authService.Register(r.Context(), req)
	if err != nil {
		handleAuthError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusCreated, resp, nil)
}

// Login authenticates a user and returns JWT access and refresh tokens.
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	resp, err := h.authService.Login(r.Context(), req)
	if err != nil {
		handleAuthError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

// RefreshToken exchanges a valid refresh token for a new access token.
func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req dto.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	resp, err := h.authService.RefreshToken(r.Context(), req)
	if err != nil {
		handleAuthError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

// GetMe retrieves the authenticated user's profile.
func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	user, err := h.authService.GetMe(r.Context(), userID)
	if err != nil {
		handleAuthError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, user, nil)
}

// SwitchRole changes the active role of the authenticated user and returns updated tokens.
func (h *AuthHandler) SwitchRole(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	var req dto.SwitchRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	if err := dto.ValidateStruct(req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid request payload", err.Error())
		return
	}

	resp, err := h.authService.SwitchRole(r.Context(), userID, models.UserRole(req.Role))
	if err != nil {
		handleAuthError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

// UpdateLocation records the user's coordinates when they allow site location permissions.
func (h *AuthHandler) UpdateLocation(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	var req dto.UpdateLocationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	user, err := h.authService.UpdateLocation(r.Context(), userID, req)
	if err != nil {
		handleAuthError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, user, nil)
}

// ─── Delivery Person Auth Handler ──────────────────────────────────────────────

// DeliveryPersonAuthHandler handles HTTP requests for delivery person authentication.
type DeliveryPersonAuthHandler struct {
	authService services.DeliveryPersonAuthService
}

// NewDeliveryPersonAuthHandler returns a new DeliveryPersonAuthHandler instance.
func NewDeliveryPersonAuthHandler(authService services.DeliveryPersonAuthService) *DeliveryPersonAuthHandler {
	return &DeliveryPersonAuthHandler{authService: authService}
}

// Register creates a new delivery person account.
func (h *DeliveryPersonAuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req dto.DeliveryPersonRegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}
	resp, err := h.authService.Register(r.Context(), req)
	if err != nil {
		handleDeliveryPersonError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusCreated, resp, nil)
}

// Login authenticates a delivery person and returns JWT access and refresh tokens.
func (h *DeliveryPersonAuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.DeliveryPersonLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}
	resp, err := h.authService.Login(r.Context(), req)
	if err != nil {
		handleDeliveryPersonError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

// RefreshToken exchanges a valid delivery person refresh token for a new access token.
func (h *DeliveryPersonAuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req dto.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}
	resp, err := h.authService.RefreshToken(r.Context(), req)
	if err != nil {
		handleDeliveryPersonError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

// GetMe retrieves the authenticated delivery person's profile.
func (h *DeliveryPersonAuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	id, err := middleware.GetDeliveryPersonID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}
	person, err := h.authService.GetMe(r.Context(), id)
	if err != nil {
		handleDeliveryPersonError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, person, nil)
}

// ─── Error helpers ─────────────────────────────────────────────────────────────

func handleAuthError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidInput):
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error(), "")
	case errors.Is(err, services.ErrUserAlreadyExists):
		dto.WriteError(w, http.StatusConflict, "USER_EXISTS", err.Error(), "An account with this email already exists")
	case errors.Is(err, services.ErrInvalidCredentials):
		dto.WriteError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", err.Error(), "Please check your email and password")
	case errors.Is(err, services.ErrInvalidToken):
		dto.WriteError(w, http.StatusUnauthorized, "INVALID_TOKEN", err.Error(), "The provided token is invalid or expired")
	case errors.Is(err, services.ErrUserNotFound):
		dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", err.Error(), "")
	default:
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "An unexpected error occurred", err.Error())
	}
}

func handleDeliveryPersonError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidInput):
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error(), "")
	case errors.Is(err, services.ErrDeliveryPersonAlreadyExists):
		dto.WriteError(w, http.StatusConflict, "DELIVERY_PERSON_EXISTS", err.Error(), "An account with this email or phone already exists")
	case errors.Is(err, services.ErrInvalidCredentials):
		dto.WriteError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", err.Error(), "Please check your email and password")
	case errors.Is(err, services.ErrInvalidToken):
		dto.WriteError(w, http.StatusUnauthorized, "INVALID_TOKEN", err.Error(), "The provided token is invalid or expired")
	case errors.Is(err, services.ErrUserNotFound):
		dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Delivery person not found", "")
	default:
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "An unexpected error occurred", err.Error())
	}
}
