package services

import (
	"context"
	"errors"
	"strings"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/models"
	"github.com/dineshkadel/backend/internal/repository"
)

type MenuService interface {
	ListCategories(context.Context) ([]models.FoodCategory, error)
	CreateCategory(context.Context, dto.FoodCategoryRequest) (*models.FoodCategory, error)
	UpdateCategory(context.Context, uint, dto.FoodCategoryRequest) (*models.FoodCategory, error)
	DeleteCategory(context.Context, uint) error
	ListMenuItems(context.Context, uint) ([]models.MenuItem, error)
	GetMenuItem(context.Context, uint, uint) (*models.MenuItem, error)
	CreateMenuItem(context.Context, uint, dto.MenuItemRequest, string) (*models.MenuItem, error)
	UpdateMenuItem(context.Context, uint, uint, dto.MenuItemRequest, string) (*models.MenuItem, error)
	DeleteMenuItem(context.Context, uint, uint) error
}

type menuService struct{ repo repository.MenuRepository }

func NewMenuService(repo repository.MenuRepository) MenuService { return &menuService{repo: repo} }

func (s *menuService) ListCategories(ctx context.Context) ([]models.FoodCategory, error) {
	return s.repo.ListCategories(ctx)
}

func (s *menuService) CreateCategory(ctx context.Context, req dto.FoodCategoryRequest) (*models.FoodCategory, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, errors.Join(ErrInvalidInput, err)
	}
	image := ""
	if req.Image != nil {
		image = strings.TrimSpace(*req.Image)
	}
	return s.repo.CreateCategory(ctx, strings.TrimSpace(req.Name), image)
}

func (s *menuService) UpdateCategory(ctx context.Context, id uint, req dto.FoodCategoryRequest) (*models.FoodCategory, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, errors.Join(ErrInvalidInput, err)
	}
	var image *string
	if req.Image != nil {
		cleaned := strings.TrimSpace(*req.Image)
		image = &cleaned
	}
	return s.repo.UpdateCategory(ctx, id, strings.TrimSpace(req.Name), image)
}

func (s *menuService) DeleteCategory(ctx context.Context, id uint) error {
	return s.repo.DeleteCategory(ctx, id)
}

func (s *menuService) ListMenuItems(ctx context.Context, restaurantID uint) ([]models.MenuItem, error) {
	return s.repo.ListMenuItems(ctx, restaurantID)
}

func (s *menuService) GetMenuItem(ctx context.Context, restaurantID, id uint) (*models.MenuItem, error) {
	return s.repo.GetMenuItem(ctx, restaurantID, id)
}

func (s *menuService) CreateMenuItem(ctx context.Context, restaurantID uint, req dto.MenuItemRequest, imageURL string) (*models.MenuItem, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, errors.Join(ErrInvalidInput, err)
	}
	available := true
	if req.IsAvailable != nil {
		available = *req.IsAvailable
	}
	item := &models.MenuItem{RestaurantID: restaurantID, FoodCategoryID: req.FoodCategoryID, Name: strings.TrimSpace(req.Name), Description: strings.TrimSpace(req.Description), Price: req.Price, ImageURL: imageURL, DietaryTags: strings.TrimSpace(req.DietaryTags), IsAvailable: available}
	if err := s.repo.CreateMenuItem(ctx, item); err != nil {
		return nil, err
	}
	return s.repo.GetMenuItem(ctx, restaurantID, item.ID)
}

func (s *menuService) UpdateMenuItem(ctx context.Context, restaurantID, id uint, req dto.MenuItemRequest, imageURL string) (*models.MenuItem, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, errors.Join(ErrInvalidInput, err)
	}
	current, err := s.repo.GetMenuItem(ctx, restaurantID, id)
	if err != nil {
		return nil, err
	}
	if imageURL == "" {
		imageURL = current.ImageURL
	}
	available := current.IsAvailable
	if req.IsAvailable != nil {
		available = *req.IsAvailable
	}
	item := &models.MenuItem{FoodCategoryID: req.FoodCategoryID, Name: strings.TrimSpace(req.Name), Description: strings.TrimSpace(req.Description), Price: req.Price, ImageURL: imageURL, DietaryTags: strings.TrimSpace(req.DietaryTags), IsAvailable: available}
	return s.repo.UpdateMenuItem(ctx, restaurantID, id, item)
}

func (s *menuService) DeleteMenuItem(ctx context.Context, restaurantID, id uint) error {
	return s.repo.DeleteMenuItem(ctx, restaurantID, id)
}
