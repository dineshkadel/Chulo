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

var (
	ErrAdminRestaurantNotFound = errors.New("restaurant not found")
	ErrRestaurantEmailInUse    = errors.New("restaurant with this email already exists")
)

type AdminRestaurantRepository interface {
	ListRestaurants(ctx context.Context, search, status string, page, limit int) ([]dto.AdminRestaurantItem, int64, error)
	GetRestaurantByID(ctx context.Context, id uint) (*models.Restaurant, *dto.AdminRestaurantStats, error)
	Create(ctx context.Context, restaurant *models.Restaurant) error
	Update(ctx context.Context, restaurant *models.Restaurant) error
	Delete(ctx context.Context, id uint) error
	UpdateStatus(ctx context.Context, id uint, isActive bool) error
	GetRestaurantMenuItems(ctx context.Context, restaurantID uint) ([]dto.AdminRestaurantMenuItem, error)
	GetRestaurantOrders(ctx context.Context, restaurantID uint, limit int) ([]dto.AdminRestaurantOrderItem, error)
}

type adminRestaurantRepository struct {
	db *gorm.DB
}

func NewAdminRestaurantRepository(db *gorm.DB) AdminRestaurantRepository {
	return &adminRestaurantRepository{db: db}
}

type restaurantRow struct {
	ID             uint      `gorm:"column:id"`
	Name           string    `gorm:"column:name"`
	Email          string    `gorm:"column:email"`
	Phone          string    `gorm:"column:phone"`
	Address        string    `gorm:"column:address"`
	Description    string    `gorm:"column:description"`
	CuisineTypes   string    `gorm:"column:cuisine_types"`
	PriceTier      int       `gorm:"column:price_tier"`
	Lat            float64   `gorm:"column:lat"`
	Lng            float64   `gorm:"column:lng"`
	OperatingHours string    `gorm:"column:operating_hours"`
	HeroImageURL   string    `gorm:"column:hero_image_url"`
	AvgRating      float64   `gorm:"column:avg_rating"`
	ReviewCount    int       `gorm:"column:review_count"`
	DietaryTags    string    `gorm:"column:dietary_tags"`
	IsActive       bool      `gorm:"column:is_active"`
	CreatedAt      time.Time `gorm:"column:created_at"`
	TotalOrders    int64     `gorm:"column:total_orders"`
	TotalRevenue   float64   `gorm:"column:total_revenue"`
	MenuItemsCount int64     `gorm:"column:menu_items_count"`
}

func (r *adminRestaurantRepository) ListRestaurants(
	ctx context.Context,
	search, status string,
	page, limit int,
) ([]dto.AdminRestaurantItem, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var conditions []string
	var args []any

	conditions = append(conditions, "r.deleted_at IS NULL")

	if strings.TrimSpace(search) != "" {
		s := "%" + strings.ToLower(strings.TrimSpace(search)) + "%"
		conditions = append(conditions, "(LOWER(r.name) LIKE ? OR LOWER(r.email) LIKE ? OR LOWER(r.address) LIKE ? OR r.cuisine_types::text ILIKE ? OR r.phone LIKE ?)")
		args = append(args, s, s, s, s, s)
	}

	if status == "active" {
		conditions = append(conditions, "r.is_active = true")
	} else if status == "inactive" {
		conditions = append(conditions, "r.is_active = false")
	}

	whereClause := strings.Join(conditions, " AND ")

	// 1. Get total count
	var total int64
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM restaurants r WHERE %s", whereClause)
	if err := r.db.WithContext(ctx).Raw(countQuery, args...).Scan(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("count restaurants: %w", err)
	}

	// 2. Select paginated restaurants with aggregated metrics
	dataQuery := fmt.Sprintf(`
		SELECT 
			r.id,
			r.name,
			r.email,
			COALESCE(r.phone, '') as phone,
			r.address,
			COALESCE(r.description, '') as description,
			r.cuisine_types::text as cuisine_types,
			r.price_tier,
			r.lat,
			r.lng,
			COALESCE(r.operating_hours::text, '{}') as operating_hours,
			COALESCE(r.hero_image_url, '') as hero_image_url,
			r.avg_rating,
			r.review_count,
			COALESCE(r.dietary_tags::text, '{}') as dietary_tags,
			r.is_active,
			r.created_at,
			COALESCE(ord.orders_count, 0) as total_orders,
			COALESCE(ord.total_revenue, 0) as total_revenue,
			COALESCE(menu.items_count, 0) as menu_items_count
		FROM restaurants r
		LEFT JOIN (
			SELECT restaurant_id, COUNT(*) as orders_count, SUM(total) as total_revenue
			FROM orders
			WHERE status NOT IN ('CANCELLED', 'REJECTED') AND deleted_at IS NULL
			GROUP BY restaurant_id
		) ord ON ord.restaurant_id = r.id
		LEFT JOIN (
			SELECT restaurant_id, COUNT(*) as items_count
			FROM menu_items
			WHERE deleted_at IS NULL
			GROUP BY restaurant_id
		) menu ON menu.restaurant_id = r.id
		WHERE %s
		ORDER BY r.created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	dataArgs := append(args, limit, offset)

	var rows []restaurantRow
	if err := r.db.WithContext(ctx).Raw(dataQuery, dataArgs...).Scan(&rows).Error; err != nil {
		return nil, 0, fmt.Errorf("list restaurants: %w", err)
	}

	items := make([]dto.AdminRestaurantItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, dto.AdminRestaurantItem{
			ID:             row.ID,
			Name:           row.Name,
			Email:          row.Email,
			Phone:          row.Phone,
			Address:        row.Address,
			Description:    row.Description,
			CuisineTypes:   cleanArrayDisplay(row.CuisineTypes),
			PriceTier:      row.PriceTier,
			Lat:            row.Lat,
			Lng:            row.Lng,
			OperatingHours: row.OperatingHours,
			HeroImageURL:   row.HeroImageURL,
			AvgRating:      row.AvgRating,
			ReviewCount:    row.ReviewCount,
			DietaryTags:    cleanArrayDisplay(row.DietaryTags),
			IsActive:       row.IsActive,
			TotalOrders:    row.TotalOrders,
			TotalRevenue:   row.TotalRevenue,
			MenuItemsCount: row.MenuItemsCount,
			CreatedAt:      row.CreatedAt,
		})
	}

	return items, total, nil
}

func (r *adminRestaurantRepository) GetRestaurantByID(ctx context.Context, id uint) (*models.Restaurant, *dto.AdminRestaurantStats, error) {
	var restaurant models.Restaurant
	if err := r.db.WithContext(ctx).First(&restaurant, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, ErrAdminRestaurantNotFound
		}
		return nil, nil, err
	}

	// Calculate stats
	var stats dto.AdminRestaurantStats
	stats.AvgRating = restaurant.AvgRating
	stats.ReviewCount = restaurant.ReviewCount

	type statsRow struct {
		TotalOrders     int64   `gorm:"column:total_orders"`
		TotalRevenue    float64 `gorm:"column:total_revenue"`
		CompletedOrders int64   `gorm:"column:completed_orders"`
		CancelledOrders int64   `gorm:"column:cancelled_orders"`
		PendingOrders   int64   `gorm:"column:pending_orders"`
	}

	var sr statsRow
	statQuery := `
		SELECT
			COUNT(*) as total_orders,
			COALESCE(SUM(CASE WHEN status NOT IN ('CANCELLED', 'REJECTED') THEN total ELSE 0 END), 0) as total_revenue,
			COALESCE(COUNT(CASE WHEN status = 'DELIVERED' THEN 1 END), 0) as completed_orders,
			COALESCE(COUNT(CASE WHEN status IN ('CANCELLED', 'REJECTED') THEN 1 END), 0) as cancelled_orders,
			COALESCE(COUNT(CASE WHEN status IN ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'ASSIGNED', 'PICKED_UP') THEN 1 END), 0) as pending_orders
		FROM orders
		WHERE restaurant_id = ? AND deleted_at IS NULL
	`
	_ = r.db.WithContext(ctx).Raw(statQuery, id).Scan(&sr).Error
	stats.TotalOrders = sr.TotalOrders
	stats.TotalRevenue = sr.TotalRevenue
	stats.CompletedOrders = sr.CompletedOrders
	stats.CancelledOrders = sr.CancelledOrders
	stats.PendingOrders = sr.PendingOrders

	// Menu items count
	var menuCount int64
	_ = r.db.WithContext(ctx).Model(&models.MenuItem{}).Where("restaurant_id = ? AND deleted_at IS NULL", id).Count(&menuCount).Error
	stats.MenuItemsCount = menuCount

	return &restaurant, &stats, nil
}

func (r *adminRestaurantRepository) Create(ctx context.Context, restaurant *models.Restaurant) error {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Restaurant{}).Where("LOWER(email) = LOWER(?) AND deleted_at IS NULL", restaurant.Email).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return ErrRestaurantEmailInUse
	}
	return r.db.WithContext(ctx).Create(restaurant).Error
}

func (r *adminRestaurantRepository) Update(ctx context.Context, restaurant *models.Restaurant) error {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Restaurant{}).
		Where("LOWER(email) = LOWER(?) AND id <> ? AND deleted_at IS NULL", restaurant.Email, restaurant.ID).
		Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return ErrRestaurantEmailInUse
	}
	return r.db.WithContext(ctx).Save(restaurant).Error
}

func (r *adminRestaurantRepository) Delete(ctx context.Context, id uint) error {
	result := r.db.WithContext(ctx).Delete(&models.Restaurant{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrAdminRestaurantNotFound
	}
	return nil
}

func (r *adminRestaurantRepository) UpdateStatus(ctx context.Context, id uint, isActive bool) error {
	result := r.db.WithContext(ctx).Model(&models.Restaurant{}).Where("id = ? AND deleted_at IS NULL", id).Update("is_active", isActive)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrAdminRestaurantNotFound
	}
	return nil
}

func (r *adminRestaurantRepository) GetRestaurantMenuItems(ctx context.Context, restaurantID uint) ([]dto.AdminRestaurantMenuItem, error) {
	type menuItemRow struct {
		ID           uint      `gorm:"column:id"`
		RestaurantID uint      `gorm:"column:restaurant_id"`
		CategoryID   uint      `gorm:"column:category_id"`
		CategoryName string    `gorm:"column:category_name"`
		Name         string    `gorm:"column:name"`
		Description  string    `gorm:"column:description"`
		Price        float64   `gorm:"column:price"`
		ImageURL     string    `gorm:"column:image_url"`
		DietaryTags  string    `gorm:"column:dietary_tags"`
		IsAvailable  bool      `gorm:"column:is_available"`
		CreatedAt    time.Time `gorm:"column:created_at"`
	}

	q := `
		SELECT 
			m.id,
			m.restaurant_id,
			m.food_category_id as category_id,
			COALESCE(fc.name, 'Uncategorized') as category_name,
			m.name,
			COALESCE(m.description, '') as description,
			m.price,
			COALESCE(m.image_url, '') as image_url,
			COALESCE(m.dietary_tags::text, '{}') as dietary_tags,
			m.is_available,
			m.created_at
		FROM menu_items m
		LEFT JOIN food_categories fc ON fc.id = m.food_category_id
		WHERE m.restaurant_id = ? AND m.deleted_at IS NULL
		ORDER BY m.name ASC
	`
	var rows []menuItemRow
	if err := r.db.WithContext(ctx).Raw(q, restaurantID).Scan(&rows).Error; err != nil {
		return nil, err
	}

	items := make([]dto.AdminRestaurantMenuItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, dto.AdminRestaurantMenuItem{
			ID:           row.ID,
			RestaurantID: row.RestaurantID,
			CategoryID:   row.CategoryID,
			CategoryName: row.CategoryName,
			Name:         row.Name,
			Description:  row.Description,
			Price:        row.Price,
			ImageURL:     row.ImageURL,
			DietaryTags:  cleanArrayDisplay(row.DietaryTags),
			IsAvailable:  row.IsAvailable,
			CreatedAt:    row.CreatedAt,
		})
	}
	return items, nil
}

func (r *adminRestaurantRepository) GetRestaurantOrders(ctx context.Context, restaurantID uint, limit int) ([]dto.AdminRestaurantOrderItem, error) {
	if limit <= 0 || limit > 100 {
		limit = 30
	}

	var orders []models.Order
	err := r.db.WithContext(ctx).
		Where("restaurant_id = ? AND deleted_at IS NULL", restaurantID).
		Preload("User").
		Preload("Items").
		Order("created_at DESC").
		Limit(limit).
		Find(&orders).Error
	if err != nil {
		return nil, err
	}

	items := make([]dto.AdminRestaurantOrderItem, 0, len(orders))
	for _, o := range orders {
		var itemNames []string
		for _, item := range o.Items {
			itemNames = append(itemNames, fmt.Sprintf("%dx %s", item.Quantity, item.Name))
		}
		summary := strings.Join(itemNames, ", ")
		if len(summary) > 80 {
			summary = summary[:77] + "..."
		}

		custName := "Guest / User #" + fmt.Sprint(o.UserID)
		custEmail := ""
		custPhone := ""
		if o.User.ID != 0 {
			custName = o.User.DisplayName
			custEmail = o.User.Email
			custPhone = o.User.Phone
		}

		items = append(items, dto.AdminRestaurantOrderItem{
			ID:              o.ID,
			Status:          string(o.Status),
			Total:           o.Total,
			Subtotal:        o.Subtotal,
			DeliveryFee:     o.DeliveryFee,
			ItemsCount:      len(o.Items),
			CustomerName:    custName,
			CustomerEmail:   custEmail,
			CustomerPhone:   custPhone,
			DeliveryAddress: o.DeliveryAddress,
			ItemsSummary:    summary,
			CreatedAt:       o.CreatedAt,
		})
	}

	return items, nil
}

func cleanArrayDisplay(raw string) string {
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

