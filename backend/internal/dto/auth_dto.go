package dto

import "time"

// payload for registering a new user.
type RegisterRequest struct {
	DisplayName string `json:"name" validate:"required,min=2,max=100"`
	Email       string `json:"email" validate:"required,email,max=255"`
	Password    string `json:"password" validate:"required,min=8,max=16"`
	Phone       string `json:"phone,omitempty" validate:"omitempty,max=20"`
}

// payload for authenticating an existing user.
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// payload to exchange a refresh token for a new access token.
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// payload for user coordinates provided after login when permission is granted.
type UpdateLocationRequest struct {
	Latitude      float64 `json:"latitude" validate:"required,latitude"`
	Longitude     float64 `json:"longitude" validate:"required,longitude"`
	Label         string  `json:"label,omitempty" validate:"omitempty,max=50"`
	City          string  `json:"city,omitempty" validate:"omitempty,max=100"`
	Street        string  `json:"street,omitempty" validate:"omitempty,max=255"`
	SaveAsAddress bool    `json:"save_as_address,omitempty"`
}

// represents safe user data returned in API responses.
type UserResponse struct {
	ID                uint       `json:"id"`
	Email             string     `json:"email"`
	DisplayName       string     `json:"display_name"`
	AvatarURL         string     `json:"avatar_url,omitempty"`
	Phone             string     `json:"phone,omitempty"`
	CurrentLat        *float64   `json:"current_lat,omitempty"`
	CurrentLng        *float64   `json:"current_lng,omitempty"`
	LocationUpdatedAt *time.Time `json:"location_updated_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
}

// result of a successful registration, login, or token refresh.
type AuthResponse struct {
	User         UserResponse `json:"user"`
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"refresh_token"`
	TokenType    string       `json:"token_type"`
	ExpiresIn    int64        `json:"expires_in"`
}
