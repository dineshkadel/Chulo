package dto

import "time"

type DeliveryPersonRegisterRequest struct {
	FullName     string `json:"full_name" validate:"required,min=2,max=100"`
	Email        string `json:"email" validate:"required,email,max=255"`
	Password     string `json:"password" validate:"required,min=8,max=100"`
	Phone        string `json:"phone" validate:"required,min=7,max=20"`
	VehicleType  string `json:"vehicle_type,omitempty" validate:"omitempty,oneof=BIKE SCOOTER CAR"`
	LicensePlate string `json:"license_plate,omitempty" validate:"omitempty,max=30"`
}

type DeliveryPersonLoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type DeliveryPersonResponse struct {
	ID              uint      `json:"id"`
	FullName        string    `json:"full_name"`
	Email           string    `json:"email"`
	Phone           string    `json:"phone"`
	AvatarURL       string    `json:"avatar_url,omitempty"`
	Status          string    `json:"status"`
	VehicleType     string    `json:"vehicle_type"`
	LicensePlate    string    `json:"license_plate,omitempty"`
	CurrentLat      float64   `json:"current_lat"`
	CurrentLng      float64   `json:"current_lng"`
	AvgRating       float64   `json:"avg_rating"`
	TotalDeliveries int       `json:"total_deliveries"`
	IsVerified      bool      `json:"is_verified"`
	IsActive        bool      `json:"is_active"`
	CreatedAt       time.Time `json:"created_at"`
}

type DeliveryPersonAuthResponse struct {
	DeliveryPerson DeliveryPersonResponse `json:"delivery_person"`
	AccessToken    string                 `json:"access_token"`
	RefreshToken   string                 `json:"refresh_token"`
	TokenType      string                 `json:"token_type"`
	ExpiresIn      int64                  `json:"expires_in"`
}
