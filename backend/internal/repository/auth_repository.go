package repository

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/dineshkadel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrUserNotFound                = errors.New("user not found")
	ErrUserAlreadyExists           = errors.New("user with this email already exists")
	ErrDeliveryPersonNotFound      = errors.New("delivery person not found")
	ErrDeliveryPersonAlreadyExists = errors.New("delivery person with this email or phone already exists")
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
