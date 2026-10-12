package models

import (
	"time"

	"gorm.io/gorm"
)

type DeliveryPersonStatus string

const (
	DeliveryStatusAvailable  DeliveryPersonStatus = "AVAILABLE"
	DeliveryStatusOnDelivery DeliveryPersonStatus = "ON_DELIVERY"
	DeliveryStatusOffline    DeliveryPersonStatus = "OFFLINE"
)

type VehicleType string

const (
	VehicleBike    VehicleType = "BIKE"
	VehicleScooter VehicleType = "SCOOTER"
	VehicleCar     VehicleType = "CAR"
)

type DeliveryPerson struct {
	ID           uint                 `gorm:"primaryKey" json:"id"`
	FullName     string               `gorm:"type:varchar(150);not null" json:"full_name"`
	Email        string               `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash string               `gorm:"type:varchar(255);not null" json:"-"`
	Phone        string               `gorm:"type:varchar(20);not null;uniqueIndex" json:"phone"`
	AvatarURL    string               `gorm:"type:text" json:"avatar_url,omitempty"`
	Status       DeliveryPersonStatus `gorm:"type:varchar(20);not null;default:'OFFLINE';index" json:"status"`
	VehicleType  VehicleType          `gorm:"type:varchar(20);not null;default:'SCOOTER'" json:"vehicle_type"`
	LicensePlate string               `gorm:"type:varchar(30)" json:"license_plate,omitempty"`

	CurrentLat float64 `gorm:"type:double precision" json:"current_lat"`
	CurrentLng float64 `gorm:"type:double precision" json:"current_lng"`

	AvgRating       float64 `gorm:"type:double precision;not null;default:0" json:"avg_rating"`
	TotalDeliveries int     `gorm:"not null;default:0" json:"total_deliveries"`

	IsVerified bool `gorm:"not null;default:false" json:"is_verified"`
	IsActive   bool `gorm:"not null;default:true;index" json:"is_active"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Orders []Order `gorm:"foreignKey:DeliveryPersonID" json:"orders,omitempty"`
}
