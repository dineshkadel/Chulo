import { useState } from 'react'
import {
  Plus,
  Search,
  UtensilsCrossed,
} from 'lucide-react'

interface FoodCategoryItem {
  id: number
  name: string
  image?: string
  item_count: number
}

interface CatalogMenuItem {
  id: number
  name: string
  restaurant: string
  category: string
  price: number
  is_available: boolean
}

const INITIAL_CATEGORIES: FoodCategoryItem[] = [
  { id: 1, name: 'Momo & Dumplings', item_count: 28 },
  { id: 2, name: 'Thakali & Traditional Thali', item_count: 14 },
  { id: 3, name: 'Biryani & Pulao', item_count: 19 },
  { id: 4, name: 'Pizza & Pasta', item_count: 32 },
  { id: 5, name: 'Burgers & Sandwiches', item_count: 24 },
  { id: 6, name: 'Beverages & Lassi', item_count: 16 },
]

const INITIAL_CATALOG: CatalogMenuItem[] = [
  { id: 1, name: 'Steamed Chicken Momo (10 pcs)', restaurant: 'Himalayan Momo Ghar', category: 'Momo & Dumplings', price: 280, is_available: true },
  { id: 2, name: 'C-Momo (Chilli Momo)', restaurant: 'Himalayan Momo Ghar', category: 'Momo & Dumplings', price: 340, is_available: true },
  { id: 3, name: 'Special Thakali Set (Mutton)', restaurant: 'Thakali Kitchen Hub', category: 'Thakali & Traditional Thali', price: 650, is_available: true },
  { id: 4, name: 'Hyderabadi Chicken Dum Biryani', restaurant: 'Bawarchi Biryani House', category: 'Biryani & Pulao', price: 480, is_available: true },
  { id: 5, name: 'Woodfired Margherita Pizza', restaurant: 'Kathmandu Pizza Co.', category: 'Pizza & Pasta', price: 580, is_available: false },
]

export function AdminMenuTab() {
  const [categories, setCategories] = useState<FoodCategoryItem[]>(INITIAL_CATEGORIES)
  const [items] = useState<CatalogMenuItem[]>(INITIAL_CATALOG)
  const [newCatName, setNewCatName] = useState('')
  const [search, setSearch] = useState('')

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    const newCategory: FoodCategoryItem = {
      id: Date.now(),
      name: newCatName.trim(),
      item_count: 0,
    }
    setCategories((prev) => [...prev, newCategory])
    setNewCatName('')
  }

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.restaurant.toLowerCase().includes(search.toLowerCase()) ||
      i.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8">
      {/* ── Global Food Categories Section ── */}
      <div className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="m-0 text-base font-bold text-[var(--ink)]">Global Food Categories</h2>
            <p className="m-0 text-xs text-stone-500">
              Standardized categories used by all partner restaurants across Chulo
            </p>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="New category name..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="h-10 rounded-xl border border-stone-200 px-3 text-xs focus:border-[var(--red)] focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-[var(--red)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#b83b20] transition-colors cursor-pointer"
            >
              <Plus size={15} /> Add
            </button>
          </form>
        </div>

        {/* Categories cards */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col justify-between rounded-xl border border-stone-200 bg-[#fffaf4] p-4 text-center hover:border-[var(--red)]/50 transition-all"
            >
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-orange-100 text-[var(--red)]">
                <UtensilsCrossed size={18} />
              </span>
              <p className="mt-2 text-xs font-bold text-[var(--ink)] line-clamp-1">{cat.name}</p>
              <span className="mt-1 text-[11px] text-stone-400 font-medium">
                {cat.item_count} items listed
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Catalog Items Moderation ── */}
      <div className="rounded-2xl border border-[#eadfd2] bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="m-0 text-base font-bold text-[var(--ink)]">Global Menu Items Catalog</h2>
            <p className="m-0 text-xs text-stone-500">Overview and moderation of dishes across all restaurants</p>
          </div>

          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              placeholder="Search dish, restaurant, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-64 rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-xs focus:border-[var(--red)] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100">
              <tr>
                <th className="pb-3">Item Name</th>
                <th className="pb-3">Restaurant</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Availability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/60 transition-colors">
                  <td className="py-3 font-bold text-[var(--ink)]">{item.name}</td>
                  <td className="py-3 text-stone-600">{item.restaurant}</td>
                  <td className="py-3">
                    <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-[var(--red)]">Rs {item.price}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${item.is_available ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                      {item.is_available ? 'In Stock' : 'Sold Out'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
