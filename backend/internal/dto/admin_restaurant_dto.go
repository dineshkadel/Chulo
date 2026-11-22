package dto

import "time"

// AdminRestaurantItem represents a single restaurant row with aggregated business metrics.
type AdminRestaurantItem struct {
	ID             uint      `json:"id"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Phone          string    `json:"phone,omitempty"`
	Address        string    `json:"address"`
	Description    string    `json:"description,omitempty"`
	CuisineTypes   string    `json:"cuisine_types"`
	PriceTier      int       `json:"price_tier"`
	Lat            float64   `json:"lat"`
	Lng            float64   `json:"lng"`
	OperatingHours string    `json:"operating_hours,omitempty"`
	HeroImageURL   string    `json:"hero_image_url,omitempty"`
	AvgRating      float64   `json:"avg_rating"`
	ReviewCount    int       `json:"review_count"`
	DietaryTags    string    `json:"dietary_tags,omitempty"`
	IsActive       bool      `json:"is_active"`
	TotalOrders    int64     `json:"total_orders"`
	TotalRevenue   float64   `json:"total_revenue"`
	MenuItemsCount int64     `json:"menu_items_count"`
	CreatedAt      time.Time `json:"created_at"`
}

// AdminRestaurantListResponse represents paginated restaurant results for admin.
type AdminRestaurantListResponse struct {
	Restaurants []AdminRestaurantItem `json:"restaurants"`
	Total       int64                 `json:"total"`
	Page        int                   `json:"page"`
	Limit       int                   `json:"limit"`
}

// CreateAdminRestaurantRequest is the payload to add a new restaurant partner.
type CreateAdminRestaurantRequest struct {
	Name           string   `json:"name" validate:"required,min=2,max=200"`
	Email          string   `json:"email" validate:"required,email,max=255"`
	Password       string   `json:"password" validate:"required,min=6,max=100"`
	Phone          string   `json:"phone,omitempty" validate:"omitempty,max=20"`
	Address        string   `json:"address" validate:"required,max=500"`
	Description    string   `json:"description,omitempty" validate:"omitempty,max=1000"`
	CuisineTypes   string   `json:"cuisine_types,omitempty"`
	PriceTier      int      `json:"price_tier,omitempty" validate:"omitempty,min=1,max=4"`
	Lat            float64  `json:"lat" validate:"required"`
	Lng            float64  `json:"lng" validate:"required"`
	OperatingHours string   `json:"operating_hours,omitempty"`
	HeroImageURL   string   `json:"hero_image_url,omitempty"`
	DietaryTags    string   `json:"dietary_tags,omitempty"`
	IsActive       *bool    `json:"is_active,omitempty"`
}

// UpdateAdminRestaurantRequest is the payload to update an existing restaurant.
type UpdateAdminRestaurantRequest struct {
	Name           string   `json:"name" validate:"required,min=2,max=200"`
	Email          string   `json:"email" validate:"required,email,max=255"`
	Password       string   `json:"password,omitempty" validate:"omitempty,min=6,max=100"`
	Phone          string   `json:"phone,omitempty" validate:"omitempty,max=20"`
	Address        string   `json:"address" validate:"required,max=500"`
	Description    string   `json:"description,omitempty" validate:"omitempty,max=1000"`
	CuisineTypes   string   `json:"cuisine_types,omitempty"`
	PriceTier      int      `json:"price_tier" validate:"required,min=1,max=4"`
	Lat            float64  `json:"lat" validate:"required"`
	Lng            float64  `json:"lng" validate:"required"`
	OperatingHours string   `json:"operating_hours,omitempty"`
	HeroImageURL   string   `json:"hero_image_url,omitempty"`
	DietaryTags    string   `json:"dietary_tags,omitempty"`
	IsActive       *bool    `json:"is_active,omitempty"`
}

// UpdateAdminRestaurantStatusRequest allows activating or deactivating a restaurant.
type UpdateAdminRestaurantStatusRequest struct {
	IsActive *bool `json:"is_active" validate:"required"`
}

// AdminRestaurantStats holds performance statistics for a restaurant.
type AdminRestaurantStats struct {
	TotalOrders      int64   `json:"total_orders"`
	TotalRevenue     float64 `json:"total_revenue"`
	CompletedOrders  int64   `json:"completed_orders"`
	CancelledOrders  int64   `json:"cancelled_orders"`
	PendingOrders    int64   `json:"pending_orders"`
	MenuItemsCount   int64   `json:"menu_items_count"`
	AvgRating        float64 `json:"avg_rating"`
	ReviewCount      int     `json:"review_count"`
}

// AdminRestaurantMenuItem holds simplified menu item info for the restaurant detail view.
type AdminRestaurantMenuItem struct {
	ID           uint      `json:"id"`
	RestaurantID uint      `json:"restaurant_id"`
	CategoryID   uint      `json:"category_id"`
	CategoryName string    `json:"category_name"`
	Name         string    `json:"name"`
	Description  string    `json:"description,omitempty"`
	Price        float64   `json:"price"`
	ImageURL     string    `json:"image_url,omitempty"`
	DietaryTags  string    `json:"dietary_tags,omitempty"`
	IsAvailable  bool      `json:"is_available"`
	CreatedAt    time.Time `json:"created_at"`
}

// AdminRestaurantOrderItem holds order row info for the restaurant detail view.
type AdminRestaurantOrderItem struct {
	ID              uint      `json:"id"`
	Status          string    `json:"status"`
	Total           float64   `json:"total"`
	Subtotal        float64   `json:"subtotal"`
	DeliveryFee     float64   `json:"delivery_fee"`
	ItemsCount      int       `json:"items_count"`
	CustomerName    string    `json:"customer_name"`
	CustomerEmail   string    `json:"customer_email"`
	CustomerPhone   string    `json:"customer_phone,omitempty"`
	DeliveryAddress string    `json:"delivery_address"`
	ItemsSummary    string    `json:"items_summary"`
	CreatedAt       time.Time `json:"created_at"`
}

// AdminRestaurantDetailResponse includes full details, business statistics, menu items, and recent orders.
type AdminRestaurantDetailResponse struct {
	Restaurant   AdminRestaurantItem        `json:"restaurant"`
	Stats        AdminRestaurantStats       `json:"stats"`
	MenuItems    []AdminRestaurantMenuItem  `json:"menu_items"`
	RecentOrders []AdminRestaurantOrderItem `json:"recent_orders"`
}

