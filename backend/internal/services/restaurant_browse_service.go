package services

import (
	"context"
	"encoding/json"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/models"
	"github.com/dineshkadel/backend/internal/repository"
	"github.com/dineshkadel/backend/utils"
)

// RestaurantBrowseFilter contains customer-facing discovery filters.
type RestaurantBrowseFilter struct {
	Category       string
	Search         string
	OpenNow        bool
	SortByDistance bool
	Lat            *float64
	Lng            *float64
}

type RestaurantBrowseService interface {
	List(ctx context.Context, filter RestaurantBrowseFilter) ([]dto.RestaurantBrowseResponse, error)
}

type restaurantBrowseService struct {
	repo repository.RestaurantRepository
	now  func() time.Time
}

func NewRestaurantBrowseService(repo repository.RestaurantRepository) RestaurantBrowseService {
	return &restaurantBrowseService{repo: repo, now: time.Now}
}

func (s *restaurantBrowseService) List(ctx context.Context, filter RestaurantBrowseFilter) ([]dto.RestaurantBrowseResponse, error) {
	restaurants, err := s.repo.ListActive(ctx)
	if err != nil {
		return nil, err
	}

	now := s.now()
	result := make([]dto.RestaurantBrowseResponse, 0, len(restaurants))
	for _, restaurant := range restaurants {
		isOpen := isRestaurantOpen(restaurant.OperatingHours, now)
		if filter.OpenNow && !isOpen {
			continue
		}
		if filter.Category != "" && !matchesCategory(restaurant, filter.Category) {
			continue
		}
		if filter.Search != "" && !matchesSearch(restaurant, filter.Search) {
			continue
		}

		response := browseResponse(restaurant, isOpen)
		if filter.Lat != nil && filter.Lng != nil {
			distance := utils.HaversineDistance(*filter.Lat, *filter.Lng, restaurant.Lat, restaurant.Lng)
			response.DistanceKM = &distance
		}
		result = append(result, response)
	}

	if filter.SortByDistance {
		sort.SliceStable(result, func(i, j int) bool {
			if result[i].DistanceKM == nil {
				return false
			}
			if result[j].DistanceKM == nil {
				return true
			}
			return *result[i].DistanceKM < *result[j].DistanceKM
		})
	}
	return result, nil
}

func browseResponse(r models.Restaurant, isOpen bool) dto.RestaurantBrowseResponse {
	return dto.RestaurantBrowseResponse{ID: r.ID, Name: r.Name, Description: r.Description, CuisineTypes: r.CuisineTypes, PriceTier: r.PriceTier, Lat: r.Lat, Lng: r.Lng, Address: r.Address, Phone: r.Phone, OperatingHours: r.OperatingHours, HeroImageURL: r.HeroImageURL, DietaryTags: r.DietaryTags, AvgRating: r.AvgRating, ReviewCount: r.ReviewCount, IsOpen: isOpen}
}

func matchesSearch(r models.Restaurant, query string) bool {
	query = strings.ToLower(strings.TrimSpace(query))
	return strings.Contains(strings.ToLower(r.Name), query) || strings.Contains(strings.ToLower(r.Description), query) || strings.Contains(strings.ToLower(r.CuisineTypes), query)
}

func matchesCategory(r models.Restaurant, category string) bool {
	category = strings.ToLower(strings.TrimSpace(category))
	return strings.Contains(strings.ToLower(r.CuisineTypes), category) || strings.Contains(strings.ToLower(r.DietaryTags), category)
}

// isRestaurantOpen supports the documented JSON shapes: {"monday":{"open":"09:00","close":"22:00"}}
// and {"monday":"09:00-22:00"}. Values may use full or abbreviated day names,
// and a day can contain an array of intervals. Missing or malformed hours are closed.
func isRestaurantOpen(raw string, now time.Time) bool {
	if strings.EqualFold(strings.TrimSpace(raw), "24/7") {
		return true
	}
	var hours map[string]json.RawMessage
	if json.Unmarshal([]byte(raw), &hours) != nil {
		return false
	}
	day := strings.ToLower(now.Weekday().String())
	entry, ok := hours[day]
	if !ok {
		entry, ok = hours[day[:3]]
	}
	if !ok {
		return false
	}
	return intervalOpen(entry, now.Hour()*60+now.Minute())
}

func intervalOpen(raw json.RawMessage, minute int) bool {
	var intervals []json.RawMessage
	if json.Unmarshal(raw, &intervals) == nil {
		for _, interval := range intervals {
			if intervalOpen(interval, minute) {
				return true
			}
		}
		return false
	}
	var text string
	if json.Unmarshal(raw, &text) == nil {
		parts := strings.Split(text, "-")
		return len(parts) == 2 && timeRangeOpen(parts[0], parts[1], minute)
	}
	var interval struct {
		Open  string `json:"open"`
		Close string `json:"close"`
	}
	if json.Unmarshal(raw, &interval) != nil {
		return false
	}
	return timeRangeOpen(interval.Open, interval.Close, minute)
}

func timeRangeOpen(open, close string, minute int) bool {
	start, okStart := clockMinutes(open)
	end, okEnd := clockMinutes(close)
	if !okStart || !okEnd {
		return false
	}
	if start == end {
		return true
	} // 00:00-00:00 represents all day.
	if start < end {
		return minute >= start && minute < end
	}
	return minute >= start || minute < end // overnight interval
}

func clockMinutes(value string) (int, bool) {
	parts := strings.Split(strings.TrimSpace(value), ":")
	if len(parts) != 2 {
		return 0, false
	}
	hour, errHour := strconv.Atoi(parts[0])
	minute, errMinute := strconv.Atoi(parts[1])
	if errHour != nil || errMinute != nil || hour < 0 || hour > 23 || minute < 0 || minute > 59 {
		return 0, false
	}
	return hour*60 + minute, true
}
