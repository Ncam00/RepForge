"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format, subDays, addDays } from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Target,
  Search,
  X,
  TrendingUp,
  Flame,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

// ---------- types ----------
interface FoodItem {
  id: string
  name: string
  brand?: string
  category: string
  per100g: { calories: number; protein: number; carbs: number; fat: number; fiber?: number; sugar?: number; sodium?: number }
  commonServings: { label: string; grams: number }[]
}

interface NutritionEntry {
  id: string
  mealType: string
  foodName: string
  brand?: string
  servingSize: number
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  notes?: string
}

interface DayTotals { calories: number; protein: number; carbs: number; fat: number; fiber: number; sugar: number; sodium: number }
interface NutritionGoal { calories: number; protein: number; carbs: number; fat: number; fiber?: number }

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const
const MEAL_LABELS: Record<string, string> = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snacks" }
const MEAL_COLORS: Record<string, string> = { breakfast: "text-yellow-500", lunch: "text-green-500", dinner: "text-blue-500", snack: "text-purple-500" }

// ---------- helpers ----------
function MacroRing({ value, goal, color, label, unit = "g" }: { value: number; goal: number; color: string; label: string; unit?: string }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
          <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={circ} strokeDashoffset={circ - dash} strokeLinecap="round" className={color} style={{ transition: "stroke-dashoffset 0.5s ease" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">{Math.round(pct)}%</span>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold">{Math.round(value)}{unit}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {goal > 0 && <div className="text-xs text-muted-foreground">/ {goal}{unit}</div>}
      </div>
    </div>
  )
}

// ---------- main page ----------
export default function NutritionPage() {
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const dateKey = format(selectedDate, "yyyy-MM-dd")

  // food-add dialog state
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addMealType, setAddMealType] = useState<string>("breakfast")
  const [foodSearch, setFoodSearch] = useState("")
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [servingGrams, setServingGrams] = useState(100)
  const [addNotes, setAddNotes] = useState("")

  // goals dialog state
  const [showGoalsDialog, setShowGoalsDialog] = useState(false)
  const [goalCalories, setGoalCalories] = useState("")
  const [goalProtein, setGoalProtein] = useState("")
  const [goalCarbs, setGoalCarbs] = useState("")
  const [goalFat, setGoalFat] = useState("")

  // trend period
  const [trendDays, setTrendDays] = useState(7)

  // ---------- queries ----------
  const { data: dayData } = useQuery({
    queryKey: ["nutrition", dateKey],
    queryFn: () => fetch(`/api/nutrition?date=${new Date(dateKey).toISOString()}`).then((r) => r.json()),
  })

  const { data: goalData } = useQuery({
    queryKey: ["nutrition-goals"],
    queryFn: () => fetch("/api/nutrition/goals").then((r) => r.json()),
  })

  const { data: summaryData } = useQuery({
    queryKey: ["nutrition-summary", trendDays],
    queryFn: () => fetch(`/api/nutrition/summary?days=${trendDays}`).then((r) => r.json()),
  })

  const { data: foodResults } = useQuery({
    queryKey: ["food-search", foodSearch],
    queryFn: () => fetch(`/api/nutrition/foods?q=${encodeURIComponent(foodSearch)}&limit=10`).then((r) => r.json()),
    enabled: showAddDialog,
  })

  const entries: NutritionEntry[] = dayData?.entries ?? []
  const totals: DayTotals = dayData?.totals ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  const goal: NutritionGoal | null = goalData?.goal ?? null
  const trendData = summaryData?.trend ?? []

  // group entries by meal
  const byMeal = useMemo(() => {
    const map: Record<string, NutritionEntry[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
    for (const e of entries) map[e.mealType]?.push(e)
    return map
  }, [entries])

  // computed macros for selected food + serving
  const computedMacros = useMemo(() => {
    if (!selectedFood) return null
    const ratio = servingGrams / 100
    return {
      calories: Math.round(selectedFood.per100g.calories * ratio),
      protein: Math.round(selectedFood.per100g.protein * ratio * 10) / 10,
      carbs: Math.round(selectedFood.per100g.carbs * ratio * 10) / 10,
      fat: Math.round(selectedFood.per100g.fat * ratio * 10) / 10,
    }
  }, [selectedFood, servingGrams])

  // ---------- mutations ----------
  const addEntry = useMutation({
    mutationFn: (body: object) => fetch("/api/nutrition", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["nutrition"] }); queryClient.invalidateQueries({ queryKey: ["nutrition-summary"] }); resetAddDialog() },
  })

  const deleteEntry = useMutation({
    mutationFn: (id: string) => fetch(`/api/nutrition?id=${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["nutrition"] }); queryClient.invalidateQueries({ queryKey: ["nutrition-summary"] }) },
  })

  const saveGoals = useMutation({
    mutationFn: (body: object) => fetch("/api/nutrition/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["nutrition-goals"] }); setShowGoalsDialog(false) },
  })

  // ---------- handlers ----------
  function resetAddDialog() {
    setShowAddDialog(false)
    setFoodSearch("")
    setSelectedFood(null)
    setServingGrams(100)
    setAddNotes("")
  }

  function openGoalsDialog() {
    if (goal) {
      setGoalCalories(String(goal.calories))
      setGoalProtein(String(goal.protein))
      setGoalCarbs(String(goal.carbs))
      setGoalFat(String(goal.fat))
    }
    setShowGoalsDialog(true)
  }

  function handleAddEntry() {
    if (!selectedFood || !computedMacros) return
    const ratio = servingGrams / 100
    addEntry.mutate({
      date: new Date(dateKey).toISOString(),
      mealType: addMealType,
      foodName: selectedFood.name,
      brand: selectedFood.brand,
      servingSize: servingGrams,
      calories: computedMacros.calories,
      protein: computedMacros.protein,
      carbs: computedMacros.carbs,
      fat: computedMacros.fat,
      fiber: selectedFood.per100g.fiber ? Math.round(selectedFood.per100g.fiber * ratio * 10) / 10 : undefined,
      sugar: selectedFood.per100g.sugar ? Math.round(selectedFood.per100g.sugar * ratio * 10) / 10 : undefined,
      sodium: selectedFood.per100g.sodium ? Math.round(selectedFood.per100g.sodium * ratio) : undefined,
      notes: addNotes || undefined,
    })
  }

  function handleSaveGoals() {
    const cal = parseFloat(goalCalories)
    const pro = parseFloat(goalProtein)
    const carb = parseFloat(goalCarbs)
    const fat = parseFloat(goalFat)
    if (isNaN(cal) || isNaN(pro) || isNaN(carb) || isNaN(fat)) return
    saveGoals.mutate({ calories: cal, protein: pro, carbs: carb, fat })
  }

  const isToday = dateKey === format(new Date(), "yyyy-MM-dd")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nutrition</h1>
          <p className="text-muted-foreground">Track your daily food intake and macros</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openGoalsDialog}>
            <Target className="h-4 w-4 mr-2" />
            Set Goals
          </Button>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Food
          </Button>
        </div>
      </div>

      {/* Date navigator */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => setSelectedDate((d) => subDays(d, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-lg min-w-[160px] text-center">
          {isToday ? "Today" : format(selectedDate, "EEE, MMM d")}
        </span>
        <Button variant="outline" size="icon" onClick={() => setSelectedDate((d) => addDays(d, 1))} disabled={isToday}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Macro summary rings + calorie bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Calories card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-4xl font-bold">{Math.round(totals.calories)}</span>
              {goal && <span className="text-muted-foreground text-lg mb-1">/ {goal.calories} kcal</span>}
            </div>
            {goal && (
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min((totals.calories / goal.calories) * 100, 100)}%` }}
                />
              </div>
            )}
            {goal && (
              <div className="mt-2 text-sm text-muted-foreground">
                {totals.calories < goal.calories
                  ? `${Math.round(goal.calories - totals.calories)} kcal remaining`
                  : `${Math.round(totals.calories - goal.calories)} kcal over goal`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Macro rings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Macros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around">
              <MacroRing value={totals.protein} goal={goal?.protein ?? 0} color="text-blue-500" label="Protein" />
              <MacroRing value={totals.carbs} goal={goal?.carbs ?? 0} color="text-yellow-500" label="Carbs" />
              <MacroRing value={totals.fat} goal={goal?.fat ?? 0} color="text-red-500" label="Fat" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {MEAL_TYPES.map((meal) => {
          const items = byMeal[meal] ?? []
          const mealCals = items.reduce((s, e) => s + e.calories, 0)
          return (
            <Card key={meal}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={`capitalize flex items-center gap-2 ${MEAL_COLORS[meal]}`}>
                    {MEAL_LABELS[meal]}
                    {mealCals > 0 && <span className="text-sm text-muted-foreground font-normal">{Math.round(mealCals)} kcal</span>}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setAddMealType(meal); setShowAddDialog(true) }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No entries yet</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between text-sm group">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{entry.foodName}</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.servingSize}g · {Math.round(entry.calories)} kcal · P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={() => deleteEntry.mutate(entry.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Daily totals detail */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { label: "Protein", value: `${Math.round(totals.protein)}g`, icon: Beef, color: "text-blue-500" },
                { label: "Carbs", value: `${Math.round(totals.carbs)}g`, icon: Wheat, color: "text-yellow-500" },
                { label: "Fat", value: `${Math.round(totals.fat)}g`, icon: Droplets, color: "text-red-500" },
                { label: "Fibre", value: `${Math.round(totals.fiber)}g`, icon: TrendingUp, color: "text-green-500" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/40">
                  <Icon className={`h-5 w-5 ${color}`} />
                  <div className="text-xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trend</CardTitle>
              <CardDescription>
                {summaryData?.loggedDays ?? 0} days logged · avg {summaryData?.averages?.calories ?? 0} kcal/day
              </CardDescription>
            </div>
            <div className="flex gap-1">
              {[7, 14, 30].map((d) => (
                <Button key={d} variant={trendDays === d ? "default" : "outline"} size="sm" onClick={() => setTrendDays(d)}>
                  {d}d
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/40" />
              <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "MMM d")} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(v) => format(new Date(v as string), "EEE, MMM d")} formatter={(v: number) => [Math.round(v), ""]} />
              <Legend />
              <Area type="monotone" dataKey="calories" name="Calories" stroke="#f97316" fill="#f9731620" strokeWidth={2} />
              <Area type="monotone" dataKey="protein" name="Protein (g)" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
              <Area type="monotone" dataKey="carbs" name="Carbs (g)" stroke="#eab308" fill="#eab30820" strokeWidth={2} />
              <Area type="monotone" dataKey="fat" name="Fat (g)" stroke="#ef4444" fill="#ef444420" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* -------- ADD FOOD DIALOG -------- */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Add Food</h2>
              <Button variant="ghost" size="icon" onClick={resetAddDialog}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4 space-y-4">
              {/* Meal type */}
              <div>
                <Label>Meal</Label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {MEAL_TYPES.map((m) => (
                    <Button key={m} variant={addMealType === m ? "default" : "outline"} size="sm" onClick={() => setAddMealType(m)}>
                      {MEAL_LABELS[m]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Food search */}
              {!selectedFood ? (
                <div>
                  <Label>Search Food</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="e.g. chicken breast, oats..."
                      value={foodSearch}
                      onChange={(e) => setFoodSearch(e.target.value)}
                    />
                  </div>
                  <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                    {(foodResults?.foods ?? []).map((food: FoodItem) => (
                      <button
                        key={food.id}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                        onClick={() => { setSelectedFood(food); setServingGrams(food.commonServings[0]?.grams ?? 100) }}
                      >
                        <div className="font-medium text-sm">{food.name}</div>
                        <div className="text-xs text-muted-foreground">{food.category} · {food.per100g.calories} kcal / 100g · P {food.per100g.protein}g · C {food.per100g.carbs}g · F {food.per100g.fat}g</div>
                      </button>
                    ))}
                    {foodSearch && (foodResults?.foods?.length ?? 0) === 0 && (
                      <p className="text-sm text-muted-foreground px-3 py-2">No results found</p>
                    )}
                    {!foodSearch && (foodResults?.foods?.length ?? 0) === 0 && (
                      <p className="text-sm text-muted-foreground px-3 py-2">Start typing to search foods…</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected food */}
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                    <div>
                      <div className="font-semibold">{selectedFood.name}</div>
                      <div className="text-xs text-muted-foreground">{selectedFood.category}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFood(null)}>Change</Button>
                  </div>

                  {/* Quick serving buttons */}
                  <div>
                    <Label>Quick Serving</Label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {selectedFood.commonServings.map((s) => (
                        <Button key={s.label} variant={servingGrams === s.grams ? "default" : "outline"} size="sm" onClick={() => setServingGrams(s.grams)}>
                          {s.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom grams */}
                  <div>
                    <Label>Serving Size (g)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={servingGrams}
                      onChange={(e) => setServingGrams(parseFloat(e.target.value) || 0)}
                      className="mt-1 w-32"
                    />
                  </div>

                  {/* Computed macros preview */}
                  {computedMacros && (
                    <div className="grid grid-cols-4 gap-2 p-3 bg-muted/50 rounded-lg text-center text-sm">
                      <div><div className="font-bold text-orange-500">{computedMacros.calories}</div><div className="text-xs text-muted-foreground">kcal</div></div>
                      <div><div className="font-bold text-blue-500">{computedMacros.protein}g</div><div className="text-xs text-muted-foreground">Protein</div></div>
                      <div><div className="font-bold text-yellow-500">{computedMacros.carbs}g</div><div className="text-xs text-muted-foreground">Carbs</div></div>
                      <div><div className="font-bold text-red-500">{computedMacros.fat}g</div><div className="text-xs text-muted-foreground">Fat</div></div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Label>Notes (optional)</Label>
                    <Input value={addNotes} onChange={(e) => setAddNotes(e.target.value)} placeholder="Any notes..." className="mt-1" />
                  </div>

                  <Button className="w-full" onClick={handleAddEntry} disabled={addEntry.isPending || !servingGrams}>
                    {addEntry.isPending ? "Adding…" : "Add to Log"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------- GOALS DIALOG -------- */}
      {showGoalsDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Daily Nutrition Goals</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowGoalsDialog(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: "Calories (kcal)", value: goalCalories, set: setGoalCalories },
                { label: "Protein (g)", value: goalProtein, set: setGoalProtein },
                { label: "Carbs (g)", value: goalCarbs, set: setGoalCarbs },
                { label: "Fat (g)", value: goalFat, set: setGoalFat },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <Label>{label}</Label>
                  <Input type="number" min={0} value={value} onChange={(e) => set(e.target.value)} className="mt-1" />
                </div>
              ))}
              <Button className="w-full mt-2" onClick={handleSaveGoals} disabled={saveGoals.isPending}>
                {saveGoals.isPending ? "Saving…" : "Save Goals"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
