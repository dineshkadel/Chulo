package config

import (
	"fmt"
	"net"
	"net/url"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// postgresql connection with GORM
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
