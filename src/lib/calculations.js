export function calculateBMI(weight, height) {
  const heightInMeters = height / 100
  return (weight / (heightInMeters * heightInMeters)).toFixed(1)
}

export function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return (88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)).toFixed(0)
  } else {
    return (447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)).toFixed(0)
  }
}

export function calculateTDEE(bmr, activityLevel) {
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  }
  return (bmr * activityMultipliers[activityLevel]).toFixed(0)
}

export function calculateProteinNeeds(weight, goal) {
  const proteinPerKg = {
    maintain: 1.6,
    lose_weight: 2.0,
    lose_fat: 2.2,
    build_muscle: 2.4
  }
  return (weight * proteinPerKg[goal]).toFixed(0)
}

export function getBMICategory(bmi) {
  if (bmi < 18.5) return { category: 'น้ำหนักน้อย', color: 'text-blue-500' }
  if (bmi < 25) return { category: 'น้ำหนักปกติ', color: 'text-emerald-500' }
  if (bmi < 30) return { category: 'น้ำหนักเกิน', color: 'text-yellow-500' }
  return { category: 'โรคอ้วน', color: 'text-red-500' }
}
