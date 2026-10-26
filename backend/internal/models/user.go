package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleCustomer       UserRole = "customer"
	RoleAdmin          UserRole = "admin"
	RoleDeliveryPerson UserRole = "delivery_person"
)

// user table to store the customer data such as name , email, etc
type User struct {
	ID                uint       `gorm:"primaryKey" json:"id"`
	Email             string     `gorm:"type:varchar(255);uniqueIndex;not null" json:"email"`
	PasswordHash      string     `gorm:"type:varchar(255);not null" json:"-"`
	DisplayName       string     `gorm:"type:varchar(100);not null" json:"display_name"`
	Roles             []UserRole `gorm:"type:jsonb;serializer:json;not null;default:'[]'" json:"roles"`
	AvatarURL         string     `gorm:"type:text" json:"avatar_url,omitempty"`
	Phone             string     `gorm:"type:varchar(20)" json:"phone,omitempty"`
	Preferences       string     `gorm:"type:jsonb;default:'{}'" json:"preferences"`
	CurrentLat        *float64   `gorm:"type:double precision" json:"current_lat,omitempty"`
	CurrentLng        *float64   `gorm:"type:double precision" json:"current_lng,omitempty"`
	LocationUpdatedAt *time.Time `json:"location_updated_at,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Addresses      []Address         `gorm:"foreignKey:UserID" json:"addresses,omitempty"`
	Orders         []Order           `gorm:"foreignKey:UserID" json:"orders,omitempty"`
	Reviews        []Review          `gorm:"foreignKey:UserID" json:"reviews,omitempty"`
	Interactions   []UserInteraction `gorm:"foreignKey:UserID" json:"-"`
	DeliveryPerson *DeliveryPerson   `gorm:"foreignKey:UserID" json:"-"`
}

func (u User) HasRole(role UserRole) bool {
	for _, assigned := range u.Roles {
		if assigned == role {
			return true
		}
	}
	return false
}
