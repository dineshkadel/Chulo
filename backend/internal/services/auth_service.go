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
	ErrInvalidInput       = errors.New("invalid input data")
	ErrUserAlreadyExists  = errors.New("email is already registered")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrUserNotFound       = errors.New("user not found")
)

const (
	bcryptCost           = 12
	accessTokenDuration  = 15 * time.Minute
	refreshTokenDuration = 7 * 24 * time.Hour
	jwtIssuer            = "chulo-api"
)

type JWTClaims struct {
	UserID           uint   `json:"user_id"`
	DeliveryPersonID uint   `json:"delivery_person_id,omitempty"`
	Email            string `json:"email"`
	Role             string `json:"role"`
	TokenType        string `json:"token_type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

type AuthService interface {
	Register(ctx context.Context, req dto.RegisterRequest) (*dto.AuthResponse, error)
	Login(ctx context.Context, req dto.LoginRequest) (*dto.AuthResponse, error)
	RefreshToken(ctx context.Context, req dto.RefreshTokenRequest) (*dto.AuthResponse, error)
	GetMe(ctx context.Context, userID uint) (*dto.UserResponse, error)
	SwitchRole(ctx context.Context, userID uint, role models.UserRole) (*dto.AuthResponse, error)
	UpdateLocation(ctx context.Context, userID uint, req dto.UpdateLocationRequest) (*dto.UserResponse, error)
	ParseToken(tokenString string) (*JWTClaims, error)
}

type authService struct {
	repo      repository.UserRepository
	jwtSecret []byte
}

// creates a new AuthService.
func NewAuthService(repo repository.UserRepository, jwtSecret string) AuthService {
	if jwtSecret == "" {
		jwtSecret = "chulo-default-secret-key-change-in-production-min-256-bits"
	}
	return &authService{
		repo:      repo,
		jwtSecret: []byte(jwtSecret),
	}
}

func (s *authService) Register(ctx context.Context, req dto.RegisterRequest) (*dto.AuthResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	name := strings.TrimSpace(req.DisplayName)
	email := strings.ToLower(strings.TrimSpace(req.Email))

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &models.User{
		Email:        email,
		PasswordHash: string(hash),
		DisplayName:  name,
		Roles:        []models.UserRole{models.RoleCustomer},
		Phone:        strings.TrimSpace(req.Phone),
		Preferences:  "{}",
	}

	if err := s.repo.Create(ctx, user); err != nil {
		if errors.Is(err, repository.ErrUserAlreadyExists) {
			return nil, ErrUserAlreadyExists
		}
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return s.generateAuthResponse(user, models.RoleCustomer)
}

func (s *authService) Login(ctx context.Context, req dto.LoginRequest) (*dto.AuthResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	if !user.HasRole(models.RoleCustomer) && !user.HasRole(models.RoleAdmin) {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	activeRole := models.RoleCustomer
	if !user.HasRole(activeRole) {
		activeRole = models.RoleAdmin
	}
	return s.generateAuthResponse(user, activeRole)
}

func (s *authService) RefreshToken(ctx context.Context, req dto.RefreshTokenRequest) (*dto.AuthResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	claims, err := s.ParseToken(req.RefreshToken)
	if err != nil || claims.TokenType != "refresh" {
		return nil, ErrInvalidToken
	}

	user, err := s.repo.GetByID(ctx, claims.UserID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrInvalidToken
		}
		return nil, err
	}

	activeRole := models.UserRole(claims.Role)
	if !user.HasRole(activeRole) {
		return nil, ErrInvalidToken
	}
	return s.generateAuthResponse(user, activeRole)
}

func (s *authService) SwitchRole(ctx context.Context, userID uint, role models.UserRole) (*dto.AuthResponse, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	if !user.HasRole(role) {
		return nil, ErrInvalidCredentials
	}
	if role == models.RoleDeliveryPerson && user.DeliveryPerson == nil {
		return nil, ErrInvalidCredentials
	}
	return s.generateAuthResponse(user, role)
}

func (s *authService) GetMe(ctx context.Context, userID uint) (*dto.UserResponse, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	res := toUserResponse(user)
	return &res, nil
}

func (s *authService) UpdateLocation(ctx context.Context, userID uint, req dto.UpdateLocationRequest) (*dto.UserResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}

	now := time.Now().UTC()
	user, err := s.repo.UpdateLocation(ctx, userID, req.Latitude, req.Longitude, now)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	// If the user requested saving as an address or provided street/city/label
	if req.SaveAsAddress || req.City != "" || req.Street != "" {
		label := req.Label
		if label == "" {
			label = "Current Location"
		}
		street := req.Street
		if street == "" {
			street = "Detected Location"
		}
		city := req.City
		if city == "" {
			city = "Unknown"
		}

		_ = s.repo.CreateAddress(ctx, &models.Address{
			UserID:    userID,
			Label:     label,
			Street:    street,
			City:      city,
			Lat:       req.Latitude,
			Lng:       req.Longitude,
			IsDefault: true,
		})
	}

	res := toUserResponse(user)
	return &res, nil
}

func (s *authService) ParseToken(tokenString string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

func (s *authService) generateAuthResponse(user *models.User, activeRole models.UserRole) (*dto.AuthResponse, error) {
	now := time.Now().UTC()

	accessClaims := JWTClaims{
		UserID:           user.ID,
		DeliveryPersonID: deliveryPersonID(user, activeRole),
		Email:            user.Email,
		Role:             string(activeRole),
		TokenType:        "access",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    jwtIssuer,
			Subject:   fmt.Sprintf("%d", user.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(accessTokenDuration)),
		},
	}
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString(s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}

	refreshClaims := JWTClaims{
		UserID:           user.ID,
		DeliveryPersonID: deliveryPersonID(user, activeRole),
		Email:            user.Email,
		Role:             string(activeRole),
		TokenType:        "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    jwtIssuer,
			Subject:   fmt.Sprintf("%d", user.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(refreshTokenDuration)),
		},
	}
	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(s.jwtSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return &dto.AuthResponse{
		User:         toUserResponse(user),
		ActiveRole:   string(activeRole),
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(accessTokenDuration.Seconds()),
	}, nil
}

func toUserResponse(user *models.User) dto.UserResponse {
	roles := make([]string, 0, len(user.Roles))
	for _, role := range user.Roles {
		roles = append(roles, string(role))
	}
	return dto.UserResponse{
		ID:                user.ID,
		Email:             user.Email,
		DisplayName:       user.DisplayName,
		Roles:             roles,
		AvatarURL:         user.AvatarURL,
		Phone:             user.Phone,
		CurrentLat:        user.CurrentLat,
		CurrentLng:        user.CurrentLng,
		LocationUpdatedAt: user.LocationUpdatedAt,
		CreatedAt:         user.CreatedAt,
	}
}

func deliveryPersonID(user *models.User, activeRole models.UserRole) uint {
	if activeRole == models.RoleDeliveryPerson && user.DeliveryPerson != nil {
		return user.DeliveryPerson.ID
	}
	return 0
}
