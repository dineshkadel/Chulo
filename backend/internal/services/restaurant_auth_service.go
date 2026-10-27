package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/models"
	"github.com/dineshkadel/backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrRestaurantAlreadyExists = errors.New("restaurant with this email already exists")
)

// RestaurantJWTClaims defines the claims stored in restaurant JWTs.
type RestaurantJWTClaims struct {
	RestaurantID uint   `json:"restaurant_id"`
	Email        string `json:"email"`
	Role         string `json:"role"`
	TokenType    string `json:"token_type"`
	jwt.RegisteredClaims
}

// the business operations for restaurant authentication.
type RestaurantAuthService interface {
	Register(ctx context.Context, req dto.RestaurantRegisterRequest) (*dto.RestaurantAuthResponse, error)
	Login(ctx context.Context, req dto.RestaurantLoginRequest) (*dto.RestaurantAuthResponse, error)
	RefreshToken(ctx context.Context, req dto.RefreshTokenRequest) (*dto.RestaurantAuthResponse, error)
	GetMe(ctx context.Context, restaurantID uint) (*dto.RestaurantResponse, error)
	UpdateProfile(ctx context.Context, restaurantID uint, req dto.RestaurantProfileUpdateRequest) (*dto.RestaurantResponse, error)
	DeleteProfile(ctx context.Context, restaurantID uint) error
	ParseToken(tokenString string) (*RestaurantJWTClaims, error)
}

type restaurantAuthService struct {
	repo      repository.RestaurantRepository
	jwtSecret []byte
}

func NewRestaurantAuthService(repo repository.RestaurantRepository, jwtSecret string) RestaurantAuthService {
	if jwtSecret == "" {
		jwtSecret = "chulo--secret-key"
	}
	return &restaurantAuthService{
		repo:      repo,
		jwtSecret: []byte(jwtSecret),
	}
}

func (s *restaurantAuthService) Register(ctx context.Context, req dto.RestaurantRegisterRequest) (*dto.RestaurantAuthResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	priceTier := req.PriceTier
	if priceTier == 0 {
		priceTier = 2
	}

	restaurant := &models.Restaurant{
		Email:          email,
		PasswordHash:   string(hash),
		Name:           strings.TrimSpace(req.Name),
		Description:    strings.TrimSpace(req.Description),
		CuisineTypes:   formatPostgresArray(req.CuisineTypes),
		PriceTier:      priceTier,
		Address:        strings.TrimSpace(req.Address),
		Phone:          strings.TrimSpace(req.Phone),
		Lat:            req.Lat,
		Lng:            req.Lng,
		OperatingHours: "{}",
		DietaryTags:    "{}",
		IsActive:       true,
	}

	if err := s.repo.Create(ctx, restaurant); err != nil {
		if errors.Is(err, repository.ErrRestaurantAlreadyExists) {
			return nil, ErrRestaurantAlreadyExists
		}
		return nil, fmt.Errorf("failed to register restaurant: %w", err)
	}

	return s.generateAuthResponse(restaurant)
}

func (s *restaurantAuthService) Login(ctx context.Context, req dto.RestaurantLoginRequest) (*dto.RestaurantAuthResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	restaurant, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrRestaurantNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(restaurant.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.generateAuthResponse(restaurant)
}

func (s *restaurantAuthService) RefreshToken(ctx context.Context, req dto.RefreshTokenRequest) (*dto.RestaurantAuthResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	claims, err := s.ParseToken(req.RefreshToken)
	if err != nil || claims.TokenType != "refresh" || claims.Role != "restaurant" {
		return nil, ErrInvalidToken
	}

	restaurant, err := s.repo.GetByID(ctx, claims.RestaurantID)
	if err != nil {
		if errors.Is(err, repository.ErrRestaurantNotFound) {
			return nil, ErrInvalidToken
		}
		return nil, err
	}

	return s.generateAuthResponse(restaurant)
}

func (s *restaurantAuthService) GetMe(ctx context.Context, restaurantID uint) (*dto.RestaurantResponse, error) {
	restaurant, err := s.repo.GetByID(ctx, restaurantID)
	if err != nil {
		if errors.Is(err, repository.ErrRestaurantNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	res := toRestaurantResponse(restaurant)
	return &res, nil
}

func (s *restaurantAuthService) UpdateProfile(ctx context.Context, restaurantID uint, req dto.RestaurantProfileUpdateRequest) (*dto.RestaurantResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	restaurant, err := s.repo.GetByID(ctx, restaurantID)
	if err != nil {
		if errors.Is(err, repository.ErrRestaurantNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	restaurant.Name = strings.TrimSpace(req.Name)
	restaurant.Description = strings.TrimSpace(req.Description)
	restaurant.CuisineTypes = formatPostgresArray(req.CuisineTypes)
	restaurant.PriceTier = req.PriceTier
	restaurant.Lat = req.Lat
	restaurant.Lng = req.Lng
	restaurant.Address = strings.TrimSpace(req.Address)
	restaurant.Phone = strings.TrimSpace(req.Phone)
	restaurant.OperatingHours = strings.TrimSpace(req.OperatingHours)
	if restaurant.OperatingHours == "" {
		restaurant.OperatingHours = "{}"
	}
	restaurant.HeroImageURL = strings.TrimSpace(req.HeroImageURL)
	restaurant.DietaryTags = formatPostgresArray(req.DietaryTags)

	if err := s.repo.Update(ctx, restaurant); err != nil {
		return nil, fmt.Errorf("failed to update restaurant profile: %w", err)
	}

	res := toRestaurantResponse(restaurant)
	return &res, nil
}

func (s *restaurantAuthService) DeleteProfile(ctx context.Context, restaurantID uint) error {
	if err := s.repo.Delete(ctx, restaurantID); err != nil {
		if errors.Is(err, repository.ErrRestaurantNotFound) {
			return ErrUserNotFound
		}
		return fmt.Errorf("failed to delete restaurant profile: %w", err)
	}
	return nil
}

func (s *restaurantAuthService) ParseToken(tokenString string) (*RestaurantJWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &RestaurantJWTClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*RestaurantJWTClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

func (s *restaurantAuthService) generateAuthResponse(restaurant *models.Restaurant) (*dto.RestaurantAuthResponse, error) {
	now := time.Now().UTC()

	accessClaims := RestaurantJWTClaims{
		RestaurantID: restaurant.ID,
		Email:        restaurant.Email,
		Role:         "restaurant",
		TokenType:    "access",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    jwtIssuer,
			Subject:   fmt.Sprintf("restaurant:%d", restaurant.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(accessTokenDuration)),
		},
	}
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	refreshClaims := RestaurantJWTClaims{
		RestaurantID: restaurant.ID,
		Email:        restaurant.Email,
		Role:         "restaurant",
		TokenType:    "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    jwtIssuer,
			Subject:   fmt.Sprintf("restaurant:%d", restaurant.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(refreshTokenDuration)),
		},
	}
	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return &dto.RestaurantAuthResponse{
		Restaurant:   toRestaurantResponse(restaurant),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(accessTokenDuration.Seconds()),
	}, nil
}

func toRestaurantResponse(r *models.Restaurant) dto.RestaurantResponse {
	return dto.RestaurantResponse{
		ID:             r.ID,
		Email:          r.Email,
		Name:           r.Name,
		Description:    r.Description,
		CuisineTypes:   r.CuisineTypes,
		PriceTier:      r.PriceTier,
		Lat:            r.Lat,
		Lng:            r.Lng,
		Address:        r.Address,
		Phone:          r.Phone,
		OperatingHours: r.OperatingHours,
		HeroImageURL:   r.HeroImageURL,
		DietaryTags:    r.DietaryTags,
		AvgRating:      r.AvgRating,
		ReviewCount:    r.ReviewCount,
		IsActive:       r.IsActive,
		CreatedAt:      r.CreatedAt,
	}
}

func formatPostgresArray(input string) string {
	input = strings.TrimSpace(input)
	if input == "" {
		return "{}"
	}
	if strings.HasPrefix(input, "{") && strings.HasSuffix(input, "}") {
		return input
	}
	parts := strings.Split(input, ",")
	var cleaned []string
	for _, p := range parts {
		trimmed := strings.TrimSpace(p)
		if trimmed != "" {
			cleaned = append(cleaned, fmt.Sprintf(`"%s"`, strings.ReplaceAll(trimmed, `"`, `\"`)))
		}
	}
	if len(cleaned) == 0 {
		return "{}"
	}
	return fmt.Sprintf("{%s}", strings.Join(cleaned, ","))
}
