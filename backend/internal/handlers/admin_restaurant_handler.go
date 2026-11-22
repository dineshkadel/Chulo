package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/middleware"
	"github.com/dineshkadel/backend/internal/services"
	"github.com/go-chi/chi/v5"
)

type AdminRestaurantHandler struct {
	restaurantService services.AdminRestaurantService
}

func NewAdminRestaurantHandler(restaurantService services.AdminRestaurantService) *AdminRestaurantHandler {
	return &AdminRestaurantHandler{restaurantService: restaurantService}
}

// ListRestaurants handles GET /api/v1/admin/restaurants
func (h *AdminRestaurantHandler) ListRestaurants(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	search := q.Get("search")
	status := q.Get("status")

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	resp, err := h.restaurantService.ListRestaurants(r.Context(), search, status, page, limit)
	if err != nil {
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve restaurants", err.Error())
		return
	}

	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

// CreateRestaurant handles POST /api/v1/admin/restaurants
func (h *AdminRestaurantHandler) CreateRestaurant(w http.ResponseWriter, r *http.Request) {
	var req dto.CreateAdminRestaurantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	resp, err := h.restaurantService.CreateRestaurant(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidInput):
			dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error(), "")
		case errors.Is(err, services.ErrRestaurantEmailExists):
			dto.WriteError(w, http.StatusConflict, "EMAIL_EXISTS", "A restaurant with this email already exists", "")
		default:
			dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to create restaurant", err.Error())
		}
		return
	}

	dto.WriteJSON(w, http.StatusCreated, resp, nil)
}

// GetRestaurant handles GET /api/v1/admin/restaurants/{id}
func (h *AdminRestaurantHandler) GetRestaurant(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || id == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid restaurant ID parameter", "")
		return
	}

	resp, err := h.restaurantService.GetRestaurantDetail(r.Context(), uint(id))
	if err != nil {
		if errors.Is(err, services.ErrRestaurantNotFound) {
			dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Restaurant not found", "")
			return
		}
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve restaurant details", err.Error())
		return
	}

	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

// UpdateRestaurant handles PUT / PATCH /api/v1/admin/restaurants/{id}
func (h *AdminRestaurantHandler) UpdateRestaurant(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || id == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid restaurant ID parameter", "")
		return
	}

	var req dto.UpdateAdminRestaurantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	resp, err := h.restaurantService.UpdateRestaurant(r.Context(), uint(id), req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrRestaurantNotFound):
			dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Restaurant not found", "")
		case errors.Is(err, services.ErrRestaurantEmailExists):
			dto.WriteError(w, http.StatusConflict, "EMAIL_EXISTS", "A restaurant with this email already exists", "")
		case errors.Is(err, services.ErrInvalidInput):
			dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error(), "")
		default:
			dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update restaurant", err.Error())
		}
		return
	}

	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

// DeleteRestaurant handles DELETE /api/v1/admin/restaurants/{id}
func (h *AdminRestaurantHandler) DeleteRestaurant(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || id == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid restaurant ID parameter", "")
		return
	}

	if err := h.restaurantService.DeleteRestaurant(r.Context(), uint(id)); err != nil {
		if errors.Is(err, services.ErrRestaurantNotFound) {
			dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Restaurant not found", "")
			return
		}
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete restaurant", err.Error())
		return
	}

	dto.WriteJSON(w, http.StatusOK, map[string]any{
		"success": true,
		"message": "Restaurant successfully deleted",
	}, nil)
}

// UpdateStatus handles PATCH /api/v1/admin/restaurants/{id}/status
func (h *AdminRestaurantHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || id == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid restaurant ID parameter", "")
		return
	}

	var req dto.UpdateAdminRestaurantStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}
	if req.IsActive == nil {
		dto.WriteError(w, http.StatusBadRequest, "MISSING_FIELD", "is_active field is required", "")
		return
	}

	if err := h.restaurantService.UpdateStatus(r.Context(), uint(id), *req.IsActive); err != nil {
		if errors.Is(err, services.ErrRestaurantNotFound) {
			dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Restaurant not found", "")
			return
		}
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update restaurant status", err.Error())
		return
	}

	dto.WriteJSON(w, http.StatusOK, map[string]any{
		"success":   true,
		"is_active": *req.IsActive,
		"message":   "Restaurant status updated successfully",
	}, nil)
}

// UploadImage handles POST /api/v1/admin/restaurants/{id}/image
func (h *AdminRestaurantHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || id == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid restaurant ID parameter", "")
		return
	}

	imageURL, _, err := middleware.UploadRestaurantImage(r)
	if err != nil {
		var imgErr *middleware.ImageUploadError
		if errors.As(err, &imgErr) {
			middleware.WriteImageUploadError(w, err)
			return
		}
		dto.WriteError(w, http.StatusBadRequest, "UPLOAD_ERROR", err.Error(), "")
		return
	}
	if imageURL == "" {
		dto.WriteError(w, http.StatusBadRequest, "MISSING_FILE", "Please choose an image file to upload", "")
		return
	}

	if err := h.restaurantService.UpdateHeroImage(r.Context(), uint(id), imageURL); err != nil {
		if errors.Is(err, services.ErrRestaurantNotFound) {
			dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Restaurant not found", "")
			return
		}
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update restaurant image", err.Error())
		return
	}

	dto.WriteJSON(w, http.StatusOK, map[string]any{
		"hero_image_url": imageURL,
		"message":        "Restaurant image uploaded successfully",
	}, nil)
}

// GetMenuItems handles GET /api/v1/admin/restaurants/{id}/menu-items
func (h *AdminRestaurantHandler) GetMenuItems(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || id == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid restaurant ID parameter", "")
		return
	}

	items, err := h.restaurantService.GetRestaurantMenuItems(r.Context(), uint(id))
	if err != nil {
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve menu items", err.Error())
		return
	}

	dto.WriteJSON(w, http.StatusOK, items, nil)
}

// GetOrders handles GET /api/v1/admin/restaurants/{id}/orders
func (h *AdminRestaurantHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || id == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid restaurant ID parameter", "")
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 30
	}

	orders, err := h.restaurantService.GetRestaurantOrders(r.Context(), uint(id), limit)
	if err != nil {
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve restaurant orders", err.Error())
		return
	}

	dto.WriteJSON(w, http.StatusOK, orders, nil)
}
