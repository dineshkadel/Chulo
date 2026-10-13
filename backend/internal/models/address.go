package models

import (
	"time"

	"gorm.io/gorm"
)

// Address represents a saved delivery address for a user.
type Address struct {
	ID     uint   `gorm:"primaryKey" json:"id"`
	UserID uint   `gorm:"not null;index" json:"user_id"`
	Label  string `gorm:"type:varchar(50);not null" json:"label"` // e.g. "Home", "Work"
	Street string `gorm:"type:varchar(255);not null" json:"street"`
	City   string `gorm:"type:varchar(100);not null" json:"city"`

	Lat float64 `gorm:"type:double precision;not null" json:"lat"`
	Lng float64 `gorm:"type:double precision;not null" json:"lng"`

	OsmID          int64  `gorm:"type:bigint" json:"osm_id,omitempty"`
	OsmDisplayName string `gorm:"type:text" json:"osm_display_name,omitempty"`

	IsDefault bool `gorm:"default:false" json:"is_default"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}
