package repository

import (
	"context"
	"errors"
	"time"

	"github.com/dineshkadel/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrOrderNotFound            = errors.New("order not found")
	ErrRestaurantClosed         = errors.New("restaurant is currently closed")
	ErrItemUnavailable          = errors.New("one or more items are unavailable or not found")
	ErrInvalidStateTransition   = errors.New("invalid order status transition")
	ErrConcurrentOrderUpdate    = errors.New("order status has been changed by another process, please refresh")
	ErrDeliveryPersonNotAvail   = errors.New("delivery person is not available or inactive")
)

type OrderRepository interface {
	CreateOrder(ctx context.Context, order *models.Order, items []models.OrderItem) (*models.Order, error)
	GetOrderByID(ctx context.Context, id uint) (*models.Order, error)
	GetOrdersByCustomer(ctx context.Context, customerID uint, status string, limit, offset int) ([]models.Order, int64, error)
	GetOrdersByRestaurant(ctx context.Context, restaurantID uint, status string, limit, offset int) ([]models.Order, int64, error)
	GetOrdersByDeliveryPerson(ctx context.Context, deliveryPersonID uint, status string, limit, offset int) ([]models.Order, int64, error)
	GetAllOrders(ctx context.Context, status string, limit, offset int) ([]models.Order, int64, error)

	UpdateOrderStatus(ctx context.Context, orderID uint, fromStatus models.OrderStatus, toStatus models.OrderStatus, changedBy uint, role, notes string) (*models.Order, error)
	AssignDeliveryPerson(ctx context.Context, orderID uint, deliveryPersonID uint, fromStatus, toStatus models.OrderStatus, changedBy uint, role, notes string) (*models.Order, error)

	FindAvailableDeliveryPersons(ctx context.Context) ([]models.DeliveryPerson, error)
	GetRestaurant(ctx context.Context, id uint) (*models.Restaurant, error)
	GetMenuItemsByIDs(ctx context.Context, restaurantID uint, itemIDs []uint) ([]models.MenuItem, error)
	GetDeliveryPersonByID(ctx context.Context, id uint) (*models.DeliveryPerson, error)
}

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func (r *orderRepository) CreateOrder(ctx context.Context, order *models.Order, items []models.OrderItem) (*models.Order, error) {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		order.Status = models.OrderStatusPlaced
		if err := tx.Create(order).Error; err != nil {
			return err
		}

		for i := range items {
			items[i].OrderID = order.ID
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}

		// Initial status history log
		history := models.OrderStatusHistory{
			OrderID:   order.ID,
			Status:    models.OrderStatusPlaced,
			ChangedBy: order.UserID,
			Role:      "customer",
			Notes:     "Order placed by customer",
			CreatedAt: time.Now().UTC(),
		}
		if err := tx.Create(&history).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return r.GetOrderByID(ctx, order.ID)
}

func (r *orderRepository) GetOrderByID(ctx context.Context, id uint) (*models.Order, error) {
	var order models.Order
	err := r.db.WithContext(ctx).
		Preload("Items").
		Preload("Restaurant").
		Preload("User").
		Preload("DeliveryPerson.User").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_status_histories.created_at asc")
		}).
		First(&order, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrOrderNotFound
		}
		return nil, err
	}
	return &order, nil
}

func (r *orderRepository) GetOrdersByCustomer(ctx context.Context, customerID uint, status string, limit, offset int) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Order{}).Where("user_id = ?", customerID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 20
	}

	err := query.
		Preload("Items").
		Preload("Restaurant").
		Preload("DeliveryPerson.User").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_status_histories.created_at asc")
		}).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error

	return orders, total, err
}

func (r *orderRepository) GetOrdersByRestaurant(ctx context.Context, restaurantID uint, status string, limit, offset int) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Order{}).Where("restaurant_id = ?", restaurantID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 50
	}

	err := query.
		Preload("Items").
		Preload("User").
		Preload("DeliveryPerson.User").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_status_histories.created_at asc")
		}).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error

	return orders, total, err
}

func (r *orderRepository) GetOrdersByDeliveryPerson(ctx context.Context, deliveryPersonID uint, status string, limit, offset int) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Order{}).Where("delivery_person_id = ?", deliveryPersonID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 20
	}

	err := query.
		Preload("Items").
		Preload("Restaurant").
		Preload("User").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_status_histories.created_at asc")
		}).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error

	return orders, total, err
}

func (r *orderRepository) GetAllOrders(ctx context.Context, status string, limit, offset int) ([]models.Order, int64, error) {
	var orders []models.Order
	var total int64

	query := r.db.WithContext(ctx).Model(&models.Order{})
	if status != "" {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 50
	}

	err := query.
		Preload("Items").
		Preload("Restaurant").
		Preload("User").
		Preload("DeliveryPerson.User").
		Preload("StatusHistory", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_status_histories.created_at asc")
		}).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&orders).Error

	return orders, total, err
}

func (r *orderRepository) UpdateOrderStatus(ctx context.Context, orderID uint, fromStatus models.OrderStatus, toStatus models.OrderStatus, changedBy uint, role, notes string) (*models.Order, error) {
	now := time.Now().UTC()

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var res *gorm.DB
		if fromStatus != "" {
			// Optimistic locking: ensures status hasn't concurrently changed
			res = tx.Model(&models.Order{}).
				Where("id = ? AND status = ?", orderID, fromStatus).
				Updates(map[string]any{
					"status":     toStatus,
					"updated_at": now,
				})
		} else {
			// Admin override without fromStatus check
			res = tx.Model(&models.Order{}).
				Where("id = ?", orderID).
				Updates(map[string]any{
					"status":     toStatus,
					"updated_at": now,
				})
		}

		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			var count int64
			if err := tx.Model(&models.Order{}).Where("id = ?", orderID).Count(&count).Error; err != nil {
				return err
			}
			if count == 0 {
				return ErrOrderNotFound
			}
			return ErrConcurrentOrderUpdate
		}

		// Insert history entry
		history := models.OrderStatusHistory{
			OrderID:   orderID,
			Status:    toStatus,
			ChangedBy: changedBy,
			Role:      role,
			Notes:     notes,
			CreatedAt: now,
		}
		if err := tx.Create(&history).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return r.GetOrderByID(ctx, orderID)
}

func (r *orderRepository) AssignDeliveryPerson(ctx context.Context, orderID uint, deliveryPersonID uint, fromStatus, toStatus models.OrderStatus, changedBy uint, role, notes string) (*models.Order, error) {
	now := time.Now().UTC()

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update order with delivery person and new status
		var res *gorm.DB
		if fromStatus != "" {
			res = tx.Model(&models.Order{}).
				Where("id = ? AND status = ?", orderID, fromStatus).
				Updates(map[string]any{
					"delivery_person_id": deliveryPersonID,
					"status":             toStatus,
					"updated_at":         now,
				})
		} else {
			res = tx.Model(&models.Order{}).
				Where("id = ?", orderID).
				Updates(map[string]any{
					"delivery_person_id": deliveryPersonID,
					"status":             toStatus,
					"updated_at":         now,
				})
		}

		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrConcurrentOrderUpdate
		}

		// Update delivery person to ON_DELIVERY
		if err := tx.Model(&models.DeliveryPerson{}).
			Where("id = ?", deliveryPersonID).
			Update("status", models.DeliveryStatusOnDelivery).Error; err != nil {
			return err
		}

		// History entry
		history := models.OrderStatusHistory{
			OrderID:   orderID,
			Status:    toStatus,
			ChangedBy: changedBy,
			Role:      role,
			Notes:     notes,
			CreatedAt: now,
		}
		if err := tx.Create(&history).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return r.GetOrderByID(ctx, orderID)
}

func (r *orderRepository) FindAvailableDeliveryPersons(ctx context.Context) ([]models.DeliveryPerson, error) {
	var persons []models.DeliveryPerson
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("is_active = ? AND status = ?", true, models.DeliveryStatusAvailable).
		Find(&persons).Error

	return persons, err
}

func (r *orderRepository) GetRestaurant(ctx context.Context, id uint) (*models.Restaurant, error) {
	var rest models.Restaurant
	err := r.db.WithContext(ctx).First(&rest, id).Error
	if err != nil {
		return nil, err
	}
	return &rest, nil
}

func (r *orderRepository) GetMenuItemsByIDs(ctx context.Context, restaurantID uint, itemIDs []uint) ([]models.MenuItem, error) {
	var items []models.MenuItem
	err := r.db.WithContext(ctx).
		Where("restaurant_id = ? AND id IN ?", restaurantID, itemIDs).
		Find(&items).Error
	return items, err
}

func (r *orderRepository) GetDeliveryPersonByID(ctx context.Context, id uint) (*models.DeliveryPerson, error) {
	var dp models.DeliveryPerson
	err := r.db.WithContext(ctx).Preload("User").First(&dp, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDeliveryPersonNotAvail
		}
		return nil, err
	}
	return &dp, nil
}

