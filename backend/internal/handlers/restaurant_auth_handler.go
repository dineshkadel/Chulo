package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/middleware"
	"github.com/dineshkadel/backend/internal/services"
)

// RestaurantAuthHandler handles HTTP requests for restaurant registration, login, and profile.
type RestaurantAuthHandler struct {
	authService services.RestaurantAuthService
}

func NewRestaurantAuthHandler(authService services.RestaurantAuthService) *RestaurantAuthHandler {
	return &RestaurantAuthHandler{authService: authService}
}

func (h *RestaurantAuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req dto.RestaurantRegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	resp, err := h.authService.Register(r.Context(), req)
	if err != nil {
		handleRestaurantError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusCreated, resp, nil)
}

// Login authenticates a restaurant and returns JWT tokens.
func (h *RestaurantAuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req dto.RestaurantLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	resp, err := h.authService.Login(r.Context(), req)
	if err != nil {
		handleRestaurantError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

func (h *RestaurantAuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req dto.RefreshTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	resp, err := h.authService.RefreshToken(r.Context(), req)
	if err != nil {
		handleRestaurantError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

func (h *RestaurantAuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := middleware.GetRestaurantID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	restaurant, err := h.authService.GetMe(r.Context(), restaurantID)
	if err != nil {
		handleRestaurantError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, restaurant, nil)
}

// UpdateProfile replaces the authenticated restaurant's editable profile fields.
func (h *RestaurantAuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := middleware.GetRestaurantID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	var req dto.RestaurantProfileUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	restaurant, err := h.authService.UpdateProfile(r.Context(), restaurantID, req)
	if err != nil {
		handleRestaurantError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, restaurant, nil)
}

// DeleteProfile soft-deletes the authenticated restaurant profile.
func (h *RestaurantAuthHandler) DeleteProfile(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := middleware.GetRestaurantID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	if err := h.authService.DeleteProfile(r.Context(), restaurantID); err != nil {
		handleRestaurantError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func handleRestaurantError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidInput):
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error(), "")
	case errors.Is(err, services.ErrRestaurantAlreadyExists):
		dto.WriteError(w, http.StatusConflict, "RESTAURANT_EXISTS", err.Error(), "A restaurant with this email already exists")
	case errors.Is(err, services.ErrInvalidCredentials):
		dto.WriteError(w, http.StatusUnauthorized, "INVALID_CREDENTIALS", err.Error(), "Please check your email and password")
	case errors.Is(err, services.ErrInvalidToken):
		dto.WriteError(w, http.StatusUnauthorized, "INVALID_TOKEN", err.Error(), "The provided token is invalid or expired")
	case errors.Is(err, services.ErrUserNotFound):
		dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Restaurant not found", "")
	default:
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "An unexpected error occurred", err.Error())
	}
}
