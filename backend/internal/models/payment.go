package models

import "time"

// PaymentStatus tracks the lifecycle of a payment transaction.
type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "PENDING"
	PaymentStatusCompleted PaymentStatus = "COMPLETED"
	PaymentStatusFailed    PaymentStatus = "FAILED"
	PaymentStatusRefunded  PaymentStatus = "REFUNDED"
)

type Payment struct {
	ID      uint    `gorm:"primaryKey" json:"id"`
	OrderID uint    `gorm:"not null;uniqueIndex" json:"order_id"` // One payment per order
	UserID  uint    `gorm:"not null;index" json:"user_id"`
	Amount  float64 `gorm:"type:decimal(10,2);not null" json:"amount"`
	Method  string  `gorm:"type:varchar(30);not null;default:'ESEWA'" json:"method"`

	Status PaymentStatus `gorm:"type:varchar(20);not null;default:'PENDING';index" json:"status"`

	// eSewa-specific fields
	TransactionUUID string `gorm:"type:varchar(100);uniqueIndex;not null" json:"transaction_uuid"` // Our generated UUID for eSewa
	ProductCode     string `gorm:"type:varchar(100);not null" json:"product_code"`                 // ESEWA product/merchant code
	TransactionCode string `gorm:"type:varchar(200)" json:"transaction_code,omitempty"`            // eSewa's transaction code (returned on success)
	RefID           string `gorm:"type:varchar(200)" json:"ref_id,omitempty"`                      // eSewa ref ID

	PaidAt *time.Time `json:"paid_at,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Associations
	Order Order `gorm:"foreignKey:OrderID" json:"-"`
	User  User  `gorm:"foreignKey:UserID" json:"-"`
}
