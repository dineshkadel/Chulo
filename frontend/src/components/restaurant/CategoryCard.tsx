import type { FoodCategory } from '../../types/restaurant'
import {
  CakeSlice,
  Coffee,
  CookingPot,
  CupSoda,
  Fish,
  Pizza,
  Popcorn,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Pizza,
  Momo: Soup,
  Burger: Sandwich,
  Noodles: UtensilsCrossed,
  Sushi: Fish,
  Biryani: CookingPot,
  Thakali: CookingPot,
  Cafe: Coffee,
  Dessert: CakeSlice,
  Salad,
  Sandwich,
  Soup,
  Dal: CookingPot,
  Snacks: Popcorn,
  Drinks: CupSoda,
}

export function CategoryCard({ category }: { category: FoodCategory }) {
  const CategoryIcon = CATEGORY_ICONS[category.name] ?? UtensilsCrossed

  return (
    <button
      type="button"
      className="group flex flex-col items-center gap-3 bg-white border border-[var(--line)] rounded-2xl py-5 px-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-[var(--red)] hover:shadow-[0_8px_24px_hsl(14_75%_45%/0.12)] focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 outline-none w-full"
    >
      <div className="w-14 h-14 rounded-full bg-[var(--sand)] flex items-center justify-center text-[var(--red)] group-hover:bg-[var(--red)]/10 transition-colors">
        {category.image
          ? <img src={category.image} alt="" className="w-10 h-10 object-cover rounded-full" />
          : <CategoryIcon size={24} aria-hidden="true" />
        }
      </div>
      <span className="text-xs font-bold text-[var(--ink)] text-center leading-tight group-hover:text-[var(--red)] transition-colors">
        {category.name}
      </span>
    </button>
  )
}
