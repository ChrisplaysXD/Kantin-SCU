import { ActivityLevel, HealthGoal } from '@prisma/client'


const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
}

// Mifflin-St Jeor equation
export function calculateBMR(weight: number, height: number, age: number, gender: 'MALE' | 'FEMALE'): number {
  if (gender === 'MALE') {
    return 10 * weight + 6.25 * height - 5 * age + 5
  }
  return 10 * weight + 6.25 * height - 5 * age - 161
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
}

export function getTargetCalories(tdee: number, goal: HealthGoal): number {
  switch (goal) {
    case 'LOSE': return tdee - 500
    case 'GAIN': return tdee + 500
    default: return tdee
  }
}


interface NutritionData {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

interface DailyIntake extends NutritionData {
  date: string
}

interface MenuItem {
  id: string
  name: string
  calories: number | null
  protein: number | null
  carbs: number | null
  fat: number | null
  fiber: number | null
  price: number
  category: string
  isAvailable: boolean
  seller?: { name: string; canteen?: { name: string } }
}

interface Recommendation {
  menuItem: MenuItem
  score: number
  reasons: string[]
}

export function getRecommendations(
  availableItems: MenuItem[],
  recentIntake: DailyIntake[],
  targetCalories: number,
  todayIntake: NutritionData
): Recommendation[] {
  const remaining = {
    calories: Math.max(0, targetCalories - todayIntake.calories),
    protein: Math.max(0, 60 - todayIntake.protein),  // target ~60g
    carbs: Math.max(0, 300 - todayIntake.carbs),      // target ~300g
    fat: Math.max(0, 65 - todayIntake.fat),            // target ~65g
    fiber: Math.max(0, 25 - todayIntake.fiber),        // target ~25g
  }

  const recentCategories = new Set<string>()
  // track apa yg udh dimakan buat variasi
  // ini simplified, cuma liat dari recent orders

  const scored: Recommendation[] = availableItems
    .filter(item => item.isAvailable && item.calories != null)
    .map(item => {
      let score = 0
      const reasons: string[] = []

      const cal = item.calories ?? 0
      const pro = item.protein ?? 0
      const carb = item.carbs ?? 0
      const f = item.fat ?? 0
      const fib = item.fiber ?? 0

      // calorie budget check — kalo melebihi budget, penalty
      if (cal <= remaining.calories) {
        score += 30
        reasons.push(`Masih dalam budget kalori harianmu (sisa ${remaining.calories} kcal)`)
      } else if (cal <= remaining.calories + 200) {
        score += 10
      } else {
        score -= 20
      }

      // protein gap
      if (remaining.protein > 15 && pro >= 15) {
        score += 25
        reasons.push(`Tinggi protein (${pro}g) — kamu masih butuh ${Math.round(remaining.protein)}g lagi hari ini`)
      }

      // fiber gap
      if (remaining.fiber > 5 && fib >= 3) {
        score += 20
        reasons.push(`Sumber serat yang baik (${fib}g)`)
      }

      // low fat bonus kalo udh kebanyakan lemak
      if (remaining.fat < 10 && f < 10) {
        score += 15
        reasons.push('Rendah lemak — cocok karena asupan lemakmu hari ini sudah cukup')
      }

      // variety bonus
      if (!recentCategories.has(item.category)) {
        score += 5
      }

      return { menuItem: item, score, reasons }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, 5)
}
