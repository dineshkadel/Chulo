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

// UploadProfileImage saves a restaurant-owned image and stores its public URL
// on the profile. Keeping this as a small separate endpoint lets normal
// profile updates remain JSON requests.
func (h *RestaurantAuthHandler) UploadProfileImage(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := middleware.GetRestaurantID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	imageURL, _, err := middleware.UploadRestaurantImage(r)
	if err != nil {
		middleware.WriteImageUploadError(w, err)
		return
	}
	if imageURL == "" {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_IMAGE", "Choose an image to upload", "")
		return
	}

	profile, err := h.authService.GetMe(r.Context(), restaurantID)
	if err != nil {
		handleRestaurantError(w, err)
		return
	}
	profile.HeroImageURL = imageURL
	updated, err := h.authService.UpdateProfile(r.Context(), restaurantID, dto.RestaurantProfileUpdateRequest{
		Name: profile.Name, Description: profile.Description, CuisineTypes: profile.CuisineTypes,
		PriceTier: profile.PriceTier, Lat: profile.Lat, Lng: profile.Lng, Address: profile.Address,
		Phone: profile.Phone, OperatingHours: profile.OperatingHours, HeroImageURL: imageURL,
		DietaryTags: profile.DietaryTags,
	})
	if err != nil {
		handleRestaurantError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, updated, nil)
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
