package repository

import (
	"context"
	"errors"

	"github.com/dineshkadel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrDeliveryPersonNotFound      = errors.New("delivery person not found")
	ErrDeliveryPersonAlreadyExists = errors.New("delivery person with this email or phone already exists")
)

type DeliveryPersonRepository interface {
	Create(ctx context.Context, person *models.DeliveryPerson) error
	GetByID(ctx context.Context, id uint) (*models.DeliveryPerson, error)
	GetByEmail(ctx context.Context, email string) (*models.DeliveryPerson, error)
}

type deliveryPersonRepository struct{ db *gorm.DB }

func NewDeliveryPersonRepository(db *gorm.DB) DeliveryPersonRepository {
	return &deliveryPersonRepository{db: db}
}

func (r *deliveryPersonRepository) Create(ctx context.Context, person *models.DeliveryPerson) error {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.DeliveryPerson{}).
		Where("email = ? OR phone = ?", person.Email, person.Phone).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return ErrDeliveryPersonAlreadyExists
	}
	return r.db.WithContext(ctx).Create(person).Error
}

func (r *deliveryPersonRepository) GetByID(ctx context.Context, id uint) (*models.DeliveryPerson, error) {
	var person models.DeliveryPerson
	if err := r.db.WithContext(ctx).First(&person, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDeliveryPersonNotFound
		}
		return nil, err
	}
	return &person, nil
}

func (r *deliveryPersonRepository) GetByEmail(ctx context.Context, email string) (*models.DeliveryPerson, error) {
	var person models.DeliveryPerson
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&person).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDeliveryPersonNotFound
		}
		return nil, err
	}
	return &person, nil
}
