package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"

	"github.com/dineshkadel/backend/internal/dto"
)

const MaxMenuImageSize = 5 << 20

type ImageUploadError struct {
	StatusCode int
	Code       string
	Message    string
	Err        error
}

func (e *ImageUploadError) Error() string { return e.Err.Error() }

// UploadMenuItemImage stores an optional multipart field named "image" and
func UploadMenuItemImage(r *http.Request) (string, string, error) {
	file, header, err := r.FormFile("image")
	if errors.Is(err, http.ErrMissingFile) {
		return "", "", nil
	}
	if err != nil {
		return "", "", &ImageUploadError{StatusCode: http.StatusBadRequest, Code: "INVALID_IMAGE", Message: "Could not read image upload", Err: err}
	}
	defer file.Close()

	if header.Size > MaxMenuImageSize {
		return "", "", &ImageUploadError{StatusCode: http.StatusBadRequest, Code: "INVALID_IMAGE", Message: "Image must be 5 MB or smaller", Err: fmt.Errorf("uploaded file size is %d bytes", header.Size)}
	}
	data, err := io.ReadAll(io.LimitReader(file, MaxMenuImageSize+1))
	if err != nil {
		return "", "", &ImageUploadError{StatusCode: http.StatusBadRequest, Code: "INVALID_IMAGE", Message: "Could not read image upload", Err: err}
	}
	if len(data) == 0 || len(data) > MaxMenuImageSize {
		return "", "", &ImageUploadError{StatusCode: http.StatusBadRequest, Code: "INVALID_IMAGE", Message: "Image must be between 1 byte and 5 MB", Err: fmt.Errorf("uploaded file size is %d bytes", len(data))}
	}

	extensions := map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
	ext, ok := extensions[http.DetectContentType(data)]
	if !ok {
		return "", "", &ImageUploadError{StatusCode: http.StatusBadRequest, Code: "INVALID_IMAGE", Message: "Only JPEG, PNG, and WebP images are allowed", Err: errors.New("unsupported image content type")}
	}

	uploadDir := os.Getenv("MENU_IMAGE_DIR")
	if uploadDir == "" {
		uploadDir = filepath.Join("uploads", "menu-items")
	}
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", "", &ImageUploadError{StatusCode: http.StatusInternalServerError, Code: "UPLOAD_FAILED", Message: "Could not store image", Err: err}
	}
	var randomName [16]byte
	if _, err := rand.Read(randomName[:]); err != nil {
		return "", "", &ImageUploadError{StatusCode: http.StatusInternalServerError, Code: "UPLOAD_FAILED", Message: "Could not store image", Err: err}
	}
	filename := hex.EncodeToString(randomName[:]) + ext
	imagePath := filepath.Join(uploadDir, filename)
	if err := os.WriteFile(imagePath, data, 0644); err != nil {
		return "", "", &ImageUploadError{StatusCode: http.StatusInternalServerError, Code: "UPLOAD_FAILED", Message: "Could not store image", Err: err}
	}
	return "/uploads/menu-items/" + filename, imagePath, nil
}

func WriteImageUploadError(w http.ResponseWriter, err error) {
	var uploadErr *ImageUploadError
	if errors.As(err, &uploadErr) {
		detail := ""
		if uploadErr.Err != nil {
			detail = uploadErr.Err.Error()
		}
		dto.WriteError(w, uploadErr.StatusCode, uploadErr.Code, uploadErr.Message, detail)
		return
	}
	dto.WriteError(w, http.StatusInternalServerError, "UPLOAD_FAILED", "Could not store image", err.Error())
}
