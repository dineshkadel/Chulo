package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/middleware"
	"github.com/dineshkadel/backend/internal/services"
)

// AuthHandler handles HTTP requests for user authentication and location.
type AuthHandler struct {
	authService services.AuthService
}

// NewAuthHandler creates a new AuthHandler instance.
func NewAuthHandler(authService services.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register handles user registration with name, email, password, and phone.
// No address is required at this stage.
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	resp, err := h.authService.Register(r.Context(), req)
	if err != nil {
		handleServiceError(w, err)
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
		handleServiceError(w, err)
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
		handleServiceError(w, err)
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
		handleServiceError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, user, nil)
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
		handleServiceError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, user, nil)
}

func handleServiceError(w http.ResponseWriter, err error) {
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
