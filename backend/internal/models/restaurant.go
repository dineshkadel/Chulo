package models

import (
	"time"

	"gorm.io/gorm"
)

type Restaurant struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"type:varchar(200);not null;index" json:"name"`
	Description string `gorm:"type:text" json:"description"`

	CuisineTypes string `gorm:"type:text[];not null" json:"cuisine_types"`

	PriceTier int `gorm:"type:smallint;not null;default:2;check:price_tier >= 1 AND price_tier <= 4" json:"price_tier"`

	Lat float64 `gorm:"type:double precision;not null;index:idx_restaurants_location" json:"lat"`
	Lng float64 `gorm:"type:double precision;not null;index:idx_restaurants_location" json:"lng"`

	Address string `gorm:"type:text;not null" json:"address"`
	Phone   string `gorm:"type:varchar(20)" json:"phone,omitempty"`

	OperatingHours string `gorm:"type:jsonb;default:'{}'" json:"operating_hours"`

	HeroImageURL string `gorm:"type:text" json:"hero_image_url,omitempty"`

	AvgRating   float64 `gorm:"type:double precision;not null;default:0;index" json:"avg_rating"`
	ReviewCount int     `gorm:"not null;default:0" json:"review_count"`

	DietaryTags string `gorm:"type:text[]" json:"dietary_tags,omitempty"`

	OsmID      int64  `gorm:"type:bigint" json:"osm_id,omitempty"`
	OsmPlaceID int64  `gorm:"type:bigint" json:"osm_place_id,omitempty"`
	OsmType    string `gorm:"type:varchar(20)" json:"osm_type,omitempty"` // "node", "way", "relation"

	IsActive bool `gorm:"not null;default:true;index" json:"is_active"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	MenuCategories []MenuCategory    `gorm:"foreignKey:RestaurantID" json:"menu_categories,omitempty"`
	Reviews        []Review          `gorm:"foreignKey:RestaurantID" json:"reviews,omitempty"`
	Orders         []Order           `gorm:"foreignKey:RestaurantID" json:"orders,omitempty"`
	Interactions   []UserInteraction `gorm:"foreignKey:RestaurantID" json:"-"`
}
