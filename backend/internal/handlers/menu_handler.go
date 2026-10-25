package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/middleware"
	"github.com/dineshkadel/backend/internal/repository"
	"github.com/dineshkadel/backend/internal/services"
	"github.com/go-chi/chi/v5"
)

type MenuHandler struct{ service services.MenuService }

func NewMenuHandler(service services.MenuService) *MenuHandler { return &MenuHandler{service: service} }

func (h *MenuHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	categories, err := h.service.ListCategories(r.Context())
	if err != nil {
		writeMenuError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, categories, nil)
}

func (h *MenuHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var req dto.FoodCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}
	category, err := h.service.CreateCategory(r.Context(), req)
	if err != nil {
		writeMenuError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusCreated, category, nil)
}

func (h *MenuHandler) UpdateCategory(w http.ResponseWriter, r *http.Request) {
	id, ok := parseRouteID(w, r, "categoryID")
	if !ok {
		return
	}
	var req dto.FoodCategoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}
	category, err := h.service.UpdateCategory(r.Context(), id, req)
	if err != nil {
		writeMenuError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, category, nil)
}

func (h *MenuHandler) DeleteCategory(w http.ResponseWriter, r *http.Request) {
	id, ok := parseRouteID(w, r, "categoryID")
	if !ok {
		return
	}
	if err := h.service.DeleteCategory(r.Context(), id); err != nil {
		writeMenuError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, map[string]string{"message": "Food category deleted"}, nil)
}

func (h *MenuHandler) ListMenuItems(w http.ResponseWriter, r *http.Request) {
	restaurantID, ok := parseRouteID(w, r, "restaurantID")
	if !ok {
		return
	}
	items, err := h.service.ListMenuItems(r.Context(), restaurantID)
	if err != nil {
		writeMenuError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, items, nil)
}

func (h *MenuHandler) GetMenuItem(w http.ResponseWriter, r *http.Request) {
	restaurantID, ok := parseRouteID(w, r, "restaurantID")
	if !ok {
		return
	}
	id, ok := parseRouteID(w, r, "menuItemID")
	if !ok {
		return
	}
	item, err := h.service.GetMenuItem(r.Context(), restaurantID, id)
	if err != nil {
		writeMenuError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, item, nil)
}

func (h *MenuHandler) CreateMenuItem(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := middleware.GetRestaurantID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated as a restaurant", err.Error())
		return
	}
	req, imageURL, imagePath, err := parseMenuItemForm(w, r)
	if err != nil {
		return
	}
	if err := dto.ValidateStruct(req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), "")
		return
	}
	item, err := h.service.CreateMenuItem(r.Context(), restaurantID, req, imageURL)
	if err != nil {
		if imagePath != "" {
			_ = os.Remove(imagePath)
		}
		writeMenuError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusCreated, item, nil)
}

func (h *MenuHandler) UpdateMenuItem(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := middleware.GetRestaurantID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated as a restaurant", err.Error())
		return
	}
	id, ok := parseRouteID(w, r, "menuItemID")
	if !ok {
		return
	}
	req, imageURL, imagePath, err := parseMenuItemForm(w, r)
	if err != nil {
		return
	}
	if err := dto.ValidateStruct(req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), "")
		return
	}
	item, err := h.service.UpdateMenuItem(r.Context(), restaurantID, id, req, imageURL)
	if err != nil {
		if imagePath != "" {
			_ = os.Remove(imagePath)
		}
		writeMenuError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, item, nil)
}

func (h *MenuHandler) DeleteMenuItem(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := middleware.GetRestaurantID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated as a restaurant", err.Error())
		return
	}
	id, ok := parseRouteID(w, r, "menuItemID")
	if !ok {
		return
	}
	if err := h.service.DeleteMenuItem(r.Context(), restaurantID, id); err != nil {
		writeMenuError(w, err)
		return
	}
	dto.WriteJSON(w, http.StatusOK, map[string]string{"message": "Menu item deleted"}, nil)
}

func parseMenuItemForm(w http.ResponseWriter, r *http.Request) (dto.MenuItemRequest, string, string, error) {
	var req dto.MenuItemRequest
	r.Body = http.MaxBytesReader(w, r.Body, middleware.MaxMenuImageSize+(1<<20))
	if err := r.ParseMultipartForm(1 << 20); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_MULTIPART_FORM", "Expected multipart form data", err.Error())
		return req, "", "", err
	}
	if r.MultipartForm != nil {
		defer r.MultipartForm.RemoveAll()
	}
	categoryID, err := strconv.ParseUint(r.FormValue("food_category_id"), 10, 32)
	if err != nil {
		dto.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "food_category_id must be a positive integer", "")
		return req, "", "", err
	}
	price, err := strconv.ParseFloat(r.FormValue("price"), 64)
	if err != nil {
		dto.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "price must be a valid number", "")
		return req, "", "", err
	}
	req = dto.MenuItemRequest{FoodCategoryID: uint(categoryID), Name: r.FormValue("name"), Description: r.FormValue("description"), Price: price, DietaryTags: r.FormValue("dietary_tags")}
	if raw := r.FormValue("is_available"); raw != "" {
		available, parseErr := strconv.ParseBool(raw)
		if parseErr != nil {
			dto.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", "is_available must be true or false", "")
			return req, "", "", parseErr
		}
		req.IsAvailable = &available
	}
	imageURL, imagePath, err := middleware.UploadMenuItemImage(r)
	if err != nil {
		middleware.WriteImageUploadError(w, err)
		return req, "", "", err
	}
	return req, imageURL, imagePath, nil
}

func parseRouteID(w http.ResponseWriter, r *http.Request, key string) (uint, bool) {
	id, err := strconv.ParseUint(chi.URLParam(r, key), 10, 32)
	if err != nil || id == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", strings.ReplaceAll(key, "ID", " id")+" must be a positive integer", "")
		return 0, false
	}
	return uint(id), true
}

func writeMenuError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidInput):
		dto.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), "")
	case errors.Is(err, repository.ErrFoodCategoryExists):
		dto.WriteError(w, http.StatusConflict, "FOOD_CATEGORY_EXISTS", err.Error(), "Category names must be unique")
	case errors.Is(err, repository.ErrFoodCategoryNotFound):
		dto.WriteError(w, http.StatusNotFound, "FOOD_CATEGORY_NOT_FOUND", err.Error(), "")
	case errors.Is(err, repository.ErrFoodCategoryInUse):
		dto.WriteError(w, http.StatusConflict, "FOOD_CATEGORY_IN_USE", err.Error(), "Reassign or remove the menu items using this category first")
	case errors.Is(err, repository.ErrMenuItemNotFound):
		dto.WriteError(w, http.StatusNotFound, "MENU_ITEM_NOT_FOUND", err.Error(), "")
	default:
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "Could not complete menu operation", err.Error())
	}
}
