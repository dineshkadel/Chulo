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

var ErrDeliveryPersonAlreadyExists = errors.New("delivery person with this email or phone already exists")

type DeliveryPersonJWTClaims struct {
	DeliveryPersonID uint   `json:"delivery_person_id"`
	UserID           uint   `json:"user_id"`
	Email            string `json:"email"`
	Role             string `json:"role"`
	TokenType        string `json:"token_type"`
	jwt.RegisteredClaims
}

type DeliveryPersonAuthService interface {
	Register(context.Context, dto.DeliveryPersonRegisterRequest) (*dto.DeliveryPersonAuthResponse, error)
	Login(context.Context, dto.DeliveryPersonLoginRequest) (*dto.DeliveryPersonAuthResponse, error)
	RefreshToken(context.Context, dto.RefreshTokenRequest) (*dto.DeliveryPersonAuthResponse, error)
	GetMe(context.Context, uint) (*dto.DeliveryPersonResponse, error)
	ParseToken(string) (*DeliveryPersonJWTClaims, error)
}

type deliveryPersonAuthService struct {
	repo   repository.DeliveryPersonRepository
	secret []byte
}

func NewDeliveryPersonAuthService(repo repository.DeliveryPersonRepository, jwtSecret string) DeliveryPersonAuthService {
	if jwtSecret == "" {
		jwtSecret = "chulo--secret-key"
	}
	return &deliveryPersonAuthService{repo: repo, secret: []byte(jwtSecret)}
}

func (s *deliveryPersonAuthService) Register(ctx context.Context, req dto.DeliveryPersonRegisterRequest) (*dto.DeliveryPersonAuthResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}
	vehicle := models.VehicleType(strings.ToUpper(strings.TrimSpace(req.VehicleType)))
	if vehicle == "" {
		vehicle = models.VehicleScooter
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}
	person := &models.DeliveryPerson{
		VehicleType:  vehicle,
		LicensePlate: strings.TrimSpace(req.LicensePlate), Status: models.DeliveryStatusOffline, IsActive: true,
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	phone := strings.TrimSpace(req.Phone)
	user, lookupErr := s.repo.GetUserByEmail(ctx, email)
	if lookupErr == nil {
		if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil || (user.Phone != "" && user.Phone != phone) {
			return nil, ErrDeliveryPersonAlreadyExists
		}
	} else if errors.Is(lookupErr, repository.ErrUserNotFound) {
		user = &models.User{
			DisplayName: strings.TrimSpace(req.FullName), Email: email,
			PasswordHash: string(hash), Phone: phone,
			Roles: []models.UserRole{models.RoleCustomer, models.RoleDeliveryPerson}, Preferences: "{}",
		}
	} else {
		return nil, lookupErr
	}
	if err := s.repo.Create(ctx, user, person); err != nil {
		if errors.Is(err, repository.ErrDeliveryPersonAlreadyExists) {
			return nil, ErrDeliveryPersonAlreadyExists
		}
		return nil, fmt.Errorf("failed to register delivery person: %w", err)
	}
	return s.generateAuthResponse(person)
}

func (s *deliveryPersonAuthService) Login(ctx context.Context, req dto.DeliveryPersonLoginRequest) (*dto.DeliveryPersonAuthResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}
	person, err := s.repo.GetByEmail(ctx, strings.ToLower(strings.TrimSpace(req.Email)))
	if err != nil {
		if errors.Is(err, repository.ErrDeliveryPersonNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	if bcrypt.CompareHashAndPassword([]byte(person.User.PasswordHash), []byte(req.Password)) != nil || !person.IsActive {
		return nil, ErrInvalidCredentials
	}
	return s.generateAuthResponse(person)
}

func (s *deliveryPersonAuthService) RefreshToken(ctx context.Context, req dto.RefreshTokenRequest) (*dto.DeliveryPersonAuthResponse, error) {
	if err := dto.ValidateStruct(req); err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidInput, err.Error())
	}
	claims, err := s.ParseToken(req.RefreshToken)
	if err != nil || claims.TokenType != "refresh" || claims.Role != "delivery_person" {
		return nil, ErrInvalidToken
	}
	person, err := s.repo.GetByID(ctx, claims.DeliveryPersonID)
	if err != nil {
		if errors.Is(err, repository.ErrDeliveryPersonNotFound) {
			return nil, ErrInvalidToken
		}
		return nil, err
	}
	if !person.IsActive {
		return nil, ErrInvalidToken
	}
	return s.generateAuthResponse(person)
}

func (s *deliveryPersonAuthService) GetMe(ctx context.Context, id uint) (*dto.DeliveryPersonResponse, error) {
	person, err := s.repo.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, repository.ErrDeliveryPersonNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	response := toDeliveryPersonResponse(person)
	return &response, nil
}

func (s *deliveryPersonAuthService) ParseToken(tokenString string) (*DeliveryPersonJWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &DeliveryPersonJWTClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*DeliveryPersonJWTClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}
	return claims, nil
}

func (s *deliveryPersonAuthService) generateAuthResponse(person *models.DeliveryPerson) (*dto.DeliveryPersonAuthResponse, error) {
	now := time.Now().UTC()
	makeToken := func(tokenType string, expiry time.Duration) (string, error) {
		claims := DeliveryPersonJWTClaims{
			DeliveryPersonID: person.ID, UserID: person.UserID, Email: person.User.Email, Role: string(models.RoleDeliveryPerson), TokenType: tokenType,
			RegisteredClaims: jwt.RegisteredClaims{Issuer: jwtIssuer, Subject: fmt.Sprintf("delivery_person:%d", person.ID), IssuedAt: jwt.NewNumericDate(now), ExpiresAt: jwt.NewNumericDate(now.Add(expiry))},
		}
		return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
	}
	access, err := makeToken("access", accessTokenDuration)
	if err != nil {
		return nil, fmt.Errorf("failed to sign access token: %w", err)
	}
	refresh, err := makeToken("refresh", refreshTokenDuration)
	if err != nil {
		return nil, fmt.Errorf("failed to sign refresh token: %w", err)
	}
	return &dto.DeliveryPersonAuthResponse{DeliveryPerson: toDeliveryPersonResponse(person), AccessToken: access, RefreshToken: refresh, TokenType: "Bearer", ExpiresIn: int64(accessTokenDuration.Seconds())}, nil
}

func toDeliveryPersonResponse(p *models.DeliveryPerson) dto.DeliveryPersonResponse {
	return dto.DeliveryPersonResponse{ID: p.ID, FullName: p.User.DisplayName, Email: p.User.Email, Phone: p.User.Phone, AvatarURL: p.User.AvatarURL, Status: string(p.Status), VehicleType: string(p.VehicleType), LicensePlate: p.LicensePlate, CurrentLat: p.CurrentLat, CurrentLng: p.CurrentLng, AvgRating: p.AvgRating, TotalDeliveries: p.TotalDeliveries, IsVerified: p.IsVerified, IsActive: p.IsActive, CreatedAt: p.CreatedAt}
}
