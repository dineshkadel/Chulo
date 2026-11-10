package dto

import "time"

// ─── Request DTOs ─────────────────────────────────────────────────────────────

type CreateOrderItemRequest struct {
	MenuItemID          uint   `json:"menu_item_id" validate:"required,gt=0"`
	Quantity            int    `json:"quantity" validate:"required,min=1"`
	SpecialInstructions string `json:"special_instructions,omitempty"`
}

type CreateOrderRequest struct {
	RestaurantID      uint                     `json:"restaurant_id" validate:"required,gt=0"`
	Items             []CreateOrderItemRequest `json:"items" validate:"required,min=1,dive"`
	DeliveryAddress   string                   `json:"delivery_address" validate:"required"`
	DeliveryLat       float64                  `json:"delivery_lat" validate:"required,latitude"`
	DeliveryLng       float64                  `json:"delivery_lng" validate:"required,longitude"`
	DeliveryAddressID *uint                    `json:"delivery_address_id,omitempty"`
	SpecialNotes      string                   `json:"special_notes,omitempty"`
	PromoCode         string                   `json:"promo_code,omitempty"`
}

type QuoteDeliveryFeeRequest struct {
	RestaurantID uint    `json:"restaurant_id" validate:"required,gt=0"`
	DeliveryLat  float64 `json:"delivery_lat" validate:"required,latitude"`
	DeliveryLng  float64 `json:"delivery_lng" validate:"required,longitude"`
}

type QuoteDeliveryFeeResponse struct {
	DistanceKm   float64 `json:"distance_km"`
	DeliveryFee  float64 `json:"delivery_fee"`
	EstimatedMin int     `json:"estimated_min"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status" validate:"required"`
	Notes  string `json:"notes,omitempty"`
}

type AssignDeliveryPersonRequest struct {
	DeliveryPersonID uint   `json:"delivery_person_id" validate:"required,gt=0"`
	Notes            string `json:"notes,omitempty"`
}

// ─── Response DTOs ────────────────────────────────────────────────────────────

type OrderItemResponse struct {
	ID                  uint    `json:"id"`
	MenuItemID          uint    `json:"menu_item_id"`
	Name                string  `json:"name"`
	Price               float64 `json:"price"`
	Quantity            int     `json:"quantity"`
	Subtotal            float64 `json:"subtotal"`
	SpecialInstructions string  `json:"special_instructions,omitempty"`
}

type OrderStatusHistoryResponse struct {
	ID        uint      `json:"id"`
	Status    string    `json:"status"`
	ChangedBy uint      `json:"changed_by"`
	Role      string    `json:"role"`
	Notes     string    `json:"notes,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type OrderRestaurantSummary struct {
	ID           uint    `json:"id"`
	Name         string  `json:"name"`
	Address      string  `json:"address,omitempty"`
	Phone        string  `json:"phone,omitempty"`
	HeroImageURL string  `json:"hero_image_url,omitempty"`
	Latitude     float64 `json:"latitude"`
	Longitude    float64 `json:"longitude"`
}

type OrderCustomerSummary struct {
	ID          uint   `json:"id"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email"`
	Phone       string `json:"phone,omitempty"`
}

type OrderDeliveryPersonSummary struct {
	ID           uint    `json:"id"`
	FullName     string  `json:"full_name"`
	Phone        string  `json:"phone"`
	VehicleType  string  `json:"vehicle_type"`
	LicensePlate string  `json:"license_plate,omitempty"`
	CurrentLat   float64 `json:"current_lat"`
	CurrentLng   float64 `json:"current_lng"`
	AvgRating    float64 `json:"avg_rating"`
}

type OrderResponse struct {
	ID                   uint                        `json:"id"`
	UserID               uint                        `json:"user_id"`
	RestaurantID         uint                        `json:"restaurant_id"`
	DeliveryPersonID     *uint                       `json:"delivery_person_id,omitempty"`
	Status               string                      `json:"status"`
	DeliveryAddress      string                      `json:"delivery_address"`
	DeliveryLat          float64                     `json:"delivery_lat"`
	DeliveryLng          float64                     `json:"delivery_lng"`
	Subtotal             float64                     `json:"subtotal"`
	DeliveryFee          float64                     `json:"delivery_fee"`
	Tax                  float64                     `json:"tax"`
	Total                float64                     `json:"total"`
	PromoCode            string                      `json:"promo_code,omitempty"`
	SpecialNotes         string                      `json:"special_notes,omitempty"`
	EstimatedDeliveryMin int                         `json:"estimated_delivery_min"`
	Items                []OrderItemResponse         `json:"items"`
	StatusHistory        []OrderStatusHistoryResponse `json:"status_history,omitempty"`
	Restaurant           *OrderRestaurantSummary     `json:"restaurant,omitempty"`
	Customer             *OrderCustomerSummary       `json:"customer,omitempty"`
	DeliveryPerson       *OrderDeliveryPersonSummary `json:"delivery_person,omitempty"`
	CreatedAt            time.Time                   `json:"created_at"`
	UpdatedAt            time.Time                   `json:"updated_at"`
}

