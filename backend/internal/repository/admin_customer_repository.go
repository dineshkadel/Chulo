package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/models"
	"gorm.io/gorm"
)

type AdminCustomerRepository interface {
	ListCustomers(ctx context.Context, search, status, role string, page, limit int) ([]dto.AdminCustomerItem, int64, error)
	GetCustomerByID(ctx context.Context, id uint) (*models.User, int64, float64, error)
	UpdateStatus(ctx context.Context, id uint, isActive bool) error
	UpdateRole(ctx context.Context, id uint, roles []models.UserRole) error
	DeleteCustomer(ctx context.Context, id uint) error
}

type adminCustomerRepository struct {
	db *gorm.DB
}

func NewAdminCustomerRepository(db *gorm.DB) AdminCustomerRepository {
	return &adminCustomerRepository{db: db}
}

type customerRow struct {
	ID          uint      `gorm:"column:id"`
	Email       string    `gorm:"column:email"`
	DisplayName string    `gorm:"column:display_name"`
	Phone       string    `gorm:"column:phone"`
	Roles       string    `gorm:"column:roles"`
	AvatarURL   string    `gorm:"column:avatar_url"`
	IsActive    bool      `gorm:"column:is_active"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	OrdersCount int64     `gorm:"column:orders_count"`
	TotalSpent  float64   `gorm:"column:total_spent"`
}

func (r *adminCustomerRepository) ListCustomers(
	ctx context.Context,
	search, status, role string,
	page, limit int,
) ([]dto.AdminCustomerItem, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var conditions []string
	var args []any

	conditions = append(conditions, "u.deleted_at IS NULL")

	if strings.TrimSpace(search) != "" {
		s := "%" + strings.ToLower(strings.TrimSpace(search)) + "%"
		conditions = append(conditions, "(LOWER(u.display_name) LIKE ? OR LOWER(u.email) LIKE ? OR u.phone LIKE ?)")
		args = append(args, s, s, s)
	}

	if status == "active" {
		conditions = append(conditions, "u.is_active = true")
	} else if status == "inactive" {
		conditions = append(conditions, "u.is_active = false")
	}

	if role != "" && role != "all" {
		rolePattern := fmt.Sprintf("%%\"%s\"%%", strings.TrimSpace(role))
		conditions = append(conditions, "u.roles::text ILIKE ?")
		args = append(args, rolePattern)
	}

	whereClause := strings.Join(conditions, " AND ")

	// 1. Get total count
	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM users u WHERE %s", whereClause)
	if err := r.db.WithContext(ctx).Raw(countQuery, args...).Scan(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count users: %w", err)
	}

	// 2. Select paginated customers with order aggregations
	dataQuery := fmt.Sprintf(`
		SELECT 
			u.id,
			u.email,
			u.display_name,
			COALESCE(u.phone, '') as phone,
			u.roles::text as roles,
			COALESCE(u.avatar_url, '') as avatar_url,
			u.is_active,
			u.created_at,
			COALESCE(ord.orders_count, 0) as orders_count,
			COALESCE(ord.total_spent, 0) as total_spent
		FROM users u
		LEFT JOIN (
			SELECT user_id, COUNT(*) as orders_count, SUM(total) as total_spent
			FROM orders
			WHERE status NOT IN ('CANCELLED', 'REJECTED')
			GROUP BY user_id
		) ord ON ord.user_id = u.id
		WHERE %s
		ORDER BY u.created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	dataArgs := append(args, limit, offset)

	var rows []customerRow
	if err := r.db.WithContext(ctx).Raw(dataQuery, dataArgs...).Scan(&rows).Error; err != nil {
		return nil, 0, fmt.Errorf("list users: %w", err)
	}

	items := make([]dto.AdminCustomerItem, 0, len(rows))
	for _, row := range rows {
		var roleList []string
		cleanRoles := strings.Trim(row.Roles, "[]\" ")
		if cleanRoles != "" {
			parts := strings.Split(cleanRoles, ",")
			for _, p := range parts {
				cleaned := strings.Trim(strings.TrimSpace(p), "\"")
				if cleaned != "" {
					roleList = append(roleList, cleaned)
				}
			}
		}

		item := dto.AdminCustomerItem{
			ID:          row.ID,
			Email:       row.Email,
			DisplayName: row.DisplayName,
			Phone:       row.Phone,
			Roles:       roleList,
			AvatarURL:   row.AvatarURL,
			IsActive:    row.IsActive,
			OrdersCount: row.OrdersCount,
			TotalSpent:  row.TotalSpent,
			CreatedAt:   row.CreatedAt,
		}
		items = append(items, item)
	}

	return items, total, nil
}

func (r *adminCustomerRepository) GetCustomerByID(ctx context.Context, id uint) (*models.User, int64, float64, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Preload("Addresses").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, 0, ErrUserNotFound
		}
		return nil, 0, 0, err
	}

	var stats struct {
		OrdersCount int64   `gorm:"column:orders_count"`
		TotalSpent  float64 `gorm:"column:total_spent"`
	}

	statsQuery := `
		SELECT COUNT(*) as orders_count, COALESCE(SUM(total), 0) as total_spent
		FROM orders
		WHERE user_id = ? AND status NOT IN ('CANCELLED', 'REJECTED')
	`
	_ = r.db.WithContext(ctx).Raw(statsQuery, id).Scan(&stats)

	return &user, stats.OrdersCount, stats.TotalSpent, nil
}

func (r *adminCustomerRepository) UpdateStatus(ctx context.Context, id uint, isActive bool) error {
	res := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", id).Update("is_active", isActive)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *adminCustomerRepository) UpdateRole(ctx context.Context, id uint, roles []models.UserRole) error {
	res := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", id).Update("roles", roles)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}

func (r *adminCustomerRepository) DeleteCustomer(ctx context.Context, id uint) error {
	res := r.db.WithContext(ctx).Delete(&models.User{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}
