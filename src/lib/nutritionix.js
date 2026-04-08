// Nutritionix API - ใช้สำหรับดึงข้อมูลโภชนาการอาหาร
// สมัคร API key ได้ที่: https://developer.nutritionix.com/

const NUTRITIONIX_APP_ID = import.meta.env.VITE_NUTRITIONIX_APP_ID
const NUTRITIONIX_APP_KEY = import.meta.env.VITE_NUTRITIONIX_APP_KEY

export async function searchFood(query) {
  if (!NUTRITIONIX_APP_ID || !NUTRITIONIX_APP_KEY) {
    console.warn('Nutritionix API keys not configured')
    return null
  }

  try {
    const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': NUTRITIONIX_APP_ID,
        'x-app-key': NUTRITIONIX_APP_KEY,
      },
      body: JSON.stringify({
        query: query,
        timezone: 'Asia/Bangkok'
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0]
      return {
        name: food.food_name,
        calories: Math.round(food.nf_calories),
        protein: Math.round(food.nf_protein * 10) / 10,
        carbs: Math.round(food.nf_total_carbohydrate * 10) / 10,
        fat: Math.round(food.nf_total_fat * 10) / 10,
        serving: `${food.serving_qty} ${food.serving_unit}`,
        photo: food.photo?.thumb || null
      }
    }

    return null
  } catch (error) {
    console.error('Nutritionix API error:', error)
    return null
  }
}

// ค้นหาอาหารหลายรายการ
export async function searchFoods(query) {
  if (!NUTRITIONIX_APP_ID || !NUTRITIONIX_APP_KEY) {
    return []
  }

  try {
    const response = await fetch('https://trackapi.nutritionix.com/v2/search/instant', {
      method: 'GET',
      headers: {
        'x-app-id': NUTRITIONIX_APP_ID,
        'x-app-key': NUTRITIONIX_APP_KEY,
      },
      params: {
        query: query
      }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return data.common?.slice(0, 5).map(item => ({
      name: item.food_name,
      photo: item.photo?.thumb || null
    })) || []
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

// รายการอาหารไทยที่ใช้บ่อย (fallback เมื่อไม่มี API)
export const thaiFoodsDB = [
  { name: 'ข้าวขาว', calories: 180, protein: 4, serving: '1 ทัพพี' },
  { name: 'ข้าวกะเพราหมู', calories: 450, protein: 25, serving: '1 จาน' },
  { name: 'ข้าวผัด', calories: 400, protein: 12, serving: '1 จาน' },
  { name: 'ผัดไทย', calories: 380, protein: 15, serving: '1 จาน' },
  { name: 'ต้มยำกุ้ง', calories: 120, protein: 18, serving: '1 ถ้วย' },
  { name: 'ส้มตำ', calories: 150, protein: 3, serving: '1 จาน' },
  { name: 'ไข่เจียว', calories: 200, protein: 14, serving: '1 ฟอง' },
  { name: 'ไข่ต้ม', calories: 78, protein: 6, serving: '1 ฟอง' },
  { name: 'อกไก่ต้ม', calories: 165, protein: 31, serving: '100g' },
  { name: 'หมูย่าง', calories: 250, protein: 28, serving: '100g' },
  { name: 'กะเพราไก่', calories: 350, protein: 22, serving: '1 จาน' },
  { name: 'ราดหน้า', calories: 380, protein: 18, serving: '1 จาน' },
  { name: 'ข้าวมันไก่', calories: 420, protein: 28, serving: '1 จาน' },
  { name: 'ก๋วยเตี๋ยวน้ำ', calories: 250, protein: 12, serving: '1 ถ้วย' },
  { name: 'บะหมี่', calories: 300, protein: 10, serving: '1 ถ้วย' },
  { name: 'ข้าวซอยไก่', calories: 480, protein: 24, serving: '1 จาน' },
  { name: 'แกงเขียวหวาน', calories: 280, protein: 15, serving: '1 ถ้วย' },
  { name: 'มัสมัน', calories: 350, protein: 12, serving: '1 ถ้วย' },
  { name: 'ข้าวเหนียว', calories: 180, protein: 4, serving: '1 ห่อ' },
  { name: 'ลาบหมู', calories: 300, protein: 22, serving: '1 จาน' },
  { name: 'ส้มตำไทย', calories: 120, protein: 3, serving: '1 จาน' },
  { name: 'ชานมไข่มุก', calories: 350, protein: 4, serving: '1 แก้ว' },
  { name: 'กาแฟเย็น', calories: 180, protein: 2, serving: '1 แก้ว' },
  { name: 'นมถั่วเหลือง', calories: 80, protein: 6, serving: '1 แก้ว' },
]

// ค้นหาใน local database
export function searchLocalDB(query) {
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '')
  
  return thaiFoodsDB.filter(food => 
    food.name.toLowerCase().replace(/\s+/g, '').includes(normalizedQuery) ||
    normalizedQuery.includes(food.name.toLowerCase().replace(/\s+/g, ''))
  )
}
