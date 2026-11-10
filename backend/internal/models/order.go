package models

import (
	"time"

	"gorm.io/gorm"
)

// OrderStatus represents the state machine for the order lifecycle:
// PLACED -> ACCEPTED -> PREPARING -> READY -> ASSIGNED -> PICKED_UP -> DELIVERED
//    |          |
// REJECTED   CANCELLED
type OrderStatus string

const (
	OrderStatusPlaced    OrderStatus = "PLACED"
	OrderStatusAccepted  OrderStatus = "ACCEPTED"
	OrderStatusPreparing OrderStatus = "PREPARING"
	OrderStatusReady     OrderStatus = "READY"
	OrderStatusAssigned  OrderStatus = "ASSIGNED"
	OrderStatusPickedUp  OrderStatus = "PICKED_UP"
	OrderStatusDelivered OrderStatus = "DELIVERED"
	OrderStatusRejected  OrderStatus = "REJECTED"
	OrderStatusCancelled OrderStatus = "CANCELLED"

	// Legacy aliases kept for safety
	OrderStatusPending        OrderStatus = "PLACED"
	OrderStatusConfirmed      OrderStatus = "ACCEPTED"
	OrderStatusOutForDelivery OrderStatus = "PICKED_UP"
)

// Order represents a customer's order from a single restaurant.
type Order struct {
	ID           uint        `gorm:"primaryKey" json:"id"`
	UserID       uint        `gorm:"not null;index" json:"user_id"`
	RestaurantID uint        `gorm:"not null;index" json:"restaurant_id"`
	Status       OrderStatus `gorm:"type:varchar(30);not null;default:'PLACED';index" json:"status"`

	DeliveryAddressID *uint   `gorm:"index" json:"delivery_address_id,omitempty"`
	DeliveryLat       float64 `gorm:"type:double precision;not null" json:"delivery_lat"`
	DeliveryLng       float64 `gorm:"type:double precision;not null" json:"delivery_lng"`
	DeliveryAddress   string  `gorm:"type:text;not null" json:"delivery_address"`

	Subtotal    float64 `gorm:"type:decimal(10,2);not null" json:"subtotal"`
	DeliveryFee float64 `gorm:"type:decimal(10,2);not null;default:0" json:"delivery_fee"`
	Tax         float64 `gorm:"type:decimal(10,2);not null;default:0" json:"tax"`
	Total       float64 `gorm:"type:decimal(10,2);not null" json:"total"`

	PromoCode    string `gorm:"type:varchar(50)" json:"promo_code,omitempty"`
	SpecialNotes string `gorm:"type:text" json:"special_notes,omitempty"`

	EstimatedDeliveryMin int `gorm:"type:int;default:30" json:"estimated_delivery_min,omitempty"`

	DeliveryPersonID *uint `gorm:"index" json:"delivery_person_id,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Associations
	User           User                 `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Restaurant     Restaurant           `gorm:"foreignKey:RestaurantID" json:"restaurant,omitempty"`
	DeliveryPerson *DeliveryPerson      `gorm:"foreignKey:DeliveryPersonID" json:"delivery_person,omitempty"`
	Items          []OrderItem          `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	StatusHistory  []OrderStatusHistory `gorm:"foreignKey:OrderID" json:"status_history,omitempty"`
	Review         *Review              `gorm:"foreignKey:OrderID" json:"review,omitempty"`
}

// OrderItem represents a single line item within an order with price snapshot.
type OrderItem struct {
	ID         uint `gorm:"primaryKey" json:"id"`
	OrderID    uint `gorm:"not null;index" json:"order_id"`
	MenuItemID uint `gorm:"not null" json:"menu_item_id"`

	Name     string  `gorm:"type:varchar(200);not null" json:"name"`
	Price    float64 `gorm:"type:decimal(10,2);not null" json:"price"` // Snapshot price at time of order
	Quantity int     `gorm:"not null;default:1;check:quantity >= 1" json:"quantity"`
	Subtotal float64 `gorm:"type:decimal(10,2);not null" json:"subtotal"` // Price * Quantity

	SpecialInstructions string `gorm:"type:text" json:"special_instructions,omitempty"`

	CreatedAt time.Time `json:"created_at"`

	Order    Order    `gorm:"foreignKey:OrderID" json:"-"`
	MenuItem MenuItem `gorm:"foreignKey:MenuItemID" json:"-"`
}

// OrderStatusHistory stores every status change for audit, tracking, and reporting.
type OrderStatusHistory struct {
	ID        uint        `gorm:"primaryKey" json:"id"`
	OrderID   uint        `gorm:"not null;index" json:"order_id"`
	Status    OrderStatus `gorm:"type:varchar(30);not null;index" json:"status"`
	ChangedBy uint        `gorm:"not null" json:"changed_by"`
	Role      string      `gorm:"type:varchar(30);not null" json:"role"` // customer, restaurant, delivery_person, admin, system
	Notes     string      `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt time.Time   `gorm:"not null;index" json:"created_at"`

	Order Order `gorm:"foreignKey:OrderID" json:"-"`
}
