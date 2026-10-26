package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/dineshkadel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrFoodCategoryNotFound = errors.New("food category not found")
	ErrFoodCategoryExists   = errors.New("food category name already exists")
	ErrFoodCategoryInUse    = errors.New("food category is used by menu items")
	ErrMenuItemNotFound     = errors.New("menu item not found")
)

type MenuRepository interface {
	ListCategories(context.Context) ([]models.FoodCategory, error)
	CreateCategory(context.Context, string, string) (*models.FoodCategory, error)
	UpdateCategory(context.Context, uint, string, *string) (*models.FoodCategory, error)
	DeleteCategory(context.Context, uint) error
	ListMenuItems(context.Context, uint) ([]models.MenuItem, error)
	GetMenuItem(context.Context, uint, uint) (*models.MenuItem, error)
	CreateMenuItem(context.Context, *models.MenuItem) error
	UpdateMenuItem(context.Context, uint, uint, *models.MenuItem) (*models.MenuItem, error)
	DeleteMenuItem(context.Context, uint, uint) error
}

type menuRepository struct{ db *gorm.DB }

func NewMenuRepository(db *gorm.DB) MenuRepository { return &menuRepository{db: db} }

func (r *menuRepository) ListCategories(ctx context.Context) ([]models.FoodCategory, error) {
	var categories []models.FoodCategory
	err := r.db.WithContext(ctx).Order("name ASC").Find(&categories).Error
	return categories, err
}

func (r *menuRepository) CreateCategory(ctx context.Context, name, image string) (*models.FoodCategory, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.FoodCategory{}).Where("LOWER(name) = LOWER(?)", name).Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrFoodCategoryExists
	}
	category := &models.FoodCategory{Name: name, Image: image}
	if err := r.db.WithContext(ctx).Create(category).Error; err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "unique") {
			return nil, ErrFoodCategoryExists
		}
		return nil, err
	}
	return category, nil
}

func (r *menuRepository) UpdateCategory(ctx context.Context, id uint, name string, image *string) (*models.FoodCategory, error) {
	var category models.FoodCategory
	if err := r.db.WithContext(ctx).First(&category, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFoodCategoryNotFound
		}
		return nil, err
	}
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.FoodCategory{}).Where("LOWER(name) = LOWER(?) AND id <> ?", name, id).Count(&count).Error; err != nil {
		return nil, err
	}
	if count > 0 {
		return nil, ErrFoodCategoryExists
	}
	updates := map[string]any{"name": name}
	if image != nil {
		updates["image"] = *image
	}
	if err := r.db.WithContext(ctx).Model(&category).Updates(updates).Error; err != nil {
		return nil, err
	}
	category.Name = name
	if image != nil {
		category.Image = *image
	}
	return &category, nil
}

func (r *menuRepository) DeleteCategory(ctx context.Context, id uint) error {
	var items int64
	if err := r.db.WithContext(ctx).Model(&models.MenuItem{}).Where("food_category_id = ?", id).Count(&items).Error; err != nil {
		return err
	}
	if items > 0 {
		return ErrFoodCategoryInUse
	}
	result := r.db.WithContext(ctx).Delete(&models.FoodCategory{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrFoodCategoryNotFound
	}
	return nil
}

func (r *menuRepository) ListMenuItems(ctx context.Context, restaurantID uint) ([]models.MenuItem, error) {
	var items []models.MenuItem
	err := r.db.WithContext(ctx).Preload("FoodCategory").Where("restaurant_id = ?", restaurantID).Order("name ASC").Find(&items).Error
	return items, err
}

func (r *menuRepository) GetMenuItem(ctx context.Context, restaurantID, id uint) (*models.MenuItem, error) {
	var item models.MenuItem
	if err := r.db.WithContext(ctx).Preload("FoodCategory").Where("restaurant_id = ? AND id = ?", restaurantID, id).First(&item).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMenuItemNotFound
		}
		return nil, err
	}
	return &item, nil
}

func (r *menuRepository) CreateMenuItem(ctx context.Context, item *models.MenuItem) error {
	var category models.FoodCategory
	if err := r.db.WithContext(ctx).First(&category, item.FoodCategoryID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrFoodCategoryNotFound
		}
		return err
	}
	return r.db.WithContext(ctx).Create(item).Error
}

func (r *menuRepository) UpdateMenuItem(ctx context.Context, restaurantID, id uint, item *models.MenuItem) (*models.MenuItem, error) {
	var current models.MenuItem
	if err := r.db.WithContext(ctx).Where("restaurant_id = ? AND id = ?", restaurantID, id).First(&current).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrMenuItemNotFound
		}
		return nil, err
	}
	var category models.FoodCategory
	if err := r.db.WithContext(ctx).First(&category, item.FoodCategoryID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrFoodCategoryNotFound
		}
		return nil, err
	}
	item.ID, item.RestaurantID = id, restaurantID
	if err := r.db.WithContext(ctx).Model(&current).Updates(map[string]any{"food_category_id": item.FoodCategoryID, "name": item.Name, "description": item.Description, "price": item.Price, "image_url": item.ImageURL, "dietary_tags": item.DietaryTags, "is_available": item.IsAvailable}).Error; err != nil {
		return nil, err
	}
	return r.GetMenuItem(ctx, restaurantID, id)
}

func (r *menuRepository) DeleteMenuItem(ctx context.Context, restaurantID, id uint) error {
	result := r.db.WithContext(ctx).Where("restaurant_id = ?", restaurantID).Delete(&models.MenuItem{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrMenuItemNotFound
	}
	return nil
}
