package handlers

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/middleware"
	"github.com/dineshkadel/backend/internal/services"
)

type DeliveryPersonAuthHandler struct {
	authService services.DeliveryPersonAuthService
}

func NewDeliveryPersonAuthHandler(authService services.DeliveryPersonAuthService) *DeliveryPersonAuthHandler {
	return &DeliveryPersonAuthHandler{authService: authService}
}

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
