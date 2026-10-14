package dto

import (
	"encoding/json"
	"log"
	"net/http"
)

type ErrorDetail struct {
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
	Code    string `json:"code"`
}

type Envelope struct {
	Data  any          `json:"data"`
	Meta  any          `json:"meta"`
	Error *ErrorDetail `json:"error"`
}

// WriteJSON sends a standard JSON envelope response.
func WriteJSON(w http.ResponseWriter, status int, data any, meta any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	resp := Envelope{
		Data:  data,
		Meta:  meta,
		Error: nil,
	}
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("failed to encode response: %v", err)
	}
}

// WriteError sends a standard JSON error envelope response.
func WriteError(w http.ResponseWriter, status int, code, message, detail string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	resp := Envelope{
		Data: nil,
		Meta: nil,
		Error: &ErrorDetail{
			Message: message,
			Detail:  detail,
			Code:    code,
		},
	}
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("failed to encode error response: %v", err)
	}
}
