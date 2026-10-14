package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/dineshkadel/backend/config"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
)

type Response struct {
	Message string `json:"message"`
}

type HealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("failed to write response: %v", err)
	}
}

func main() {
	if err := godotenv.Load(".env", "../.env"); err != nil {
		log.Printf("Warning: .env file not found or unreadable: %v", err)
	}

	db, err := config.ConnectDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Database connection established successfully")

	if err := config.AutoMigrateDB(db); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))

	r.Get("/api", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, Response{Message: "Welcome to the Chulo API"})
	})

	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		dbStatus := "connected"
		sqlDB, err := db.DB()
		if err != nil || sqlDB.Ping() != nil {
			dbStatus = "disconnected"
			writeJSON(w, http.StatusServiceUnavailable, HealthResponse{
				Status:   "error",
				Database: dbStatus,
			})
			return
		}
		writeJSON(w, http.StatusOK, HealthResponse{
			Status:   "ok",
			Database: dbStatus,
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server is running on Port:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
