import { NextRequest, NextResponse } from "next/server"
import { getDevSession } from "@/lib/dev-auth"
import { searchFoods, getFoodById, FOOD_CATEGORIES } from "@/lib/food-database"

// GET /api/nutrition/foods?q=chicken&category=Meat&limit=20
export async function GET(req: NextRequest) {
  const session = await getDevSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") ?? ""
  const category = searchParams.get("category") ?? undefined
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50)
  const id = searchParams.get("id")

  if (id) {
    const food = getFoodById(id)
    if (!food) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ food })
  }

  const foods = searchFoods(q, category, limit)
  return NextResponse.json({ foods, categories: FOOD_CATEGORIES, total: foods.length })
}
