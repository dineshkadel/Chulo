package config

import (
	"fmt"
	"log"
	"net"
	"net/url"
	"os"

	"github.com/dineshkadel/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// ConnectDB establishes a connection to PostgreSQL via GORM.
func ConnectDB() (*gorm.DB, error) {
	dsn, err := databaseDSN()
	if err != nil {
		return nil, err
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("connect to PostgreSQL: %w", err)
	}

	return db, nil
}

func AutoMigrateDB(db *gorm.DB) error {
	if err := migrateLegacyUserRoles(db); err != nil {
		return fmt.Errorf("migrate user roles: %w", err)
	}
	if err := migrateLegacyDeliveryPersonUsers(db); err != nil {
		return fmt.Errorf("migrate delivery person accounts: %w", err)
	}
	err := db.AutoMigrate(
		&models.User{},
		&models.Address{},
		&models.Restaurant{},
		&models.FoodCategory{},
		&models.MenuItem{},
		&models.Order{},
		&models.DeliveryPerson{},
		&models.OrderItem{},
		&models.Review{},
		&models.UserInteraction{},
	)
	if err != nil {
		return fmt.Errorf("auto-migrate: %w", err)
	}
	log.Println("Database migration completed successfully")
	return nil
}

func migrateLegacyUserRoles(db *gorm.DB) error {
	if !db.Migrator().HasTable("users") {
		return nil
	}
	if !db.Migrator().HasColumn("users", "roles") {
		if err := db.Exec("ALTER TABLE users ADD COLUMN roles jsonb NOT NULL DEFAULT '[]'::jsonb").Error; err != nil {
			return err
		}
	}
	if db.Migrator().HasColumn("users", "role") {
		return db.Exec(`UPDATE users SET roles = CASE
			WHEN LOWER(role) = 'admin' THEN '["admin"]'::jsonb
			WHEN LOWER(role) = 'delivery_person' THEN '["customer", "delivery_person"]'::jsonb
			ELSE '["customer"]'::jsonb
		END WHERE roles = '[]'::jsonb`).Error
	}
	return db.Exec(`UPDATE users SET roles = '["customer"]'::jsonb WHERE roles = '[]'::jsonb`).Error
}

// accounts owned authentication credentials and roles.
func migrateLegacyDeliveryPersonUsers(db *gorm.DB) error {
	if !db.Migrator().HasTable("delivery_people") || !db.Migrator().HasColumn("delivery_people", "email") {
		return nil
	}
	if !db.Migrator().HasTable("users") {
		return fmt.Errorf("users table is required to migrate existing delivery people")
	}
	if !db.Migrator().HasColumn("delivery_people", "user_id") {
		if err := db.Exec("ALTER TABLE delivery_people ADD COLUMN user_id bigint").Error; err != nil {
			return err
		}
	}
	if err := db.Exec(`INSERT INTO users (email, password_hash, display_name, roles, avatar_url, phone, preferences, created_at, updated_at)
		SELECT d.email, d.password_hash, LEFT(d.full_name, 100), '["customer", "delivery_person"]'::jsonb, d.avatar_url, d.phone, '{}'::jsonb, d.created_at, d.updated_at
		FROM delivery_people d
		WHERE NOT EXISTS (SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(d.email))`).Error; err != nil {
		return err
	}
	if err := db.Exec(`UPDATE users u SET
		roles = CASE WHEN u.roles @> '["delivery_person"]'::jsonb THEN u.roles ELSE u.roles || '["delivery_person"]'::jsonb END,
		phone = CASE WHEN u.phone IS NULL OR u.phone = '' THEN d.phone ELSE u.phone END
		FROM delivery_people d WHERE d.user_id IS NULL AND LOWER(u.email) = LOWER(d.email)`).Error; err != nil {
		return err
	}
	if err := db.Exec(`UPDATE delivery_people d SET user_id = u.id FROM users u WHERE d.user_id IS NULL AND LOWER(u.email) = LOWER(d.email)`).Error; err != nil {
		return err
	}
	if err := db.Exec("ALTER TABLE delivery_people ALTER COLUMN user_id SET NOT NULL").Error; err != nil {
		return err
	}
	return nil
}

func databaseDSN() (string, error) {
	if dsn := os.Getenv("DATABASE_URL"); dsn != "" {
		return dsn, nil
	}

	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	name := os.Getenv("DB_NAME")
	if user == "" || password == "" || name == "" {
		return "", fmt.Errorf("database configuration is incomplete: set DATABASE_URL or DB_USER, DB_PASSWORD, and DB_NAME")
	}

	host := os.Getenv("DB_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("DB_PORT")
	if port == "" {
		port = "5432"
	}

	dsnURL := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, password),
		Host:   net.JoinHostPort(host, port),
		Path:   name,
	}
	query := dsnURL.Query()
	query.Set("sslmode", "disable")
	dsnURL.RawQuery = query.Encode()

	return dsnURL.String(), nil
}
