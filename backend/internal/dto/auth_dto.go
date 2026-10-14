package dto

import "time"

// payload for registering a new user.
type RegisterRequest struct {
	DisplayName string `json:"name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
	Phone       string `json:"phone,omitempty"`
}

// payload for authenticating an existing user.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// payload to exchange a refresh token for a new access token.
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// payload for user coordinates provided after login when permission is granted.
type UpdateLocationRequest struct {
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	Label         string  `json:"label,omitempty"`
	City          string  `json:"city,omitempty"`
	Street        string  `json:"street,omitempty"`
	SaveAsAddress bool    `json:"save_as_address,omitempty"`
}

// safe user data returned in API responses.
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
