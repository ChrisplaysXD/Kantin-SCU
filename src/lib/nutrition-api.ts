const API_URL = 'https://api.calorieninjas.com/v1/nutrition'

interface NutritionResult {
  name: string
  calories: number
  protein_g: number
  carbohydrates_total_g: number
  fat_total_g: number
  fiber_g: number
  serving_size_g: number
}

interface DetectionResult {
  found: boolean
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
  rawName: string | null
}

export async function detectNutrition(foodName: string): Promise<DetectionResult> {
  const apiKey = process.env.CALORIENINJAS_API_KEY
  if (!apiKey || apiKey === 'YOUR_CALORIENINJAS_API_KEY') {
    return { found: false, calories: null, protein: null, carbs: null, fat: null, fiber: null, rawName: null }
  }

  try {
    const res = await fetch(`${API_URL}?query=${encodeURIComponent(foodName)}`, {
      headers: { 'X-Api-Key': apiKey },
    })

    if (!res.ok) {
      console.log('calorieninjas api error:', res.status)
      return { found: false, calories: null, protein: null, carbs: null, fat: null, fiber: null, rawName: null }
    }

    const data = await res.json()
    const items: NutritionResult[] = data.items

    if (!items || items.length === 0) {
      return { found: false, calories: null, protein: null, carbs: null, fat: null, fiber: null, rawName: null }
    }

    // kalo ada multiple items, sum semuanya (misal "nasi goreng ayam" -> nasi goreng + ayam)
    const totals = items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein_g,
        carbs: acc.carbs + item.carbohydrates_total_g,
        fat: acc.fat + item.fat_total_g,
        fiber: acc.fiber + item.fiber_g,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    )

    return {
      found: true,
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10,
      rawName: items.map(i => i.name).join(' + '),
    }
  } catch (err) {
    console.log('error fetching nutrition data:', err)
    return { found: false, calories: null, protein: null, carbs: null, fat: null, fiber: null, rawName: null }
  }
}
