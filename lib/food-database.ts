// Static food database with common foods and their nutritional values per 100g
export interface FoodItem {
  id: string
  name: string
  brand?: string
  category: string
  per100g: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber?: number
    sugar?: number
    sodium?: number
  }
  commonServings: { label: string; grams: number }[]
}

export const FOOD_DATABASE: FoodItem[] = [
  // Proteins
  { id: "chicken-breast", name: "Chicken Breast", category: "Meat & Poultry", per100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6, sodium: 74 }, commonServings: [{ label: "1 breast (170g)", grams: 170 }, { label: "100g", grams: 100 }] },
  { id: "chicken-thigh", name: "Chicken Thigh", category: "Meat & Poultry", per100g: { calories: 209, protein: 26, carbs: 0, fat: 11, sodium: 84 }, commonServings: [{ label: "1 thigh (100g)", grams: 100 }, { label: "100g", grams: 100 }] },
  { id: "beef-mince-lean", name: "Beef Mince (Lean)", category: "Meat & Poultry", per100g: { calories: 215, protein: 26, carbs: 0, fat: 12, sodium: 75 }, commonServings: [{ label: "100g", grams: 100 }, { label: "150g", grams: 150 }] },
  { id: "beef-steak", name: "Beef Steak (Sirloin)", category: "Meat & Poultry", per100g: { calories: 207, protein: 29, carbs: 0, fat: 10, sodium: 56 }, commonServings: [{ label: "1 steak (200g)", grams: 200 }, { label: "100g", grams: 100 }] },
  { id: "salmon-fillet", name: "Salmon Fillet", category: "Fish & Seafood", per100g: { calories: 208, protein: 20, carbs: 0, fat: 13, sodium: 59 }, commonServings: [{ label: "1 fillet (150g)", grams: 150 }, { label: "100g", grams: 100 }] },
  { id: "tuna-canned", name: "Tuna (Canned in Water)", category: "Fish & Seafood", per100g: { calories: 116, protein: 26, carbs: 0, fat: 1, sodium: 333 }, commonServings: [{ label: "1 can (120g)", grams: 120 }, { label: "100g", grams: 100 }] },
  { id: "cod-fillet", name: "Cod Fillet", category: "Fish & Seafood", per100g: { calories: 82, protein: 18, carbs: 0, fat: 0.7, sodium: 54 }, commonServings: [{ label: "1 fillet (170g)", grams: 170 }, { label: "100g", grams: 100 }] },
  { id: "eggs-whole", name: "Eggs (Whole)", category: "Eggs & Dairy", per100g: { calories: 143, protein: 13, carbs: 1, fat: 10, sodium: 140 }, commonServings: [{ label: "1 large egg (60g)", grams: 60 }, { label: "2 eggs (120g)", grams: 120 }] },
  { id: "egg-whites", name: "Egg Whites", category: "Eggs & Dairy", per100g: { calories: 52, protein: 11, carbs: 0.7, fat: 0.2, sodium: 166 }, commonServings: [{ label: "3 egg whites (90g)", grams: 90 }, { label: "100g", grams: 100 }] },
  { id: "greek-yoghurt", name: "Greek Yoghurt (0% Fat)", category: "Eggs & Dairy", per100g: { calories: 59, protein: 10, carbs: 3.6, fat: 0.4, sugar: 3.2 }, commonServings: [{ label: "150g pot", grams: 150 }, { label: "100g", grams: 100 }] },
  { id: "cottage-cheese", name: "Cottage Cheese (Low Fat)", category: "Eggs & Dairy", per100g: { calories: 72, protein: 12, carbs: 3, fat: 1, sodium: 364 }, commonServings: [{ label: "100g", grams: 100 }, { label: "200g", grams: 200 }] },
  { id: "whey-protein", name: "Whey Protein Powder", category: "Supplements", per100g: { calories: 382, protein: 80, carbs: 7, fat: 4 }, commonServings: [{ label: "1 scoop (30g)", grams: 30 }, { label: "2 scoops (60g)", grams: 60 }] },
  { id: "tofu-firm", name: "Tofu (Firm)", category: "Plant Proteins", per100g: { calories: 76, protein: 8, carbs: 1.9, fat: 4.8 }, commonServings: [{ label: "100g", grams: 100 }, { label: "150g", grams: 150 }] },
  { id: "tempeh", name: "Tempeh", category: "Plant Proteins", per100g: { calories: 193, protein: 19, carbs: 9, fat: 11, fiber: 1.4 }, commonServings: [{ label: "100g", grams: 100 }] },
  { id: "lentils-cooked", name: "Lentils (Cooked)", category: "Legumes", per100g: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9 }, commonServings: [{ label: "100g", grams: 100 }, { label: "200g", grams: 200 }] },
  { id: "chickpeas-cooked", name: "Chickpeas (Cooked)", category: "Legumes", per100g: { calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6 }, commonServings: [{ label: "100g", grams: 100 }, { label: "150g", grams: 150 }] },
  { id: "black-beans", name: "Black Beans (Cooked)", category: "Legumes", per100g: { calories: 132, protein: 8.9, carbs: 24, fat: 0.5, fiber: 8.7 }, commonServings: [{ label: "100g", grams: 100 }, { label: "150g", grams: 150 }] },

  // Carbs / Grains
  { id: "oats-rolled", name: "Oats (Rolled)", category: "Grains & Cereals", per100g: { calories: 379, protein: 13, carbs: 68, fat: 6.5, fiber: 10, sugar: 1.1 }, commonServings: [{ label: "1 cup dry (80g)", grams: 80 }, { label: "40g", grams: 40 }] },
  { id: "rice-white-cooked", name: "White Rice (Cooked)", category: "Grains & Cereals", per100g: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 }, commonServings: [{ label: "1 cup (185g)", grams: 185 }, { label: "100g", grams: 100 }] },
  { id: "rice-brown-cooked", name: "Brown Rice (Cooked)", category: "Grains & Cereals", per100g: { calories: 123, protein: 2.7, carbs: 26, fat: 1, fiber: 1.6 }, commonServings: [{ label: "1 cup (185g)", grams: 185 }, { label: "100g", grams: 100 }] },
  { id: "pasta-cooked", name: "Pasta (Cooked)", category: "Grains & Cereals", per100g: { calories: 158, protein: 5.8, carbs: 31, fat: 0.9, fiber: 1.8 }, commonServings: [{ label: "1 cup (140g)", grams: 140 }, { label: "100g", grams: 100 }] },
  { id: "pasta-wholemeal", name: "Wholemeal Pasta (Cooked)", category: "Grains & Cereals", per100g: { calories: 149, protein: 5.3, carbs: 29, fat: 0.8, fiber: 3.2 }, commonServings: [{ label: "1 cup (140g)", grams: 140 }, { label: "100g", grams: 100 }] },
  { id: "bread-wholemeal", name: "Wholemeal Bread", category: "Bread & Bakery", per100g: { calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 6.8, sugar: 4.4 }, commonServings: [{ label: "1 slice (40g)", grams: 40 }, { label: "2 slices (80g)", grams: 80 }] },
  { id: "bread-white", name: "White Bread", category: "Bread & Bakery", per100g: { calories: 266, protein: 9, carbs: 51, fat: 3.2, fiber: 2.7, sugar: 5 }, commonServings: [{ label: "1 slice (30g)", grams: 30 }, { label: "2 slices (60g)", grams: 60 }] },
  { id: "sweet-potato", name: "Sweet Potato (Cooked)", category: "Vegetables", per100g: { calories: 90, protein: 2, carbs: 21, fat: 0.1, fiber: 3.3, sugar: 4.2 }, commonServings: [{ label: "1 medium (130g)", grams: 130 }, { label: "100g", grams: 100 }] },
  { id: "potato-boiled", name: "Potato (Boiled)", category: "Vegetables", per100g: { calories: 87, protein: 1.9, carbs: 20, fat: 0.1, fiber: 1.8 }, commonServings: [{ label: "1 medium (150g)", grams: 150 }, { label: "100g", grams: 100 }] },
  { id: "quinoa-cooked", name: "Quinoa (Cooked)", category: "Grains & Cereals", per100g: { calories: 120, protein: 4.4, carbs: 22, fat: 1.9, fiber: 2.8 }, commonServings: [{ label: "1 cup (185g)", grams: 185 }, { label: "100g", grams: 100 }] },
  { id: "banana", name: "Banana", category: "Fruit", per100g: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12 }, commonServings: [{ label: "1 medium (120g)", grams: 120 }, { label: "1 large (150g)", grams: 150 }] },
  { id: "apple", name: "Apple", category: "Fruit", per100g: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10 }, commonServings: [{ label: "1 medium (150g)", grams: 150 }, { label: "100g", grams: 100 }] },
  { id: "blueberries", name: "Blueberries", category: "Fruit", per100g: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3, fiber: 2.4, sugar: 10 }, commonServings: [{ label: "100g", grams: 100 }, { label: "150g", grams: 150 }] },
  { id: "orange", name: "Orange", category: "Fruit", per100g: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4, sugar: 9.4 }, commonServings: [{ label: "1 medium (130g)", grams: 130 }, { label: "100g", grams: 100 }] },

  // Fats
  { id: "olive-oil", name: "Olive Oil", category: "Oils & Fats", per100g: { calories: 884, protein: 0, carbs: 0, fat: 100 }, commonServings: [{ label: "1 tbsp (14g)", grams: 14 }, { label: "1 tsp (5g)", grams: 5 }] },
  { id: "avocado", name: "Avocado", category: "Fruit", per100g: { calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 6.7 }, commonServings: [{ label: "½ avocado (75g)", grams: 75 }, { label: "1 whole (200g)", grams: 200 }] },
  { id: "almonds", name: "Almonds", category: "Nuts & Seeds", per100g: { calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 }, commonServings: [{ label: "Small handful (28g)", grams: 28 }, { label: "50g", grams: 50 }] },
  { id: "peanut-butter", name: "Peanut Butter", category: "Nuts & Seeds", per100g: { calories: 588, protein: 25, carbs: 20, fat: 50, fiber: 5.9, sugar: 9.2 }, commonServings: [{ label: "1 tbsp (16g)", grams: 16 }, { label: "2 tbsp (32g)", grams: 32 }] },
  { id: "cashews", name: "Cashews", category: "Nuts & Seeds", per100g: { calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3 }, commonServings: [{ label: "Small handful (28g)", grams: 28 }, { label: "50g", grams: 50 }] },
  { id: "chia-seeds", name: "Chia Seeds", category: "Nuts & Seeds", per100g: { calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34 }, commonServings: [{ label: "1 tbsp (12g)", grams: 12 }, { label: "2 tbsp (24g)", grams: 24 }] },

  // Vegetables / Low-calorie
  { id: "broccoli", name: "Broccoli", category: "Vegetables", per100g: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6 }, commonServings: [{ label: "1 cup florets (91g)", grams: 91 }, { label: "100g", grams: 100 }] },
  { id: "spinach", name: "Spinach", category: "Vegetables", per100g: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2 }, commonServings: [{ label: "1 cup (30g)", grams: 30 }, { label: "100g", grams: 100 }] },
  { id: "kale", name: "Kale", category: "Vegetables", per100g: { calories: 35, protein: 2.9, carbs: 4.4, fat: 1.5, fiber: 4.1 }, commonServings: [{ label: "1 cup (67g)", grams: 67 }, { label: "100g", grams: 100 }] },
  { id: "cucumber", name: "Cucumber", category: "Vegetables", per100g: { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5 }, commonServings: [{ label: "½ cucumber (150g)", grams: 150 }, { label: "100g", grams: 100 }] },
  { id: "carrots", name: "Carrots", category: "Vegetables", per100g: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, sugar: 4.7 }, commonServings: [{ label: "1 medium (80g)", grams: 80 }, { label: "100g", grams: 100 }] },
  { id: "bell-pepper", name: "Bell Pepper", category: "Vegetables", per100g: { calories: 31, protein: 1, carbs: 6, fat: 0.3, fiber: 2.1, sugar: 4.2 }, commonServings: [{ label: "1 pepper (120g)", grams: 120 }, { label: "100g", grams: 100 }] },
  { id: "tomato", name: "Tomato", category: "Vegetables", per100g: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, sugar: 2.6 }, commonServings: [{ label: "1 medium (120g)", grams: 120 }, { label: "100g", grams: 100 }] },
  { id: "mushrooms", name: "Mushrooms", category: "Vegetables", per100g: { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, fiber: 1 }, commonServings: [{ label: "1 cup (96g)", grams: 96 }, { label: "100g", grams: 100 }] },

  // Dairy
  { id: "milk-whole", name: "Whole Milk", category: "Eggs & Dairy", per100g: { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, sugar: 4.8 }, commonServings: [{ label: "1 cup (244ml)", grams: 244 }, { label: "100ml", grams: 100 }] },
  { id: "milk-skimmed", name: "Skimmed Milk", category: "Eggs & Dairy", per100g: { calories: 35, protein: 3.4, carbs: 5, fat: 0.1, sugar: 5 }, commonServings: [{ label: "1 cup (244ml)", grams: 244 }, { label: "100ml", grams: 100 }] },
  { id: "cheddar-cheese", name: "Cheddar Cheese", category: "Eggs & Dairy", per100g: { calories: 402, protein: 25, carbs: 1.3, fat: 33, sodium: 621 }, commonServings: [{ label: "1 slice (28g)", grams: 28 }, { label: "50g", grams: 50 }] },
  { id: "butter", name: "Butter", category: "Oils & Fats", per100g: { calories: 717, protein: 0.9, carbs: 0.1, fat: 81, sodium: 714 }, commonServings: [{ label: "1 tsp (5g)", grams: 5 }, { label: "1 tbsp (14g)", grams: 14 }] },

  // Misc / Sauces
  { id: "honey", name: "Honey", category: "Sweeteners", per100g: { calories: 304, protein: 0.3, carbs: 82, fat: 0, sugar: 82 }, commonServings: [{ label: "1 tsp (7g)", grams: 7 }, { label: "1 tbsp (21g)", grams: 21 }] },
  { id: "protein-bar", name: "Protein Bar (Generic)", category: "Supplements", per100g: { calories: 385, protein: 30, carbs: 40, fat: 12, fiber: 5, sugar: 18 }, commonServings: [{ label: "1 bar (60g)", grams: 60 }] },
]

export function searchFoods(query: string, category?: string, limit = 20): FoodItem[] {
  const q = query.toLowerCase().trim()
  let results = FOOD_DATABASE

  if (category) {
    results = results.filter((f) => f.category.toLowerCase() === category.toLowerCase())
  }

  if (q) {
    results = results.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        (f.brand && f.brand.toLowerCase().includes(q))
    )
  }

  return results.slice(0, limit)
}

export function getFoodById(id: string): FoodItem | undefined {
  return FOOD_DATABASE.find((f) => f.id === id)
}

export const FOOD_CATEGORIES = [...new Set(FOOD_DATABASE.map((f) => f.category))].sort()
