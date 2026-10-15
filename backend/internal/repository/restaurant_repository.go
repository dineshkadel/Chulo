package repository

import (
	"context"
	"errors"

	"github.com/dineshkadel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrRestaurantNotFound      = errors.New("restaurant not found")
	ErrRestaurantAlreadyExists = errors.New("restaurant with this email already exists")
)

// defines database operations for restaurants.
type RestaurantRepository interface {
	Create(ctx context.Context, restaurant *models.Restaurant) error
	GetByID(ctx context.Context, id uint) (*models.Restaurant, error)
	GetByEmail(ctx context.Context, email string) (*models.Restaurant, error)
	Update(ctx context.Context, restaurant *models.Restaurant) error
}

type restaurantRepository struct {
	db *gorm.DB
}

func NewRestaurantRepository(db *gorm.DB) RestaurantRepository {
	return &restaurantRepository{db: db}
}

func (r *restaurantRepository) Create(ctx context.Context, restaurant *models.Restaurant) error {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Restaurant{}).Where("email = ?", restaurant.Email).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return ErrRestaurantAlreadyExists
	}

	return r.db.WithContext(ctx).Create(restaurant).Error
}

func (r *restaurantRepository) GetByID(ctx context.Context, id uint) (*models.Restaurant, error) {
	var restaurant models.Restaurant
	if err := r.db.WithContext(ctx).First(&restaurant, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRestaurantNotFound
		}
		return nil, err
	}
	return &restaurant, nil
}

func (r *restaurantRepository) GetByEmail(ctx context.Context, email string) (*models.Restaurant, error) {
	var restaurant models.Restaurant
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&restaurant).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRestaurantNotFound
		}
		return nil, err
	}
	return &restaurant, nil
}

func (r *restaurantRepository) Update(ctx context.Context, restaurant *models.Restaurant) error {
	return r.db.WithContext(ctx).Save(restaurant).Error
}
