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

type AdminCustomerHandler struct {
	customerService services.AdminCustomerService
}

func NewAdminCustomerHandler(customerService services.AdminCustomerService) *AdminCustomerHandler {
	return &AdminCustomerHandler{customerService: customerService}
}

// ListCustomers handles GET /api/v1/admin/customers
func (h *AdminCustomerHandler) ListCustomers(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	search := q.Get("search")
	status := q.Get("status")
	role := q.Get("role")

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(q.Get("limit"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	resp, err := h.customerService.ListCustomers(r.Context(), search, status, role, page, limit)
	if err != nil {
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve customers", err.Error())
		return
	}

	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

// GetCustomer handles GET /api/v1/admin/customers/{id}
func (h *AdminCustomerHandler) GetCustomer(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || id == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid customer ID parameter", "")
		return
	}

	resp, err := h.customerService.GetCustomer(r.Context(), uint(id))
	if err != nil {
		if errors.Is(err, services.ErrCustomerNotFound) {
			dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Customer not found", "")
			return
		}
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve customer details", err.Error())
		return
	}

	dto.WriteJSON(w, http.StatusOK, resp, nil)
}

// UpdateCustomerStatus handles PATCH /api/v1/admin/customers/{id}/status
func (h *AdminCustomerHandler) UpdateCustomerStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || targetID == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid customer ID parameter", "")
		return
	}

	var req dto.UpdateCustomerStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}
	if req.IsActive == nil {
		dto.WriteError(w, http.StatusBadRequest, "MISSING_FIELD", "is_active field is required", "")
		return
	}

	adminUserID, _ := middleware.GetUserID(r.Context())

	if err := h.customerService.UpdateStatus(r.Context(), adminUserID, uint(targetID), *req.IsActive); err != nil {
		switch {
		case errors.Is(err, services.ErrCannotBanSelf):
			dto.WriteError(w, http.StatusForbidden, "CANNOT_BAN_SELF", "You cannot deactivate your own administrator account", "")
		case errors.Is(err, services.ErrCustomerNotFound):
			dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Customer not found", "")
		default:
			dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to update customer status", err.Error())
		}
		return
	}

	// Fetch updated record to return
	updated, err := h.customerService.GetCustomer(r.Context(), uint(targetID))
	if err == nil {
		dto.WriteJSON(w, http.StatusOK, updated, nil)
		return
	}

	dto.WriteJSON(w, http.StatusOK, map[string]any{"success": true, "message": "Customer status updated successfully"}, nil)
}

// UpdateCustomerRole handles PATCH /api/v1/admin/customers/{id}/role
func (h *AdminCustomerHandler) UpdateCustomerRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || targetID == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid customer ID parameter", "")
		return
	}

	var req dto.UpdateCustomerRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	if err := h.customerService.UpdateRole(r.Context(), uint(targetID), req.Role); err != nil {
		if errors.Is(err, services.ErrCustomerNotFound) {
			dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Customer not found", "")
			return
		}
		dto.WriteError(w, http.StatusBadRequest, "UPDATE_FAILED", err.Error(), "")
		return
	}

	dto.WriteJSON(w, http.StatusOK, map[string]any{"success": true, "message": "Role updated successfully"}, nil)
}

// DeleteCustomer handles DELETE /api/v1/admin/customers/{id}
func (h *AdminCustomerHandler) DeleteCustomer(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	targetID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil || targetID == 0 {
		dto.WriteError(w, http.StatusBadRequest, "INVALID_ID", "Invalid customer ID parameter", "")
		return
	}

	adminUserID, _ := middleware.GetUserID(r.Context())

	if err := h.customerService.DeleteCustomer(r.Context(), adminUserID, uint(targetID)); err != nil {
		switch {
		case errors.Is(err, services.ErrCannotBanSelf):
			dto.WriteError(w, http.StatusForbidden, "CANNOT_DELETE_SELF", "You cannot delete your own administrator account", "")
		case errors.Is(err, services.ErrCustomerNotFound):
			dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", "Customer not found", "")
		default:
			dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to delete customer", err.Error())
		}
		return
	}

	dto.WriteJSON(w, http.StatusOK, map[string]any{"success": true, "message": "Customer deleted successfully"}, nil)
}

