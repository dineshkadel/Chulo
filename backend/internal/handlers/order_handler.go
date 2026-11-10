package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/middleware"
	"github.com/dineshkadel/backend/internal/repository"
	"github.com/dineshkadel/backend/internal/services"
	"github.com/go-chi/chi/v5"
)

type OrderHandler struct {
	orderService services.OrderService
}

func NewOrderHandler(orderService services.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
}

// ─── Customer Handlers ────────────────────────────────────────────────────────

func (h *OrderHandler) QuoteFee(w http.ResponseWriter, r *http.Request) {
	var req dto.QuoteDeliveryFeeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	quote, err := h.orderService.QuoteDeliveryFee(r.Context(), req)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, quote, nil)
}

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	customerID, err := middleware.GetUserID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	var req dto.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	order, err := h.orderService.CreateOrder(r.Context(), customerID, req)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusCreated, order, nil)
}

func (h *OrderHandler) GetCustomerOrder(w http.ResponseWriter, r *http.Request) {
	customerID, err := middleware.GetUserID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	idParam := chi.URLParam(r, "id")
	orderID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid order ID", "")
		return
	}

	order, err := h.orderService.GetCustomerOrder(r.Context(), customerID, uint(orderID))
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, order, nil)
}

func (h *OrderHandler) GetCustomerOrders(w http.ResponseWriter, r *http.Request) {
	customerID, err := middleware.GetUserID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	status := r.URL.Query().Get("status")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	orders, total, err := h.orderService.GetCustomerOrders(r.Context(), customerID, status, limit, offset)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, map[string]any{
		"orders": orders,
		"total":  total,
	}, nil)
}

func (h *OrderHandler) CancelOrder(w http.ResponseWriter, r *http.Request) {
	customerID, err := middleware.GetUserID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Not authenticated", err.Error())
		return
	}

	idParam := chi.URLParam(r, "id")
	orderID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid order ID", "")
		return
	}

	var body struct {
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&body)

	order, err := h.orderService.CancelOrder(r.Context(), customerID, uint(orderID), body.Reason)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, order, nil)
}

// ─── Restaurant Handlers ──────────────────────────────────────────────────────

func (h *OrderHandler) GetRestaurantOrders(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := middleware.GetRestaurantID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Restaurant authentication required", err.Error())
		return
	}

	status := r.URL.Query().Get("status")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	orders, total, err := h.orderService.GetRestaurantOrders(r.Context(), restaurantID, status, limit, offset)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, map[string]any{
		"orders": orders,
		"total":  total,
	}, nil)
}

func (h *OrderHandler) UpdateRestaurantOrderStatus(w http.ResponseWriter, r *http.Request) {
	restaurantID, err := middleware.GetRestaurantID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Restaurant authentication required", err.Error())
		return
	}

	idParam := chi.URLParam(r, "id")
	orderID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid order ID", "")
		return
	}

	var req dto.UpdateOrderStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	order, err := h.orderService.UpdateRestaurantOrderStatus(r.Context(), restaurantID, uint(orderID), req)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, order, nil)
}

// ─── Delivery Person Handlers ─────────────────────────────────────────────────

func (h *OrderHandler) GetDeliveryOrders(w http.ResponseWriter, r *http.Request) {
	deliveryPersonID, err := middleware.GetDeliveryPersonID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Delivery person authentication required", err.Error())
		return
	}

	status := r.URL.Query().Get("status")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	orders, total, err := h.orderService.GetDeliveryOrders(r.Context(), deliveryPersonID, status, limit, offset)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, map[string]any{
		"orders": orders,
		"total":  total,
	}, nil)
}

func (h *OrderHandler) UpdateDeliveryOrderStatus(w http.ResponseWriter, r *http.Request) {
	deliveryPersonID, err := middleware.GetDeliveryPersonID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Delivery person authentication required", err.Error())
		return
	}

	idParam := chi.URLParam(r, "id")
	orderID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid order ID", "")
		return
	}

	var req dto.UpdateOrderStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	order, err := h.orderService.UpdateDeliveryOrderStatus(r.Context(), deliveryPersonID, uint(orderID), req)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, order, nil)
}

// ─── Admin Handlers ───────────────────────────────────────────────────────────

func (h *OrderHandler) GetAllOrders(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	orders, total, err := h.orderService.GetAllOrders(r.Context(), status, limit, offset)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, map[string]any{
		"orders": orders,
		"total":  total,
	}, nil)
}

func (h *OrderHandler) GetOrderByID(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	orderID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid order ID", "")
		return
	}

	order, err := h.orderService.GetOrderByID(r.Context(), uint(orderID))
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, order, nil)
}

func (h *OrderHandler) AdminUpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	adminID, err := middleware.GetUserID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Admin authentication required", err.Error())
		return
	}

	idParam := chi.URLParam(r, "id")
	orderID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid order ID", "")
		return
	}

	var req dto.UpdateOrderStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	order, err := h.orderService.AdminUpdateOrderStatus(r.Context(), adminID, uint(orderID), req)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, order, nil)
}

func (h *OrderHandler) AdminAssignDeliveryPerson(w http.ResponseWriter, r *http.Request) {
	adminID, err := middleware.GetUserID(r.Context())
	if err != nil {
		dto.WriteError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Admin authentication required", err.Error())
		return
	}

	idParam := chi.URLParam(r, "id")
	orderID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", "Invalid order ID", "")
		return
	}

	var req dto.AssignDeliveryPersonRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		dto.WriteError(w, http.StatusBadRequest, "MALFORMED_JSON", "Invalid request body", err.Error())
		return
	}

	order, err := h.orderService.AdminAssignDeliveryPerson(r.Context(), adminID, uint(orderID), req)
	if err != nil {
		handleOrderError(w, err)
		return
	}

	dto.WriteJSON(w, http.StatusOK, order, nil)
}

// ─── Error Handling ───────────────────────────────────────────────────────────

func handleOrderError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, services.ErrInvalidInput):
		dto.WriteError(w, http.StatusBadRequest, "BAD_REQUEST", err.Error(), "")
	case errors.Is(err, repository.ErrOrderNotFound):
		dto.WriteError(w, http.StatusNotFound, "NOT_FOUND", err.Error(), "")
	case errors.Is(err, repository.ErrRestaurantClosed):
		dto.WriteError(w, http.StatusBadRequest, "RESTAURANT_CLOSED", err.Error(), "The restaurant is currently closed and not accepting orders")
	case errors.Is(err, repository.ErrItemUnavailable):
		dto.WriteError(w, http.StatusBadRequest, "ITEM_UNAVAILABLE", err.Error(), "Please refresh your cart and try again")
	case errors.Is(err, services.ErrCannotCancelOrder):
		dto.WriteError(w, http.StatusBadRequest, "CANNOT_CANCEL", err.Error(), "Orders cannot be cancelled once accepted by the kitchen")
	case errors.Is(err, repository.ErrInvalidStateTransition):
		dto.WriteError(w, http.StatusBadRequest, "INVALID_TRANSITION", err.Error(), "This status change is not allowed at this lifecycle stage")
	case errors.Is(err, repository.ErrConcurrentOrderUpdate):
		dto.WriteError(w, http.StatusConflict, "CONCURRENT_UPDATE", err.Error(), "Another user or rider has updated this order, please refresh")
	case errors.Is(err, services.ErrUnauthorizedOrderOp):
		dto.WriteError(w, http.StatusForbidden, "FORBIDDEN", err.Error(), "You do not have permission to modify this order")
	case errors.Is(err, repository.ErrDeliveryPersonNotAvail):
		dto.WriteError(w, http.StatusBadRequest, "RIDER_UNAVAILABLE", err.Error(), "Selected rider is inactive or offline")
	default:
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "An unexpected order processing error occurred", err.Error())
	}
}

