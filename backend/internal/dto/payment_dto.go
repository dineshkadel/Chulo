package dto

import "github.com/dineshkadel/backend/internal/models"

// InitiatePaymentRequest is sent by the customer to start an eSewa payment.
type InitiatePaymentRequest struct {
	OrderID uint `json:"order_id" validate:"required"`
}

// EsewaFormFields contains all fields needed to submit the eSewa payment form from the frontend.
type EsewaFormFields struct {
	Amount          string `json:"amount"`
	TaxAmount       string `json:"tax_amount"`
	TotalAmount     string `json:"total_amount"`
	TransactionUUID string `json:"transaction_uuid"`
	ProductCode     string `json:"product_code"`
	ProductServiceCharge string `json:"product_service_charge"`
	ProductDeliveryCharge string `json:"product_delivery_charge"`
	SuccessURL      string `json:"success_url"`
	FailureURL      string `json:"failure_url"`
	SignedFieldNames string `json:"signed_field_names"`
	Signature       string `json:"signature"`
	PaymentURL      string `json:"payment_url"` // eSewa form action URL
}

// InitiatePaymentResponse is returned to the frontend to submit the eSewa form.
type InitiatePaymentResponse struct {
	PaymentID uint            `json:"payment_id"`
	Form      EsewaFormFields `json:"form"`
}

// PaymentStatusResponse is returned when querying payment status for an order.
type PaymentStatusResponse struct {
	PaymentID       uint                 `json:"payment_id"`
	OrderID         uint                 `json:"order_id"`
	Amount          float64              `json:"amount"`
	Status          models.PaymentStatus `json:"status"`
	Method          string               `json:"method"`
	TransactionUUID string               `json:"transaction_uuid"`
	TransactionCode string               `json:"transaction_code,omitempty"`
	PaidAt          interface{}          `json:"paid_at,omitempty"`
	CreatedAt       interface{}          `json:"created_at"`
}

