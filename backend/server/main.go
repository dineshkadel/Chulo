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
	restaurantBrowseService := services.NewRestaurantBrowseService(restaurantRepo)
	restaurantBrowseHandler := handlers.NewRestaurantBrowseHandler(restaurantBrowseService)

	deliveryPersonRepo := repository.NewDeliveryPersonRepository(db)
	deliveryPersonAuthService := services.NewDeliveryPersonAuthService(deliveryPersonRepo, jwtSecret)
	deliveryPersonAuthHandler := handlers.NewDeliveryPersonAuthHandler(deliveryPersonAuthService)
	deliveryPersonAuthMiddleware := appMiddleware.DeliveryPersonAuthMiddleware(deliveryPersonAuthService)

	menuRepo := repository.NewMenuRepository(db)
	menuService := services.NewMenuService(menuRepo)
	menuHandler := handlers.NewMenuHandler(menuService)

	orderRepo := repository.NewOrderRepository(db)
	orderService := services.NewOrderService(orderRepo)
	orderHandler := handlers.NewOrderHandler(orderService)

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
			users.Put("/me", authHandler.UpdateProfile)
			users.Patch("/me", authHandler.UpdateProfile)
			users.Post("/me/role", authHandler.SwitchRole)
			users.Patch("/me/location", authHandler.UpdateLocation)
			users.Post("/me/location", authHandler.UpdateLocation)
		})

		// Restaurant Auth & Profile routes
		v1.Route("/restaurants", func(rest chi.Router) {
			// Public restaurant discovery.
			rest.Get("/", restaurantBrowseHandler.List)
			rest.Get("/{restaurantID}", restaurantBrowseHandler.Get)
			rest.Get("/{restaurantID}/menu-items", menuHandler.ListMenuItems)
			rest.Get("/{restaurantID}/menu-items/{menuItemID}", menuHandler.GetMenuItem)
			rest.Post("/auth/register", restaurantAuthHandler.Register)
			rest.Post("/auth/login", restaurantAuthHandler.Login)
			rest.Post("/auth/refresh", restaurantAuthHandler.RefreshToken)

			// Protected Restaurant routes
			rest.Group(func(protected chi.Router) {
				protected.Use(restaurantAuthMiddleware)
				protected.Get("/me", restaurantAuthHandler.GetMe)
				protected.Put("/me", restaurantAuthHandler.UpdateProfile)
				protected.Delete("/me", restaurantAuthHandler.DeleteProfile)
				protected.Post("/food-categories", menuHandler.CreateCategory)
				protected.Post("/menu-items", menuHandler.CreateMenuItem)
				protected.Put("/menu-items/{menuItemID}", menuHandler.UpdateMenuItem)
				protected.Delete("/menu-items/{menuItemID}", menuHandler.DeleteMenuItem)
				protected.Get("/orders", orderHandler.GetRestaurantOrders)
				protected.Patch("/orders/{id}/status", orderHandler.UpdateRestaurantOrderStatus)
			})
		})

		// Customer Orders
		v1.Route("/orders", func(orders chi.Router) {
			orders.Post("/quote-fee", orderHandler.QuoteFee)

			orders.Group(func(cust chi.Router) {
				cust.Use(authMiddleware)
				cust.Post("/", orderHandler.CreateOrder)
				cust.Get("/", orderHandler.GetCustomerOrders)
				cust.Get("/my-orders", orderHandler.GetCustomerOrders)
				cust.Get("/{id}", orderHandler.GetCustomerOrder)
				cust.Patch("/{id}/cancel", orderHandler.CancelOrder)
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
			admin.Get("/orders", orderHandler.GetAllOrders)
			admin.Get("/orders/{id}", orderHandler.GetOrderByID)
			admin.Patch("/orders/{id}/status", orderHandler.AdminUpdateOrderStatus)
			admin.Patch("/orders/{id}/assign", orderHandler.AdminAssignDeliveryPerson)
		})

		// Delivery person authentication, profile and order routes
		v1.Route("/delivery-persons", func(delivery chi.Router) {
			delivery.Post("/auth/register", deliveryPersonAuthHandler.Register)
			delivery.Post("/auth/login", deliveryPersonAuthHandler.Login)
			delivery.Post("/auth/refresh", deliveryPersonAuthHandler.RefreshToken)
			delivery.Group(func(protected chi.Router) {
				protected.Use(deliveryPersonAuthMiddleware)
				protected.Get("/me", deliveryPersonAuthHandler.GetMe)
				protected.Get("/orders", orderHandler.GetDeliveryOrders)
				protected.Patch("/orders/{id}/status", orderHandler.UpdateDeliveryOrderStatus)
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
