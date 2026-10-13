package models

import "time"

// Review represents a customer's rating and text review for a restaurant,  tied to order

type Review struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	UserID       uint   `gorm:"not null;index;uniqueIndex:idx_reviews_user_order" json:"user_id"`
	RestaurantID uint   `gorm:"not null;index" json:"restaurant_id"`
	OrderID      uint   `gorm:"not null;uniqueIndex:idx_reviews_user_order" json:"order_id"`
	Stars        int    `gorm:"type:smallint;not null;check:stars >= 1 AND stars <= 5" json:"stars"`
	Text         string `gorm:"type:text" json:"text,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	User       User       `gorm:"foreignKey:UserID" json:"-"`
	Restaurant Restaurant `gorm:"foreignKey:RestaurantID" json:"-"`
	Order      Order      `gorm:"foreignKey:OrderID" json:"-"`
}
