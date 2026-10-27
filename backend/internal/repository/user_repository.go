package repository

import (
	"context"
	"errors"
	"time"

	"github.com/dineshkadel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user with this email already exists")
)

// defines database operations for users.
type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id uint) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	UpdateLocation(ctx context.Context, id uint, lat, lng float64, updatedAt time.Time) (*models.User, error)
	CreateAddress(ctx context.Context, addr *models.Address) error
}

type userRepository struct {
	db *gorm.DB
}

// returns a new instance of UserRepository.
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("email = ?", user.Email).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return ErrUserAlreadyExists
	}

	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepository) GetByID(ctx context.Context, id uint) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Preload("Addresses").Preload("DeliveryPerson").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) UpdateLocation(ctx context.Context, id uint, lat, lng float64, updatedAt time.Time) (*models.User, error) {
	updates := map[string]any{
		"current_lat":         lat,
		"current_lng":         lng,
		"location_updated_at": updatedAt,
	}

	result := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", id).Updates(updates)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, ErrUserNotFound
	}

	return r.GetByID(ctx, id)
}

func (r *userRepository) CreateAddress(ctx context.Context, addr *models.Address) error {
	return r.db.WithContext(ctx).Create(addr).Error
}
