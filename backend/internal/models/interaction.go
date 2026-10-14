package models

import "time"

type InteractionType string

// features table for the recommendation models
const (
	InteractionClick   InteractionType = "click"
	InteractionOrder   InteractionType = "order"
	InteractionRating  InteractionType = "rating"
	InteractionDismiss InteractionType = "dismiss"
)

type UserInteraction struct {
	ID           uint            `gorm:"primaryKey" json:"id"`
	UserID       uint            `gorm:"not null;index:idx_interactions_user;index:idx_interactions_user_restaurant" json:"user_id"`
	RestaurantID uint            `gorm:"not null;index:idx_interactions_restaurant;index:idx_interactions_user_restaurant" json:"restaurant_id"`
	Type         InteractionType `gorm:"type:varchar(20);not null;index:idx_interactions_type" json:"type"`

	Value float64 `gorm:"type:double precision;not null;default:0" json:"value"`

	Lat float64 `gorm:"type:double precision" json:"lat,omitempty"`
	Lng float64 `gorm:"type:double precision" json:"lng,omitempty"`

	CreatedAt time.Time `gorm:"not null;index:idx_interactions_created" json:"created_at"`

	User       User       `gorm:"foreignKey:UserID" json:"-"`
	Restaurant Restaurant `gorm:"foreignKey:RestaurantID" json:"-"`
}
