package models

import (
	"time"

	"gorm.io/gorm"
)

// FoodCategory is a global category shared by menu items across restaurants.
type FoodCategory struct {
	ID   uint   `gorm:"primaryKey" json:"id"`
	Name string `gorm:"type:varchar(100);not null;uniqueIndex" json:"name"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	MenuItems []MenuItem `gorm:"foreignKey:FoodCategoryID" json:"menu_items,omitempty"`
}

// MenuItem represents a single dish associated with one global food category.
type MenuItem struct {
	ID             uint    `gorm:"primaryKey" json:"id"`
	FoodCategoryID uint    `gorm:"not null;index" json:"food_category_id"`
	Name           string  `gorm:"type:varchar(200);not null" json:"name"`
	Description    string  `gorm:"type:text" json:"description,omitempty"`
	Price          float64 `gorm:"type:decimal(10,2);not null" json:"price"`
	ImageURL       string  `gorm:"type:text" json:"image_url,omitempty"`

	DietaryTags string `gorm:"type:text[]" json:"dietary_tags,omitempty"`

	IsAvailable bool `gorm:"not null;default:true" json:"is_available"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Associations
	FoodCategory FoodCategory `gorm:"foreignKey:FoodCategoryID" json:"food_category,omitempty"`
}
