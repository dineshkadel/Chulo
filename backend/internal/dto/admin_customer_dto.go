package dto

import "time"

// AdminCustomerItem represents customer row data in the admin table.
type AdminCustomerItem struct {
	ID          uint      `json:"id"`
	Email       string    `json:"email"`
	DisplayName string    `json:"display_name"`
	Phone       string    `json:"phone,omitempty"`
	Roles       []string  `json:"roles"`
	AvatarURL   string    `json:"avatar_url,omitempty"`
	IsActive    bool      `json:"is_active"`
	OrdersCount int64     `json:"orders_count"`
	TotalSpent  float64   `json:"total_spent"`
	CreatedAt   time.Time `json:"created_at"`
}

// AdminCustomerListResponse holds paginated customer results.
type AdminCustomerListResponse struct {
	Customers []AdminCustomerItem `json:"customers"`
	Total     int64               `json:"total"`
	Page      int                 `json:"page"`
	Limit     int                 `json:"limit"`
}

// AdminCustomerDetailResponse holds full details for viewing a customer in modal.
type AdminCustomerDetailResponse struct {
	AdminCustomerItem
	Addresses []AddressResponse `json:"addresses"`
}

// AddressResponse represents a customer saved address.
type AddressResponse struct {
	ID        uint    `json:"id"`
	Label     string  `json:"label"`
	Street    string  `json:"street"`
	City      string  `json:"city"`
	Lat       float64 `json:"lat"`
	Lng       float64 `json:"lng"`
	IsDefault bool    `json:"is_default"`
}

// UpdateCustomerStatusRequest payload for toggling user active/suspended state.
type UpdateCustomerStatusRequest struct {
	IsActive *bool `json:"is_active" validate:"required"`
}

// UpdateCustomerRoleRequest payload for changing user role from admin panel.
type UpdateCustomerRoleRequest struct {
	Role string `json:"role" validate:"required,oneof=customer admin delivery_person"`
}

