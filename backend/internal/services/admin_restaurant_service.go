package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/models"
	"github.com/dineshkadel/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrRestaurantNotFound    = errors.New("restaurant not found")
	ErrRestaurantEmailExists = errors.New("a restaurant with this email already exists")
)

type AdminRestaurantService interface {
	ListRestaurants(ctx context.Context, search, status string, page, limit int) (*dto.AdminRestaurantListResponse, error)
	GetRestaurantDetail(ctx context.Context, id uint) (*dto.AdminRestaurantDetailResponse, error)
	CreateRestaurant(ctx context.Context, req dto.CreateAdminRestaurantRequest) (*dto.AdminRestaurantItem, error)
	UpdateRestaurant(ctx context.Context, id uint, req dto.UpdateAdminRestaurantRequest) (*dto.AdminRestaurantItem, error)
	DeleteRestaurant(ctx context.Context, id uint) error
	UpdateStatus(ctx context.Context, id uint, isActive bool) error
	GetRestaurantMenuItems(ctx context.Context, restaurantID uint) ([]dto.AdminRestaurantMenuItem, error)
	GetRestaurantOrders(ctx context.Context, restaurantID uint, limit int) ([]dto.AdminRestaurantOrderItem, error)
	UpdateHeroImage(ctx context.Context, restaurantID uint, imageURL string) error
}

type adminRestaurantService struct {
	repo repository.AdminRestaurantRepository
}

func NewAdminRestaurantService(repo repository.AdminRestaurantRepository) AdminRestaurantService {
	return &adminRestaurantService{repo: repo}
}

func (s *adminRestaurantService) ListRestaurants(
	ctx context.Context,
	search, status string,
	page, limit int,
) (*dto.AdminRestaurantListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	items, total, err := s.repo.ListRestaurants(ctx, search, status, page, limit)
	if err != nil {
		return nil, fmt.Errorf("list restaurants: %w", err)
	}

	return &dto.AdminRestaurantListResponse{
		Restaurants: items,
		Total:       total,
		Page:        page,
		Limit:       limit,
	}, nil
}

func (s *adminRestaurantService) GetRestaurantDetail(ctx context.Context, id uint) (*dto.AdminRestaurantDetailResponse, error) {
	restaurant, stats, err := s.repo.GetRestaurantByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrAdminRestaurantNotFound) {
			return nil, ErrRestaurantNotFound
		}
		return nil, fmt.Errorf("get restaurant detail: %w", err)
	}

	menuItems, err := s.repo.GetRestaurantMenuItems(ctx, id)
	if err != nil {
		menuItems = []dto.AdminRestaurantMenuItem{}
	}

	recentOrders, err := s.repo.GetRestaurantOrders(ctx, id, 30)
	if err != nil {
		recentOrders = []dto.AdminRestaurantOrderItem{}
	}

	item := dto.AdminRestaurantItem{
		ID:             restaurant.ID,
		Name:           restaurant.Name,
		Email:          restaurant.Email,
		Phone:          restaurant.Phone,
		Address:        restaurant.Address,
		Description:    restaurant.Description,
		CuisineTypes:   cleanPostgresArray(restaurant.CuisineTypes),
		PriceTier:      restaurant.PriceTier,
		Lat:            restaurant.Lat,
		Lng:            restaurant.Lng,
		OperatingHours: restaurant.OperatingHours,
		HeroImageURL:   restaurant.HeroImageURL,
		AvgRating:      restaurant.AvgRating,
		ReviewCount:    restaurant.ReviewCount,
		DietaryTags:    cleanPostgresArray(restaurant.DietaryTags),
		IsActive:       restaurant.IsActive,
		TotalOrders:    stats.TotalOrders,
		TotalRevenue:   stats.TotalRevenue,
		MenuItemsCount: stats.MenuItemsCount,
		CreatedAt:      restaurant.CreatedAt,
	}

	return &dto.AdminRestaurantDetailResponse{
		Restaurant:   item,
		Stats:        *stats,
		MenuItems:    menuItems,
		RecentOrders: recentOrders,
	}, nil
}

func (s *adminRestaurantService) CreateRestaurant(ctx context.Context, req dto.CreateAdminRestaurantRequest) (*dto.AdminRestaurantItem, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	priceTier := req.PriceTier
	if priceTier < 1 || priceTier > 4 {
		priceTier = 2
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	operatingHours := req.OperatingHours
	if strings.TrimSpace(operatingHours) == "" {
		operatingHours = "{}"
	}

	restaurant := &models.Restaurant{
		Email:          email,
		PasswordHash:   string(hash),
		Name:           strings.TrimSpace(req.Name),
		Description:    strings.TrimSpace(req.Description),
		CuisineTypes:   formatPostgresArray(req.CuisineTypes),
		PriceTier:      priceTier,
		Lat:            req.Lat,
		Lng:            req.Lng,
		Address:        strings.TrimSpace(req.Address),
		Phone:          strings.TrimSpace(req.Phone),
		OperatingHours: operatingHours,
		HeroImageURL:   strings.TrimSpace(req.HeroImageURL),
		DietaryTags:    formatPostgresArray(req.DietaryTags),
		IsActive:       isActive,
	}

	if err := s.repo.Create(ctx, restaurant); err != nil {
		if errors.Is(err, repository.ErrRestaurantEmailInUse) {
			return nil, ErrRestaurantEmailExists
		}
		return nil, fmt.Errorf("create restaurant: %w", err)
	}

	return &dto.AdminRestaurantItem{
		ID:             restaurant.ID,
		Name:           restaurant.Name,
		Email:          restaurant.Email,
		Phone:          restaurant.Phone,
		Address:        restaurant.Address,
		Description:    restaurant.Description,
		CuisineTypes:   cleanPostgresArray(restaurant.CuisineTypes),
		PriceTier:      restaurant.PriceTier,
		Lat:            restaurant.Lat,
		Lng:            restaurant.Lng,
		OperatingHours: restaurant.OperatingHours,
		HeroImageURL:   restaurant.HeroImageURL,
		AvgRating:      restaurant.AvgRating,
		ReviewCount:    restaurant.ReviewCount,
		DietaryTags:    cleanPostgresArray(restaurant.DietaryTags),
		IsActive:       restaurant.IsActive,
		TotalOrders:    0,
		TotalRevenue:   0,
		MenuItemsCount: 0,
		CreatedAt:      restaurant.CreatedAt,
	}, nil
}

func (s *adminRestaurantService) UpdateRestaurant(ctx context.Context, id uint, req dto.UpdateAdminRestaurantRequest) (*dto.AdminRestaurantItem, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	restaurant, stats, err := s.repo.GetRestaurantByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrAdminRestaurantNotFound) {
			return nil, ErrRestaurantNotFound
		}
		return nil, err
	}

	restaurant.Name = strings.TrimSpace(req.Name)
	restaurant.Email = strings.ToLower(strings.TrimSpace(req.Email))
	restaurant.Phone = strings.TrimSpace(req.Phone)
	restaurant.Address = strings.TrimSpace(req.Address)
	restaurant.Description = strings.TrimSpace(req.Description)
	restaurant.CuisineTypes = formatPostgresArray(req.CuisineTypes)
	restaurant.PriceTier = req.PriceTier
	restaurant.Lat = req.Lat
	restaurant.Lng = req.Lng
	if req.HeroImageURL != "" {
		restaurant.HeroImageURL = strings.TrimSpace(req.HeroImageURL)
	}
	if req.OperatingHours != "" {
		restaurant.OperatingHours = req.OperatingHours
	}
	if req.DietaryTags != "" {
		restaurant.DietaryTags = formatPostgresArray(req.DietaryTags)
	}
	if req.IsActive != nil {
		restaurant.IsActive = *req.IsActive
	}
	if strings.TrimSpace(req.Password) != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), 10)
		if err != nil {
			return nil, fmt.Errorf("hash password: %w", err)
		}
		restaurant.PasswordHash = string(hash)
	}

	if err := s.repo.Update(ctx, restaurant); err != nil {
		if errors.Is(err, repository.ErrRestaurantEmailInUse) {
			return nil, ErrRestaurantEmailExists
		}
		return nil, fmt.Errorf("update restaurant: %w", err)
	}

	return &dto.AdminRestaurantItem{
		ID:             restaurant.ID,
		Name:           restaurant.Name,
		Email:          restaurant.Email,
		Phone:          restaurant.Phone,
		Address:        restaurant.Address,
		Description:    restaurant.Description,
		CuisineTypes:   cleanPostgresArray(restaurant.CuisineTypes),
		PriceTier:      restaurant.PriceTier,
		Lat:            restaurant.Lat,
		Lng:            restaurant.Lng,
		OperatingHours: restaurant.OperatingHours,
		HeroImageURL:   restaurant.HeroImageURL,
		AvgRating:      restaurant.AvgRating,
		ReviewCount:    restaurant.ReviewCount,
		DietaryTags:    cleanPostgresArray(restaurant.DietaryTags),
		IsActive:       restaurant.IsActive,
		TotalOrders:    stats.TotalOrders,
		TotalRevenue:   stats.TotalRevenue,
		MenuItemsCount: stats.MenuItemsCount,
		CreatedAt:      restaurant.CreatedAt,
	}, nil
}

func (s *adminRestaurantService) DeleteRestaurant(ctx context.Context, id uint) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		if errors.Is(err, repository.ErrAdminRestaurantNotFound) {
			return ErrRestaurantNotFound
		}
		return fmt.Errorf("delete restaurant: %w", err)
	}
	return nil
}

func (s *adminRestaurantService) UpdateStatus(ctx context.Context, id uint, isActive bool) error {
	if err := s.repo.UpdateStatus(ctx, id, isActive); err != nil {
		if errors.Is(err, repository.ErrAdminRestaurantNotFound) {
			return ErrRestaurantNotFound
		}
		return fmt.Errorf("update restaurant status: %w", err)
	}
	return nil
}

func (s *adminRestaurantService) GetRestaurantMenuItems(ctx context.Context, restaurantID uint) ([]dto.AdminRestaurantMenuItem, error) {
	return s.repo.GetRestaurantMenuItems(ctx, restaurantID)
}

func (s *adminRestaurantService) GetRestaurantOrders(ctx context.Context, restaurantID uint, limit int) ([]dto.AdminRestaurantOrderItem, error) {
	return s.repo.GetRestaurantOrders(ctx, restaurantID, limit)
}

func (s *adminRestaurantService) UpdateHeroImage(ctx context.Context, restaurantID uint, imageURL string) error {
	restaurant, _, err := s.repo.GetRestaurantByID(ctx, restaurantID)
	if err != nil {
		if errors.Is(err, repository.ErrAdminRestaurantNotFound) {
			return ErrRestaurantNotFound
		}
		return err
	}

	restaurant.HeroImageURL = imageURL
	return s.repo.Update(ctx, restaurant)
}

func cleanPostgresArray(raw string) string {
	raw = strings.TrimSpace(raw)
	if raw == "" || raw == "{}" {
		return ""
	}
	raw = strings.TrimPrefix(raw, "{")
	raw = strings.TrimSuffix(raw, "}")
	parts := strings.Split(raw, ",")
	var result []string
	for _, p := range parts {
		trimmed := strings.Trim(strings.TrimSpace(p), `"`)
		if trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return strings.Join(result, ", ")
}
