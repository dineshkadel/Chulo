package models

import (
	"time"

	"gorm.io/gorm"
)

// OrderStatus represents the state machine for order lifecycle.
type OrderStatus string

const (
	OrderStatusPending        OrderStatus = "PENDING"
	OrderStatusConfirmed      OrderStatus = "CONFIRMED"
	OrderStatusPreparing      OrderStatus = "PREPARING"
	OrderStatusOutForDelivery OrderStatus = "OUT_FOR_DELIVERY"
	OrderStatusDelivered      OrderStatus = "DELIVERED"
	OrderStatusCancelled      OrderStatus = "CANCELLED"
)

// Order represents a customer's order from a single restaurant.
type Order struct {
	ID           uint        `gorm:"primaryKey" json:"id"`
	UserID       uint        `gorm:"not null;index" json:"user_id"`
	RestaurantID uint        `gorm:"not null;index" json:"restaurant_id"`
	Status       OrderStatus `gorm:"type:varchar(30);not null;default:'PENDING';index" json:"status"`

	DeliveryAddressID uint    `gorm:"not null" json:"delivery_address_id"`
	DeliveryLat       float64 `gorm:"type:double precision;not null" json:"delivery_lat"`
	DeliveryLng       float64 `gorm:"type:double precision;not null" json:"delivery_lng"`
	DeliveryAddress   string  `gorm:"type:text;not null" json:"delivery_address"`

	Subtotal    float64 `gorm:"type:decimal(10,2);not null" json:"subtotal"`
	DeliveryFee float64 `gorm:"type:decimal(10,2);not null;default:0" json:"delivery_fee"`
	Tax         float64 `gorm:"type:decimal(10,2);not null;default:0" json:"tax"`
	Total       float64 `gorm:"type:decimal(10,2);not null" json:"total"`

	PromoCode    string `gorm:"type:varchar(50)" json:"promo_code,omitempty"`
	SpecialNotes string `gorm:"type:text" json:"special_notes,omitempty"`

	EstimatedDeliveryMin int `gorm:"type:int" json:"estimated_delivery_min,omitempty"`

	DeliveryPersonID *uint `gorm:"index" json:"delivery_person_id,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Associations
	User           User            `gorm:"foreignKey:UserID" json:"-"`
	Restaurant     Restaurant      `gorm:"foreignKey:RestaurantID" json:"-"`
	DeliveryPerson *DeliveryPerson `gorm:"foreignKey:DeliveryPersonID" json:"delivery_person,omitempty"`
	Items          []OrderItem     `gorm:"foreignKey:OrderID" json:"items,omitempty"`
	Review         *Review         `gorm:"foreignKey:OrderID" json:"review,omitempty"`
}

// OrderItem represents a single line item within an order.
type OrderItem struct {
	ID         uint `gorm:"primaryKey" json:"id"`
	OrderID    uint `gorm:"not null;index" json:"order_id"`
	MenuItemID uint `gorm:"not null" json:"menu_item_id"`

	Name     string  `gorm:"type:varchar(200);not null" json:"name"`
	Price    float64 `gorm:"type:decimal(10,2);not null" json:"price"`
	Quantity int     `gorm:"not null;default:1;check:quantity >= 1" json:"quantity"`
	Subtotal float64 `gorm:"type:decimal(10,2);not null" json:"subtotal"` // Price × Quantity

	SpecialInstructions string `gorm:"type:text" json:"special_instructions,omitempty"`

	CreatedAt time.Time `json:"created_at"`

	Order    Order    `gorm:"foreignKey:OrderID" json:"-"`
	MenuItem MenuItem `gorm:"foreignKey:MenuItemID" json:"-"`
}
