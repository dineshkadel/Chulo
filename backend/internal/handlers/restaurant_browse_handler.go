package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/dineshkadel/backend/internal/dto"
	"github.com/dineshkadel/backend/internal/services"
)

type RestaurantBrowseHandler struct {
	service services.RestaurantBrowseService
}

func NewRestaurantBrowseHandler(service services.RestaurantBrowseService) *RestaurantBrowseHandler {
	return &RestaurantBrowseHandler{service: service}
}

// List returns public restaurants. Supported parameters: category, q (or search),
// open_now, lat, lng, and sort=distance (or sort_by=distance).
func (h *RestaurantBrowseHandler) List(w http.ResponseWriter, r *http.Request) {
	filter, err := parseBrowseFilter(r)
	if err != nil {
		dto.WriteError(w, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), "")
		return
	}
	restaurants, err := h.service.List(r.Context(), filter)
	if err != nil {
		dto.WriteError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "Could not list restaurants", err.Error())
		return
	}
	dto.WriteJSON(w, http.StatusOK, restaurants, nil)
}

func parseBrowseFilter(r *http.Request) (services.RestaurantBrowseFilter, error) {
	q := r.URL.Query()
	filter := services.RestaurantBrowseFilter{Category: strings.TrimSpace(q.Get("category")), Search: strings.TrimSpace(q.Get("q"))}
	if filter.Search == "" {
		filter.Search = strings.TrimSpace(q.Get("search"))
	}
	if raw := q.Get("open_now"); raw != "" {
		open, err := strconv.ParseBool(raw)
		if err != nil {
			return filter, err
		}
		filter.OpenNow = open
	}
	sort := q.Get("sort")
	if sort == "" {
		sort = q.Get("sort_by")
	}
	if sort != "" && sort != "distance" {
		return filter, &browseInputError{"sort must be 'distance'"}
	}
	filter.SortByDistance = sort == "distance"
	lat, hasLat, err := coordinate(q.Get("lat"), "lat", -90, 90)
	if err != nil {
		return filter, err
	}
	lng, hasLng, err := coordinate(q.Get("lng"), "lng", -180, 180)
	if err != nil {
		return filter, err
	}
	if hasLat != hasLng {
		return filter, &browseInputError{"lat and lng must be provided together"}
	}
	if filter.SortByDistance && !hasLat {
		return filter, &browseInputError{"lat and lng are required when sort=distance"}
	}
	if hasLat {
		filter.Lat, filter.Lng = &lat, &lng
	}
	return filter, nil
}

type browseInputError struct{ message string }

func (e *browseInputError) Error() string { return e.message }

func coordinate(raw, name string, min, max float64) (float64, bool, error) {
	if raw == "" {
		return 0, false, nil
	}
	value, err := strconv.ParseFloat(raw, 64)
	if err != nil || value < min || value > max {
		return 0, false, &browseInputError{name + " must be between " + strconv.FormatFloat(min, 'f', -1, 64) + " and " + strconv.FormatFloat(max, 'f', -1, 64)}
	}
	return value, true, nil
}
