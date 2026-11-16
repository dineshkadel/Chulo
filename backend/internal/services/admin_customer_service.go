package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/models"
	"github.com/dineshkadel/backend/internal/repository"
)

var (
	ErrCustomerNotFound = errors.New("customer not found")
	ErrInvalidStatus    = errors.New("invalid status value")
	ErrCannotBanSelf    = errors.New("administrator cannot deactivate their own account")
)

type AdminCustomerService interface {
	ListCustomers(ctx context.Context, search, status, role string, page, limit int) (*dto.AdminCustomerListResponse, error)
	GetCustomer(ctx context.Context, id uint) (*dto.AdminCustomerDetailResponse, error)
	UpdateStatus(ctx context.Context, adminUserID, targetUserID uint, isActive bool) error
	UpdateRole(ctx context.Context, id uint, role string) error
	DeleteCustomer(ctx context.Context, adminUserID, targetUserID uint) error
}

type adminCustomerService struct {
	repo repository.AdminCustomerRepository
}

func NewAdminCustomerService(repo repository.AdminCustomerRepository) AdminCustomerService {
	return &adminCustomerService{repo: repo}
}

func (s *adminCustomerService) ListCustomers(
	ctx context.Context,
	search, status, role string,
	page, limit int,
) (*dto.AdminCustomerListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	items, total, err := s.repo.ListCustomers(ctx, search, status, role, page, limit)
	if err != nil {
		return nil, fmt.Errorf("list customers: %w", err)
	}

	return &dto.AdminCustomerListResponse{
		Customers: items,
		Total:     total,
		Page:      page,
		Limit:     limit,
	}, nil
}

func (s *adminCustomerService) GetCustomer(ctx context.Context, id uint) (*dto.AdminCustomerDetailResponse, error) {
	user, ordersCount, totalSpent, err := s.repo.GetCustomerByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrCustomerNotFound
		}
		return nil, fmt.Errorf("get customer: %w", err)
	}

	roleList := make([]string, 0, len(user.Roles))
	for _, r := range user.Roles {
		roleList = append(roleList, string(r))
	}

	addresses := make([]dto.AddressResponse, 0, len(user.Addresses))
	for _, a := range user.Addresses {
		addresses = append(addresses, dto.AddressResponse{
			ID:        a.ID,
			Label:     a.Label,
			Street:    a.Street,
			City:      a.City,
			Lat:       a.Lat,
			Lng:       a.Lng,
			IsDefault: a.IsDefault,
		})
	}

	resp := &dto.AdminCustomerDetailResponse{
		AdminCustomerItem: dto.AdminCustomerItem{
			ID:          user.ID,
			Email:       user.Email,
			DisplayName: user.DisplayName,
			Phone:       user.Phone,
			Roles:       roleList,
			AvatarURL:   user.AvatarURL,
			IsActive:    user.IsActive,
			OrdersCount: ordersCount,
			TotalSpent:  totalSpent,
			CreatedAt:   user.CreatedAt,
		},
		Addresses: addresses,
	}

	return resp, nil
}

func (s *adminCustomerService) UpdateStatus(ctx context.Context, adminUserID, targetUserID uint, isActive bool) error {
	if adminUserID == targetUserID && !isActive {
		return ErrCannotBanSelf
	}

	if err := s.repo.UpdateStatus(ctx, targetUserID, isActive); err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return ErrCustomerNotFound
		}
		return fmt.Errorf("update customer status: %w", err)
	}
	return nil
}

func (s *adminCustomerService) UpdateRole(ctx context.Context, id uint, role string) error {
	var targetRole models.UserRole
	switch role {
	case string(models.RoleAdmin):
		targetRole = models.RoleAdmin
	case string(models.RoleCustomer):
		targetRole = models.RoleCustomer
	case string(models.RoleDeliveryPerson):
		targetRole = models.RoleDeliveryPerson
	default:
		return fmt.Errorf("invalid role: %s", role)
	}

	if err := s.repo.UpdateRole(ctx, id, []models.UserRole{targetRole}); err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return ErrCustomerNotFound
		}
		return fmt.Errorf("update customer role: %w", err)
	}
	return nil
}

func (s *adminCustomerService) DeleteCustomer(ctx context.Context, adminUserID, targetUserID uint) error {
	if adminUserID == targetUserID {
		return ErrCannotBanSelf
	}

	if err := s.repo.DeleteCustomer(ctx, targetUserID); err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return ErrCustomerNotFound
		}
		return fmt.Errorf("delete customer: %w", err)
	}
	return nil
}

