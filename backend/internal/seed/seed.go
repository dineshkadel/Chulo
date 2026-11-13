package seed

import (
	"fmt"
	"strings"

	"github.com/dineshkadel/backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type restaurantSeed struct {
	name, email, cuisine, address, description string
	lat, lng                                   float64
	priceTier                                  int
}

// DevelopmentData inserts ten food categories, restaurants, and three menu
// items per restaurant. Existing records are kept, so the command is safe to
// run repeatedly on a local development database.
func DevelopmentData(db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		categories := []string{"Momo", "Nepali", "Newari", "Thakali", "Indian", "Chinese", "Bakery", "Coffee", "Burgers", "Desserts"}
		categoryIDs := make(map[string]uint, len(categories))
		for _, name := range categories {
			if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&models.FoodCategory{Name: name}).Error; err != nil {
				return fmt.Errorf("seed category %q: %w", name, err)
			}
			var category models.FoodCategory
			if err := tx.Where("LOWER(name) = LOWER(?)", name).First(&category).Error; err != nil {
				return fmt.Errorf("find category %q: %w", name, err)
			}
			categoryIDs[name] = category.ID
		}

		restaurants := []restaurantSeed{
			{"Momo Ghar", "seed-momoghar@chulo.local", "Momo, Nepali", "Thamel, Kathmandu", "Steamed and fried momos made fresh every day.", 27.7152, 85.3123, 2},
			{"Himalayan Thakali", "seed-thakali@chulo.local", "Thakali, Nepali", "Lazimpat, Kathmandu", "Comforting thakali sets with seasonal local ingredients.", 27.7215, 85.3222, 3},
			{"Newa Bhoye", "seed-newa@chulo.local", "Newari, Nepali", "Patan Durbar Square, Lalitpur", "Traditional Newari plates and celebratory snacks.", 27.6731, 85.3250, 3},
			{"Kathmandu Kitchen", "seed-kitchen@chulo.local", "Indian, Chinese", "Putalisadak, Kathmandu", "Big flavours, quick lunches, and generous portions.", 27.7055, 85.3207, 2},
			{"Boudha Bakery", "seed-bakery@chulo.local", "Bakery, Coffee", "Boudha, Kathmandu", "Warm sourdough, pastries, and carefully brewed coffee.", 27.7210, 85.3616, 2},
			{"Burger Station", "seed-burger@chulo.local", "Burgers, Western", "Jhamsikhel, Lalitpur", "Smash burgers, crispy fries, and house sauces.", 27.6807, 85.3166, 2},
			{"Wok This Way", "seed-wok@chulo.local", "Chinese, Asian", "New Baneshwor, Kathmandu", "Wok-tossed noodles and sizzling stir-fries.", 27.6906, 85.3428, 2},
			{"Chiya Chowk", "seed-chiya@chulo.local", "Coffee, Nepali", "Kirtipur, Kathmandu", "Spiced chiya and local bites for slow afternoons.", 27.6788, 85.2787, 1},
			{"Sweet Tooth", "seed-sweettooth@chulo.local", "Desserts, Bakery", "Kupondole, Lalitpur", "Cakes, cookies, and small-batch desserts.", 27.6908, 85.3203, 2},
			{"Tasty Tiffin", "seed-tiffin@chulo.local", "Indian, Nepali", "Maharajgunj, Kathmandu", "Wholesome tiffins inspired by home cooking.", 27.7381, 85.3314, 2},
		}

		for index, entry := range restaurants {
			restaurant := models.Restaurant{Email: entry.email, PasswordHash: "$2a$10$7EqJtq98hPqEX7fNZaFWoO5qS78xLPADlBzXFjTEcfnL5LY0Ez5k6", Name: entry.name, Description: entry.description, CuisineTypes: postgresTextArray(entry.cuisine), PriceTier: entry.priceTier, Lat: entry.lat, Lng: entry.lng, Address: entry.address, Phone: "98000000" + fmt.Sprintf("%02d", index), OperatingHours: allDaysHours, AvgRating: 3.9 + float64(index%5)/10, ReviewCount: 12 + index*9, DietaryTags: "{vegetarian}", IsActive: true}
			if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "email"}}, DoNothing: true}).Create(&restaurant).Error; err != nil {
				return fmt.Errorf("seed restaurant %q: %w", entry.name, err)
			}
			if err := tx.Where("email = ?", entry.email).First(&restaurant).Error; err != nil {
				return fmt.Errorf("find restaurant %q: %w", entry.name, err)
			}
			if err := seedMenu(tx, restaurant.ID, categoryIDs, index); err != nil {
				return err
			}
		}
		return nil
	})
}

func seedMenu(tx *gorm.DB, restaurantID uint, categories map[string]uint, index int) error {
	items := []struct {
		name, description, category string
		price                       float64
	}{
		{"House Special", "A customer favourite, freshly made to order.", "Nepali", 260 + float64(index*10)},
		{"Chef's Pick", "Seasonal ingredients with the kitchen's signature touch.", "Indian", 340 + float64(index*10)},
		{"Sweet Finish", "A small, satisfying dessert to finish your meal.", "Desserts", 180 + float64(index*5)},
	}
	for _, item := range items {
		categoryID := categories[item.category]
		if categoryID == 0 {
			categoryID = categories["Momo"]
		}
		menu := models.MenuItem{RestaurantID: restaurantID, FoodCategoryID: categoryID, Name: item.name, Description: item.description, Price: item.price, DietaryTags: "{vegetarian}", IsAvailable: true}
		var count int64
		if err := tx.Model(&models.MenuItem{}).Where("restaurant_id = ? AND name = ?", restaurantID, item.name).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			if err := tx.Create(&menu).Error; err != nil {
				return fmt.Errorf("seed menu item %q: %w", item.name, err)
			}
		}
	}
	return nil
}

func postgresTextArray(values string) string {
	parts := strings.Split(values, ",")
	for index := range parts {
		parts[index] = `"` + strings.ReplaceAll(strings.TrimSpace(parts[index]), `"`, `\\"`) + `"`
	}
	return "{" + strings.Join(parts, ",") + "}"
}

const allDaysHours = `{"monday":"00:00-00:00","tuesday":"00:00-00:00","wednesday":"00:00-00:00","thursday":"00:00-00:00","friday":"00:00-00:00","saturday":"00:00-00:00","sunday":"00:00-00:00"}`
