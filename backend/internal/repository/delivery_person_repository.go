package repository

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/dineshkadel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrDeliveryPersonNotFound      = errors.New("delivery person not found")
	ErrDeliveryPersonAlreadyExists = errors.New("delivery person with this email or phone already exists")
)

type DeliveryPersonRepository interface {
	Create(ctx context.Context, user *models.User, person *models.DeliveryPerson) error
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	GetByID(ctx context.Context, id uint) (*models.DeliveryPerson, error)
	GetByEmail(ctx context.Context, email string) (*models.DeliveryPerson, error)
}

type deliveryPersonRepository struct{ db *gorm.DB }

func NewDeliveryPersonRepository(db *gorm.DB) DeliveryPersonRepository {
	return &deliveryPersonRepository{db: db}
}

func (r *deliveryPersonRepository) Create(ctx context.Context, user *models.User, person *models.DeliveryPerson) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if user.ID == 0 {
			var count int64
			if err := tx.Model(&models.User{}).Where("LOWER(email) = LOWER(?) OR phone = ?", user.Email, user.Phone).Count(&count).Error; err != nil {
				return err
			}
			if count > 0 {
				return ErrDeliveryPersonAlreadyExists
			}
			if err := tx.Create(user).Error; err != nil {
				return err
			}
		} else {
			var existing models.User
			if err := tx.First(&existing, user.ID).Error; err != nil {
				return err
			}
			var phoneCount int64
			if err := tx.Model(&models.User{}).Where("phone = ? AND id <> ?", user.Phone, user.ID).Count(&phoneCount).Error; err != nil {
				return err
			}
			if phoneCount > 0 {
				return ErrDeliveryPersonAlreadyExists
			}
			if existing.Phone != "" && existing.Phone != user.Phone {
				return ErrDeliveryPersonAlreadyExists
			}
			if !existing.HasRole(models.RoleDeliveryPerson) {
				existing.Roles = append(existing.Roles, models.RoleDeliveryPerson)
			}
			if existing.Phone == "" {
				existing.Phone = user.Phone
			}
			rolesJSON, err := json.Marshal(existing.Roles)
			if err != nil {
				return err
			}
			if err := tx.Exec("UPDATE users SET roles = ?::jsonb, phone = ? WHERE id = ?", string(rolesJSON), existing.Phone, existing.ID).Error; err != nil {
				return err
			}
			*user = existing
		}
		person.UserID = user.ID
		var profileCount int64
		if err := tx.Model(&models.DeliveryPerson{}).Where("user_id = ?", user.ID).Count(&profileCount).Error; err != nil {
			return err
		}
		if profileCount > 0 {
			return ErrDeliveryPersonAlreadyExists
		}
		if err := tx.Create(person).Error; err != nil {
			return err
		}
		person.User = *user
		return nil
	})
}

func (r *deliveryPersonRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("LOWER(email) = LOWER(?)", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *deliveryPersonRepository) GetByID(ctx context.Context, id uint) (*models.DeliveryPerson, error) {
	var person models.DeliveryPerson
	if err := r.db.WithContext(ctx).Preload("User").First(&person, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDeliveryPersonNotFound
		}
		return nil, err
	}
	return &person, nil
}

func (r *deliveryPersonRepository) GetByEmail(ctx context.Context, email string) (*models.DeliveryPerson, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("LOWER(email) = LOWER(?) AND roles @> ?::jsonb", email, `["delivery_person"]`).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDeliveryPersonNotFound
		}
		return nil, err
	}
	var person models.DeliveryPerson
	if err := r.db.WithContext(ctx).Preload("User").Where("user_id = ?", user.ID).First(&person).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDeliveryPersonNotFound
		}
		return nil, err
	}
	return &person, nil
}
