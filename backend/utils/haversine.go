// Package utils contains shared utility functions.
package utils

import "math"

const earthRadiusKilometers = 6371.0

// calculate the distnace between two point based on the longotuted n lattitides
func HaversineDistance(latitude1, longitude1, latitude2, longitude2 float64) float64 {
	latitudeDelta := degreesToRadians(latitude2 - latitude1)
	longitudeDelta := degreesToRadians(longitude2 - longitude1)

	latitude1 = degreesToRadians(latitude1)
	latitude2 = degreesToRadians(latitude2)

	haversine := math.Sin(latitudeDelta/2)*math.Sin(latitudeDelta/2) +
		math.Cos(latitude1)*math.Cos(latitude2)*
			math.Sin(longitudeDelta/2)*math.Sin(longitudeDelta/2)

	return earthRadiusKilometers * 2 * math.Atan2(math.Sqrt(haversine), math.Sqrt(1-haversine))
}

func degreesToRadians(degrees float64) float64 {
	return degrees * math.Pi / 180
}
