package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/dineshkadel/backend/config"
	"github.com/dineshkadel/backend/internal/handlers"
	appMiddleware "github.com/dineshkadel/backend/internal/middleware"
	"github.com/dineshkadel/backend/internal/repository"
	"github.com/dineshkadel/backend/internal/services"
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

	// Dependencies
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "chulo-super-secret-jwt-key-2026-very-secure"
	}

	userRepo := repository.NewUserRepository(db)
	authService := services.NewAuthService(userRepo, jwtSecret)
	authHandler := handlers.NewAuthHandler(authService)
	authMiddleware := appMiddleware.AuthMiddleware(authService)

	restaurantRepo := repository.NewRestaurantRepository(db)
	restaurantAuthService := services.NewRestaurantAuthService(restaurantRepo, jwtSecret)
	restaurantAuthHandler := handlers.NewRestaurantAuthHandler(restaurantAuthService)
	restaurantAuthMiddleware := appMiddleware.RestaurantAuthMiddleware(restaurantAuthService)

	deliveryPersonRepo := repository.NewDeliveryPersonRepository(db)
	deliveryPersonAuthService := services.NewDeliveryPersonAuthService(deliveryPersonRepo, jwtSecret)
	deliveryPersonAuthHandler := handlers.NewDeliveryPersonAuthHandler(deliveryPersonAuthService)
	deliveryPersonAuthMiddleware := appMiddleware.DeliveryPersonAuthMiddleware(deliveryPersonAuthService)

	menuRepo := repository.NewMenuRepository(db)
	menuService := services.NewMenuService(menuRepo)
	menuHandler := handlers.NewMenuHandler(menuService)

	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(30 * time.Second))
	r.Use(appMiddleware.CORSMiddleware)
	menuImageDir := os.Getenv("MENU_IMAGE_DIR")
	if menuImageDir == "" {
		menuImageDir = "uploads/menu-items"
	}
	r.Handle("/uploads/menu-items/*", http.StripPrefix("/uploads/menu-items/", http.FileServer(http.Dir(menuImageDir))))

	// Base API info & Health
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

	r.Route("/api/v1", func(v1 chi.Router) {

		// Customer Auth routes
		v1.Route("/auth", func(auth chi.Router) {
			auth.Post("/register", authHandler.Register)
			auth.Post("/login", authHandler.Login)
			auth.Post("/refresh", authHandler.RefreshToken)
		})

		// Protected Customer routes
		v1.Route("/users", func(users chi.Router) {
			users.Use(authMiddleware)
			users.Get("/me", authHandler.GetMe)
			users.Post("/me/role", authHandler.SwitchRole)
			users.Patch("/me/location", authHandler.UpdateLocation)
			users.Post("/me/location", authHandler.UpdateLocation)
		})

		// Restaurant Auth & Profile routes
		v1.Route("/restaurants", func(rest chi.Router) {
			rest.Get("/{restaurantID}/menu-items", menuHandler.ListMenuItems)
			rest.Get("/{restaurantID}/menu-items/{menuItemID}", menuHandler.GetMenuItem)
			rest.Post("/auth/register", restaurantAuthHandler.Register)
			rest.Post("/auth/login", restaurantAuthHandler.Login)
			rest.Post("/auth/refresh", restaurantAuthHandler.RefreshToken)

			// Protected Restaurant routes
			rest.Group(func(protected chi.Router) {
				protected.Use(restaurantAuthMiddleware)
				protected.Get("/me", restaurantAuthHandler.GetMe)
				protected.Post("/food-categories", menuHandler.CreateCategory)
				protected.Post("/menu-items", menuHandler.CreateMenuItem)
				protected.Put("/menu-items/{menuItemID}", menuHandler.UpdateMenuItem)
				protected.Delete("/menu-items/{menuItemID}", menuHandler.DeleteMenuItem)
			})
		})

		// Global food categories are public to read and admin-managed to edit.
		v1.Get("/food-categories", menuHandler.ListCategories)
		v1.Group(func(admin chi.Router) {
			admin.Use(authMiddleware)
			admin.Use(appMiddleware.AdminOnly)
			admin.Post("/food-categories", menuHandler.CreateCategory)
			admin.Patch("/food-categories/{categoryID}", menuHandler.UpdateCategory)
			admin.Delete("/food-categories/{categoryID}", menuHandler.DeleteCategory)
		})

		// Delivery person authentication and profile routes
		v1.Route("/delivery-persons", func(delivery chi.Router) {
			delivery.Post("/auth/register", deliveryPersonAuthHandler.Register)
			delivery.Post("/auth/login", deliveryPersonAuthHandler.Login)
			delivery.Post("/auth/refresh", deliveryPersonAuthHandler.RefreshToken)
			delivery.Group(func(protected chi.Router) {
				protected.Use(deliveryPersonAuthMiddleware)
				protected.Get("/me", deliveryPersonAuthHandler.GetMe)
			})
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server is running on Port:%s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
