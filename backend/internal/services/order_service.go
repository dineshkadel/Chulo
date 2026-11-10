package services

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/models"
	"github.com/dineshkadel/backend/internal/repository"
	"github.com/dineshkadel/backend/utils"
)

var (
	ErrCannotCancelOrder    = errors.New("cannot cancel order: order has already been accepted by the kitchen")
	ErrUnauthorizedOrderOp  = errors.New("you are not authorized to perform this operation on this order")
	ErrInvalidOrderStatus   = errors.New("invalid order status requested")
)

type OrderService interface {
	// Customer
	CreateOrder(ctx context.Context, customerID uint, req dto.CreateOrderRequest) (*dto.OrderResponse, error)
	GetCustomerOrder(ctx context.Context, customerID, orderID uint) (*dto.OrderResponse, error)
	GetCustomerOrders(ctx context.Context, customerID uint, status string, limit, offset int) ([]dto.OrderResponse, int64, error)
	CancelOrder(ctx context.Context, customerID, orderID uint, reason string) (*dto.OrderResponse, error)
	QuoteDeliveryFee(ctx context.Context, req dto.QuoteDeliveryFeeRequest) (*dto.QuoteDeliveryFeeResponse, error)

	// Restaurant
	GetRestaurantOrders(ctx context.Context, restaurantID uint, status string, limit, offset int) ([]dto.OrderResponse, int64, error)
	UpdateRestaurantOrderStatus(ctx context.Context, restaurantID, orderID uint, req dto.UpdateOrderStatusRequest) (*dto.OrderResponse, error)

	// Delivery
	GetDeliveryOrders(ctx context.Context, deliveryPersonID uint, status string, limit, offset int) ([]dto.OrderResponse, int64, error)
	UpdateDeliveryOrderStatus(ctx context.Context, deliveryPersonID, orderID uint, req dto.UpdateOrderStatusRequest) (*dto.OrderResponse, error)

	// Admin
	GetAllOrders(ctx context.Context, status string, limit, offset int) ([]dto.OrderResponse, int64, error)
	GetOrderByID(ctx context.Context, orderID uint) (*dto.OrderResponse, error)
	AdminUpdateOrderStatus(ctx context.Context, adminUserID, orderID uint, req dto.UpdateOrderStatusRequest) (*dto.OrderResponse, error)
	AdminAssignDeliveryPerson(ctx context.Context, adminUserID, orderID uint, req dto.AssignDeliveryPersonRequest) (*dto.OrderResponse, error)
}

type orderService struct {
	repo repository.OrderRepository
}

func NewOrderService(repo repository.OrderRepository) OrderService {
	return &orderService{repo: repo}
}

// ─── Fee & Distance Calculation ───────────────────────────────────────────────

func calculateDeliveryFee(distanceKm float64) float64 {
	// Base fee: Rs. 40 up to 2km, then Rs. 15 per extra km
	if distanceKm <= 2.0 {
		return 40.0
	}
	fee := 40.0 + (distanceKm-2.0)*15.0
	return math.Round(fee*100) / 100
}

func calculateEstimatedMinutes(distanceKm float64) int {
	// 20 min prep + 4 min/km, minimum 25 min
	est := 20 + int(math.Ceil(distanceKm*4.0))
	if est < 25 {
		est = 25
	}
	return est
}

// ─── Customer Operations ──────────────────────────────────────────────────────

func (s *orderService) QuoteDeliveryFee(ctx context.Context, req dto.QuoteDeliveryFeeRequest) (*dto.QuoteDeliveryFeeResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	rest, err := s.repo.GetRestaurant(ctx, req.RestaurantID)
	if err != nil {
		return nil, fmt.Errorf("restaurant not found: %w", err)
	}

	distanceKm := utils.HaversineDistance(rest.Lat, rest.Lng, req.DeliveryLat, req.DeliveryLng)
	fee := calculateDeliveryFee(distanceKm)
	estMin := calculateEstimatedMinutes(distanceKm)

	return &dto.QuoteDeliveryFeeResponse{
		DistanceKm:   math.Round(distanceKm*10) / 10,
		DeliveryFee:  fee,
		EstimatedMin: estMin,
	}, nil
}

func (s *orderService) CreateOrder(ctx context.Context, customerID uint, req dto.CreateOrderRequest) (*dto.OrderResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	// 1. Verify restaurant is active
	rest, err := s.repo.GetRestaurant(ctx, req.RestaurantID)
	if err != nil {
		return nil, fmt.Errorf("restaurant not found: %w", err)
	}
	if !rest.IsActive {
		return nil, repository.ErrRestaurantClosed
	}

	// 2. Fetch and validate all menu items
	itemIDs := make([]uint, len(req.Items))
	itemQtyMap := make(map[uint]int)
	itemNotesMap := make(map[uint]string)
	for i, item := range req.Items {
		itemIDs[i] = item.MenuItemID
		itemQtyMap[item.MenuItemID] = item.Quantity
		itemNotesMap[item.MenuItemID] = item.SpecialInstructions
	}

	menuItems, err := s.repo.GetMenuItemsByIDs(ctx, req.RestaurantID, itemIDs)
	if err != nil {
		return nil, err
	}
	if len(menuItems) != len(req.Items) {
		return nil, repository.ErrItemUnavailable
	}

	// 3. Calculate subtotal using snapshot prices
	var subtotal float64
	orderItems := make([]models.OrderItem, len(menuItems))
	for i, mi := range menuItems {
		if !mi.IsAvailable {
			return nil, fmt.Errorf("%w: '%s' is currently unavailable", repository.ErrItemUnavailable, mi.Name)
		}
		qty := itemQtyMap[mi.ID]
		if qty < 1 {
			qty = 1
		}
		itemSubtotal := mi.Price * float64(qty)
		subtotal += itemSubtotal

		orderItems[i] = models.OrderItem{
			MenuItemID:          mi.ID,
			Name:                mi.Name,
			Price:               mi.Price, // Snapshot
			Quantity:            qty,
			Subtotal:            itemSubtotal,
			SpecialInstructions: itemNotesMap[mi.ID],
			CreatedAt:           time.Now().UTC(),
		}
	}

	// 4. Calculate delivery fee with Haversine distance
	distanceKm := utils.HaversineDistance(rest.Lat, rest.Lng, req.DeliveryLat, req.DeliveryLng)
	deliveryFee := calculateDeliveryFee(distanceKm)
	estMin := calculateEstimatedMinutes(distanceKm)
	total := subtotal + deliveryFee

	order := &models.Order{
		UserID:               customerID,
		RestaurantID:         req.RestaurantID,
		Status:               models.OrderStatusPlaced,
		DeliveryAddressID:   req.DeliveryAddressID,
		DeliveryLat:          req.DeliveryLat,
		DeliveryLng:          req.DeliveryLng,
		DeliveryAddress:      req.DeliveryAddress,
		Subtotal:             subtotal,
		DeliveryFee:          deliveryFee,
		Tax:                  0,
		Total:                total,
		PromoCode:            req.PromoCode,
		SpecialNotes:         req.SpecialNotes,
		EstimatedDeliveryMin: estMin,
		CreatedAt:            time.Now().UTC(),
		UpdatedAt:            time.Now().UTC(),
	}

	createdOrder, err := s.repo.CreateOrder(ctx, order, orderItems)
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	resp := toOrderResponse(createdOrder)
	return &resp, nil
}

func (s *orderService) GetCustomerOrder(ctx context.Context, customerID, orderID uint) (*dto.OrderResponse, error) {
	order, err := s.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order.UserID != customerID {
		return nil, ErrUnauthorizedOrderOp
	}
	resp := toOrderResponse(order)
	return &resp, nil
}

func (s *orderService) GetCustomerOrders(ctx context.Context, customerID uint, status string, limit, offset int) ([]dto.OrderResponse, int64, error) {
	orders, total, err := s.repo.GetOrdersByCustomer(ctx, customerID, status, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	resps := make([]dto.OrderResponse, len(orders))
	for i := range orders {
		resps[i] = toOrderResponse(&orders[i])
	}
	return resps, total, nil
}

func (s *orderService) CancelOrder(ctx context.Context, customerID, orderID uint, reason string) (*dto.OrderResponse, error) {
	order, err := s.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order.UserID != customerID {
		return nil, ErrUnauthorizedOrderOp
	}

	// Customer can cancel ONLY before ACCEPTED (i.e. only when status == PLACED)
	if order.Status != models.OrderStatusPlaced {
		return nil, ErrCannotCancelOrder
	}

	notes := "Order cancelled by customer"
	if reason != "" {
		notes += ": " + reason
	}

	updated, err := s.repo.UpdateOrderStatus(ctx, orderID, models.OrderStatusPlaced, models.OrderStatusCancelled, customerID, "customer", notes)
	if err != nil {
		return nil, err
	}

	resp := toOrderResponse(updated)
	return &resp, nil
}

// ─── Restaurant Operations ────────────────────────────────────────────────────

func (s *orderService) GetRestaurantOrders(ctx context.Context, restaurantID uint, status string, limit, offset int) ([]dto.OrderResponse, int64, error) {
	orders, total, err := s.repo.GetOrdersByRestaurant(ctx, restaurantID, status, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	resps := make([]dto.OrderResponse, len(orders))
	for i := range orders {
		resps[i] = toOrderResponse(&orders[i])
	}
	return resps, total, nil
}

func (s *orderService) UpdateRestaurantOrderStatus(ctx context.Context, restaurantID, orderID uint, req dto.UpdateOrderStatusRequest) (*dto.OrderResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	order, err := s.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order.RestaurantID != restaurantID {
		return nil, ErrUnauthorizedOrderOp
	}

	targetStatus := models.OrderStatus(req.Status)
	currentStatus := order.Status

	// Allowed Restaurant transitions:
	// PLACED -> ACCEPTED
	// PLACED -> REJECTED
	// ACCEPTED -> PREPARING
	// PREPARING -> READY
	var valid bool
	switch currentStatus {
	case models.OrderStatusPlaced:
		valid = (targetStatus == models.OrderStatusAccepted || targetStatus == models.OrderStatusRejected)
	case models.OrderStatusAccepted:
		valid = (targetStatus == models.OrderStatusPreparing)
	case models.OrderStatusPreparing:
		valid = (targetStatus == models.OrderStatusReady)
	}

	if !valid {
		return nil, fmt.Errorf("%w: cannot transition from %s to %s", repository.ErrInvalidStateTransition, currentStatus, targetStatus)
	}

	notes := req.Notes
	if notes == "" {
		notes = fmt.Sprintf("Status updated to %s by kitchen", targetStatus)
	}

	updated, err := s.repo.UpdateOrderStatus(ctx, orderID, currentStatus, targetStatus, restaurantID, "restaurant", notes)
	if err != nil {
		return nil, err
	}

	// ─── Trigger Nearest Delivery Person Auto-Assignment when READY ───────
	if targetStatus == models.OrderStatusReady {
		s.tryAutoAssignDeliveryPerson(ctx, updated)
		// Reload updated order if assigned
		reloaded, reloadErr := s.repo.GetOrderByID(ctx, orderID)
		if reloadErr == nil {
			updated = reloaded
		}
	}

	resp := toOrderResponse(updated)
	return &resp, nil
}

// tryAutoAssignDeliveryPerson finds the nearest available delivery rider and assigns the order
func (s *orderService) tryAutoAssignDeliveryPerson(ctx context.Context, order *models.Order) {
	availableDPs, err := s.repo.FindAvailableDeliveryPersons(ctx)
	if err != nil || len(availableDPs) == 0 {
		return // No available riders right now, remains in READY state for manual/future assignment
	}

	restLat := order.Restaurant.Lat
	restLng := order.Restaurant.Lng

	var nearestDP *models.DeliveryPerson
	minDistance := math.MaxFloat64

	for i := range availableDPs {
		dp := &availableDPs[i]
		dist := utils.HaversineDistance(dp.CurrentLat, dp.CurrentLng, restLat, restLng)
		if dist < minDistance {
			minDistance = dist
			nearestDP = dp
		}
	}

	if nearestDP != nil {
		assignNotes := fmt.Sprintf("Auto-assigned to rider %s (%.1f km away)", nearestDP.User.DisplayName, minDistance)
		_, _ = s.repo.AssignDeliveryPerson(
			ctx,
			order.ID,
			nearestDP.ID,
			models.OrderStatusReady,
			models.OrderStatusAssigned,
			0, // system
			"system",
			assignNotes,
		)
	}
}

// ─── Delivery Person Operations ───────────────────────────────────────────────

func (s *orderService) GetDeliveryOrders(ctx context.Context, deliveryPersonID uint, status string, limit, offset int) ([]dto.OrderResponse, int64, error) {
	orders, total, err := s.repo.GetOrdersByDeliveryPerson(ctx, deliveryPersonID, status, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	resps := make([]dto.OrderResponse, len(orders))
	for i := range orders {
		resps[i] = toOrderResponse(&orders[i])
	}
	return resps, total, nil
}

func (s *orderService) UpdateDeliveryOrderStatus(ctx context.Context, deliveryPersonID, orderID uint, req dto.UpdateOrderStatusRequest) (*dto.OrderResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	order, err := s.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	if order.DeliveryPersonID == nil || *order.DeliveryPersonID != deliveryPersonID {
		return nil, ErrUnauthorizedOrderOp
	}

	targetStatus := models.OrderStatus(req.Status)
	currentStatus := order.Status

	// Allowed Delivery Person transitions:
	// ASSIGNED -> PICKED_UP
	// PICKED_UP -> DELIVERED
	var valid bool
	switch currentStatus {
	case models.OrderStatusAssigned:
		valid = (targetStatus == models.OrderStatusPickedUp)
	case models.OrderStatusPickedUp:
		valid = (targetStatus == models.OrderStatusDelivered)
	}

	if !valid {
		return nil, fmt.Errorf("%w: delivery person cannot transition from %s to %s", repository.ErrInvalidStateTransition, currentStatus, targetStatus)
	}

	notes := req.Notes
	if notes == "" {
		notes = fmt.Sprintf("Status updated to %s by delivery rider", targetStatus)
	}

	updated, err := s.repo.UpdateOrderStatus(ctx, orderID, currentStatus, targetStatus, deliveryPersonID, "delivery_person", notes)
	if err != nil {
		return nil, err
	}

	resp := toOrderResponse(updated)
	return &resp, nil
}

// ─── Admin Operations ─────────────────────────────────────────────────────────

func (s *orderService) GetAllOrders(ctx context.Context, status string, limit, offset int) ([]dto.OrderResponse, int64, error) {
	orders, total, err := s.repo.GetAllOrders(ctx, status, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	resps := make([]dto.OrderResponse, len(orders))
	for i := range orders {
		resps[i] = toOrderResponse(&orders[i])
	}
	return resps, total, nil
}

func (s *orderService) GetOrderByID(ctx context.Context, orderID uint) (*dto.OrderResponse, error) {
	order, err := s.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	resp := toOrderResponse(order)
	return &resp, nil
}

func (s *orderService) AdminUpdateOrderStatus(ctx context.Context, adminUserID, orderID uint, req dto.UpdateOrderStatusRequest) (*dto.OrderResponse, error) {
	targetStatus := models.OrderStatus(req.Status)
	notes := req.Notes
	if notes == "" {
		notes = fmt.Sprintf("Admin override to %s", targetStatus)
	}

	updated, err := s.repo.UpdateOrderStatus(ctx, orderID, "", targetStatus, adminUserID, "admin", notes)
	if err != nil {
		return nil, err
	}

	resp := toOrderResponse(updated)
	return &resp, nil
}

func (s *orderService) AdminAssignDeliveryPerson(ctx context.Context, adminUserID, orderID uint, req dto.AssignDeliveryPersonRequest) (*dto.OrderResponse, error) {
	dp, err := s.repo.GetDeliveryPersonByID(ctx, req.DeliveryPersonID)
	if err != nil {
		return nil, err
	}
	if !dp.IsActive {
		return nil, repository.ErrDeliveryPersonNotAvail
	}

	notes := req.Notes
	if notes == "" {
		notes = fmt.Sprintf("Admin manually assigned rider %s", dp.User.DisplayName)
	}

	updated, err := s.repo.AssignDeliveryPerson(ctx, orderID, dp.ID, "", models.OrderStatusAssigned, adminUserID, "admin", notes)
	if err != nil {
		return nil, err
	}

	resp := toOrderResponse(updated)
	return &resp, nil
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

func toOrderResponse(o *models.Order) dto.OrderResponse {
	items := make([]dto.OrderItemResponse, len(o.Items))
	for i, item := range o.Items {
		items[i] = dto.OrderItemResponse{
			ID:                  item.ID,
			MenuItemID:          item.MenuItemID,
			Name:                item.Name,
			Price:               item.Price,
			Quantity:            item.Quantity,
			Subtotal:            item.Subtotal,
			SpecialInstructions: item.SpecialInstructions,
		}
	}

	history := make([]dto.OrderStatusHistoryResponse, len(o.StatusHistory))
	for i, h := range o.StatusHistory {
		history[i] = dto.OrderStatusHistoryResponse{
			ID:        h.ID,
			Status:    string(h.Status),
			ChangedBy: h.ChangedBy,
			Role:      h.Role,
			Notes:     h.Notes,
			CreatedAt: h.CreatedAt,
		}
	}

	var restSummary *dto.OrderRestaurantSummary
	if o.Restaurant.ID > 0 {
		restSummary = &dto.OrderRestaurantSummary{
			ID:           o.Restaurant.ID,
			Name:         o.Restaurant.Name,
			Address:      o.Restaurant.Address,
			Phone:        o.Restaurant.Phone,
			HeroImageURL: o.Restaurant.HeroImageURL,
			Latitude:     o.Restaurant.Lat,
			Longitude:    o.Restaurant.Lng,
		}
	}

	var custSummary *dto.OrderCustomerSummary
	if o.User.ID > 0 {
		custSummary = &dto.OrderCustomerSummary{
			ID:          o.User.ID,
			DisplayName: o.User.DisplayName,
			Email:       o.User.Email,
			Phone:       o.User.Phone,
		}
	}

	var dpSummary *dto.OrderDeliveryPersonSummary
	if o.DeliveryPerson != nil && o.DeliveryPerson.ID > 0 {
		dpSummary = &dto.OrderDeliveryPersonSummary{
			ID:           o.DeliveryPerson.ID,
			FullName:     o.DeliveryPerson.User.DisplayName,
			Phone:        o.DeliveryPerson.User.Phone,
			VehicleType:  string(o.DeliveryPerson.VehicleType),
			LicensePlate: o.DeliveryPerson.LicensePlate,
			CurrentLat:   o.DeliveryPerson.CurrentLat,
			CurrentLng:   o.DeliveryPerson.CurrentLng,
			AvgRating:    o.DeliveryPerson.AvgRating,
		}
	}

	return dto.OrderResponse{
		ID:                   o.ID,
		UserID:               o.UserID,
		RestaurantID:         o.RestaurantID,
		DeliveryPersonID:     o.DeliveryPersonID,
		Status:               string(o.Status),
		DeliveryAddress:      o.DeliveryAddress,
		DeliveryLat:          o.DeliveryLat,
		DeliveryLng:          o.DeliveryLng,
		Subtotal:             o.Subtotal,
		DeliveryFee:          o.DeliveryFee,
		Tax:                  o.Tax,
		Total:                o.Total,
		PromoCode:            o.PromoCode,
		SpecialNotes:         o.SpecialNotes,
		EstimatedDeliveryMin: o.EstimatedDeliveryMin,
		Items:                items,
		StatusHistory:        history,
		Restaurant:           restSummary,
		Customer:             custSummary,
		DeliveryPerson:       dpSummary,
		CreatedAt:            o.CreatedAt,
		UpdatedAt:            o.UpdatedAt,
	}
}
