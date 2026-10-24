package dto

type FoodCategoryRequest struct {
	Name  string  `json:"name" validate:"required,min=2,max=100"`
	Image *string `json:"image,omitempty" validate:"omitempty,max=2048"`
}

type MenuItemRequest struct {
	FoodCategoryID uint    `json:"food_category_id" validate:"required,min=1"`
	Name           string  `json:"name" validate:"required,min=2,max=200"`
	Description    string  `json:"description,omitempty" validate:"omitempty,max=2000"`
	Price          float64 `json:"price" validate:"required,gt=0,lt=1000000"`
	DietaryTags    string  `json:"dietary_tags,omitempty" validate:"omitempty,max=500"`
	IsAvailable    *bool   `json:"is_available,omitempty"`
}
