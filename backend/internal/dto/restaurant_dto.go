package dto

import "time"

// payload for registering a new restaurant.
type RestaurantRegisterRequest struct {
	Name         string  `json:"name" validate:"required,min=2,max=200"`
	Email        string  `json:"email" validate:"required,email,max=255"`
	Password     string  `json:"password" validate:"required,min=8,max=100"`
	Phone        string  `json:"phone,omitempty" validate:"omitempty,max=20"`
	Address      string  `json:"address,omitempty" validate:"omitempty,max=500"`
	Description  string  `json:"description,omitempty" validate:"omitempty,max=1000"`
	CuisineTypes string  `json:"cuisine_types,omitempty"`
	PriceTier    int     `json:"price_tier,omitempty" validate:"omitempty,min=1,max=4"`
	Lat          float64 `json:"lat,omitempty" validate:"omitempty,latitude"`
	Lng          float64 `json:"lng,omitempty" validate:"omitempty,longitude"`
}

// payload for authenticating an existing restaurant.
type RestaurantLoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// RestaurantProfileUpdateRequest is the editable portion of a restaurant profile.
type RestaurantProfileUpdateRequest struct {
	Name           string  `json:"name" validate:"required,min=2,max=200"`
	Description    string  `json:"description,omitempty" validate:"omitempty,max=1000"`
	CuisineTypes   string  `json:"cuisine_types,omitempty"`
	PriceTier      int     `json:"price_tier" validate:"required,min=1,max=4"`
	Lat            float64 `json:"lat" validate:"latitude"`
	Lng            float64 `json:"lng" validate:"longitude"`
	Address        string  `json:"address,omitempty" validate:"omitempty,max=500"`
	Phone          string  `json:"phone,omitempty" validate:"omitempty,max=20"`
	OperatingHours string  `json:"operating_hours,omitempty" validate:"omitempty,json"`
	HeroImageURL   string  `json:"hero_image_url,omitempty" validate:"omitempty,url,max=2000"`
	DietaryTags    string  `json:"dietary_tags,omitempty"`
}

// restaurant data returned in API responses.
type RestaurantResponse struct {
	ID             uint      `json:"id"`
	Email          string    `json:"email"`
	Name           string    `json:"name"`
	Description    string    `json:"description,omitempty"`
	CuisineTypes   string    `json:"cuisine_types,omitempty"`
	PriceTier      int       `json:"price_tier"`
	Lat            float64   `json:"lat"`
	Lng            float64   `json:"lng"`
	Address        string    `json:"address,omitempty"`
	Phone          string    `json:"phone,omitempty"`
	OperatingHours string    `json:"operating_hours,omitempty"`
	HeroImageURL   string    `json:"hero_image_url,omitempty"`
	DietaryTags    string    `json:"dietary_tags,omitempty"`
	AvgRating      float64   `json:"avg_rating"`
	ReviewCount    int       `json:"review_count"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
}

// result of successful restaurant registration or login.
type RestaurantAuthResponse struct {
	Restaurant   RestaurantResponse `json:"restaurant"`
	AccessToken  string             `json:"access_token"`
	RefreshToken string             `json:"refresh_token"`
	TokenType    string             `json:"token_type"`
	ExpiresIn    int64              `json:"expires_in"`
}

// RestaurantBrowseResponse is the public restaurant representation used by
// discovery endpoints. It intentionally excludes account-only fields such as email.
type RestaurantBrowseResponse struct {
	ID             uint     `json:"id"`
	Name           string   `json:"name"`
	Description    string   `json:"description,omitempty"`
	CuisineTypes   string   `json:"cuisine_types,omitempty"`
	PriceTier      int      `json:"price_tier"`
	Lat            float64  `json:"lat"`
	Lng            float64  `json:"lng"`
	Address        string   `json:"address,omitempty"`
	Phone          string   `json:"phone,omitempty"`
	OperatingHours string   `json:"operating_hours,omitempty"`
	HeroImageURL   string   `json:"hero_image_url,omitempty"`
	DietaryTags    string   `json:"dietary_tags,omitempty"`
	AvgRating      float64  `json:"avg_rating"`
	ReviewCount    int      `json:"review_count"`
	IsOpen         bool     `json:"is_open"`
	DistanceKM     *float64 `json:"distance_km,omitempty"`
}
