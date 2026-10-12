package models

import (
	"time"

	"gorm.io/gorm"
)

// MenuCategory groups menu items within a restaurant such as apptizersm, main course.
type MenuCategory struct {
	ID           uint   `gorm:"primaryKey" json:"id"`
	RestaurantID uint   `gorm:"not null;index" json:"restaurant_id"`
	Name         string `gorm:"type:varchar(100);not null" json:"name"`
	SortOrder    int    `gorm:"not null;default:0" json:"sort_order"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Associations
	Restaurant Restaurant `gorm:"foreignKey:RestaurantID" json:"-"`
	MenuItems  []MenuItem `gorm:"foreignKey:CategoryID" json:"menu_items,omitempty"`
}

// MenuItem represents a single dish or item within a menu category.
type MenuItem struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	CategoryID  uint    `gorm:"not null;index" json:"category_id"`
	Name        string  `gorm:"type:varchar(200);not null" json:"name"`
	Description string  `gorm:"type:text" json:"description,omitempty"`
	Price       float64 `gorm:"type:decimal(10,2);not null" json:"price"`
	ImageURL    string  `gorm:"type:text" json:"image_url,omitempty"`

	DietaryTags string `gorm:"type:text[]" json:"dietary_tags,omitempty"`

	IsAvailable bool `gorm:"not null;default:true" json:"is_available"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Associations
	Category MenuCategory `gorm:"foreignKey:CategoryID" json:"-"`
}
