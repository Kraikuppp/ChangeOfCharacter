import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { calculateBMI, calculateBMR, calculateTDEE, calculateProteinNeeds, getBMICategory } from '../lib/calculations'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Utensils, Dumbbell, Flame, Target, TrendingUp, Calendar as CalendarIcon, X, User, Search, Loader2 } from 'lucide-react'
import Profile from './Profile'
import { searchFood, searchLocalDB } from '../lib/nutritionix'

const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

function formatThaiDate(date) {
  const day = thaiDays[date.getDay()]
  const month = thaiMonths[date.getMonth()]
  return `${day}, ${date.getDate()} ${month} ${date.getFullYear() + 543}`
}

function formatThaiMonthYear(date) {
  const month = thaiMonths[date.getMonth()]
  return `${month} ${date.getFullYear() + 543}`
}

export default function Dashboard({ session }) {
  const [userProfile, setUserProfile] = useState(null)
  const [stats, setStats] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dailyLog, setDailyLog] = useState({ foods: [], exercises: [] })
  const [showAddFood, setShowAddFood] = useState(false)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showProfile, setShowProfile] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [foodSearchQuery, setFoodSearchQuery] = useState('')
  const [foodSuggestions, setFoodSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const searchTimeoutRef = useRef(null)

  const [newFood, setNewFood] = useState({ name: '', calories: '', protein: '' })
  const [newExercise, setNewExercise] = useState({ name: '', calories: '', duration: '' })

  // ค้นหาอาหารอัตโนมัติเมื่อพิมพ์
  const handleFoodSearch = async (query) => {
    setFoodSearchQuery(query)
    setNewFood({ ...newFood, name: query })
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 2) {
      setFoodSuggestions([])
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true)
      
      // ค้นหาจาก local DB ก่อน
      const localResults = searchLocalDB(query)
      setFoodSuggestions(localResults)
      
      // ถ้าไม่เจอใน local ให้ค้นหาจาก API
      if (localResults.length === 0) {
        const apiResult = await searchFood(query)
        if (apiResult) {
          setFoodSuggestions([apiResult])
        }
      }
      
      setSearching(false)
    }, 500)
  }

  // เลือกอาหารจาก suggestion
  const selectFood = (food) => {
    setNewFood({
      name: food.name,
      calories: food.calories.toString(),
      protein: food.protein?.toString() || ''
    })
    setFoodSuggestions([])
    setFoodSearchQuery(food.name)
  }

  useEffect(() => {
    fetchUserProfile()
  }, [session])

  useEffect(() => {
    if (userProfile) {
      calculateStats()
      fetchDailyLog()
    }
  }, [userProfile, selectedDate])

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setUserProfile(data)
        setAvatarUrl(data.avatar_url)
      } else {
        setUserProfile({
          username: user.user_metadata.username,
          gender: user.user_metadata.gender,
          weight: user.user_metadata.weight,
          height: user.user_metadata.height,
          age: user.user_metadata.age,
          activity_level: user.user_metadata.activity_level,
          goal: user.user_metadata.goal
        })
      }
    }
  }

  const calculateStats = () => {
    const bmi = calculateBMI(userProfile.weight, userProfile.height)
    const bmr = calculateBMR(userProfile.weight, userProfile.height, userProfile.age, userProfile.gender)
    const tdee = calculateTDEE(bmr, userProfile.activity_level)
    const protein = calculateProteinNeeds(userProfile.weight, userProfile.goal)
    const bmiCategory = getBMICategory(bmi)

    let targetCalories = parseInt(tdee)
    if (userProfile.goal === 'lose_weight') targetCalories -= 500
    else if (userProfile.goal === 'lose_fat') targetCalories -= 300
    else if (userProfile.goal === 'build_muscle') targetCalories += 300

    setStats({
      bmi,
      bmr,
      tdee,
      protein,
      targetCalories,
      bmiCategory
    })
  }

  const fetchDailyLog = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('No user found')
      return
    }
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    console.log('Fetching logs for date:', dateStr, 'user:', user.id)

    const { data: foods, error: foodError } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr)

    if (foodError) {
      console.error('Error fetching foods:', foodError)
    } else {
      console.log('Foods fetched:', foods)
    }

    const { data: exercises, error: exerciseError } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', dateStr)

    if (exerciseError) {
      console.error('Error fetching exercises:', exerciseError)
    } else {
      console.log('Exercises fetched:', exercises)
    }

    setDailyLog({
      foods: foods || [],
      exercises: exercises || []
    })
  }

  const addFood = async (e) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('food_logs').insert({
      user_id: user.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      name: newFood.name,
      calories: parseInt(newFood.calories),
      protein: parseFloat(newFood.protein) || 0
    })

    if (!error) {
      setNewFood({ name: '', calories: '', protein: '' })
      setShowAddFood(false)
      fetchDailyLog()
    }
  }

  const addExercise = async (e) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('exercise_logs').insert({
      user_id: user.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      name: newExercise.name,
      calories: parseInt(newExercise.calories),
      duration: parseInt(newExercise.duration)
    })

    if (!error) {
      setNewExercise({ name: '', calories: '', duration: '' })
      setShowAddExercise(false)
      fetchDailyLog()
    }
  }

  const deleteFood = async (id) => {
    await supabase.from('food_logs').delete().eq('id', id)
    fetchDailyLog()
  }

  const deleteExercise = async (id) => {
    await supabase.from('exercise_logs').delete().eq('id', id)
    fetchDailyLog()
  }

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }

  const getTotalCalories = () => {
    const foodCalories = dailyLog.foods.reduce((sum, food) => sum + food.calories, 0)
    const exerciseCalories = dailyLog.exercises.reduce((sum, ex) => sum + ex.calories, 0)
    return { consumed: foodCalories, burned: exerciseCalories, net: foodCalories - exerciseCalories }
  }

  const getTotalProtein = () => {
    return dailyLog.foods.reduce((sum, food) => sum + (food.protein || 0), 0)
  }

  const calorieStats = getTotalCalories()
  const totalProtein = getTotalProtein()

  if (showProfile) {
    return <Profile session={session} onBack={() => {
      setShowProfile(false)
      fetchUserProfile()
    }} />
  }

  if (!userProfile || !stats) {
    return null
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Gradient fade from top */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
      
      {/* Avatar button - responsive positioning */}
      <div className="fixed top-4 right-4 z-50 md:absolute md:top-6 md:right-6">
        <button
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden shadow-lg hover:scale-105 transition-transform border-2 border-white"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
          )}
        </button>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 pt-20 md:pt-28">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'dashboard' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            แดชบอร์ด
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'calendar' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            ปฏิทิน
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-sm text-gray-500">BMI</span>
                </div>
                <p className={`text-2xl font-bold ${stats.bmiCategory.color}`}>{stats.bmi}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.bmiCategory.category}</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-sm text-gray-500">BMR</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.bmr}</p>
                <p className="text-xs text-gray-400 mt-1">แคลอรี่/วัน</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-sm text-gray-500">TDEE</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.tdee}</p>
                <p className="text-xs text-gray-400 mt-1">แคลอรี่/วัน</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Dumbbell className="w-5 h-5 text-purple-500" />
                  <span className="text-sm text-gray-500">Protein</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">{stats.protein}g</p>
                <p className="text-xs text-gray-400 mt-1">เป้าหมาย/วัน</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  {formatThaiDate(selectedDate)}
                </h2>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CalendarIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-primary/10 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">บริโภค</p>
                  <p className="text-xl font-bold text-primary">{calorieStats.consumed}</p>
                  <p className="text-xs text-gray-400">แคลอรี่</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">เผาผลาญ</p>
                  <p className="text-xl font-bold text-orange-600">{calorieStats.burned}</p>
                  <p className="text-xs text-gray-400">แคลอรี่</p>
                </div>
                <div className="text-center p-4 bg-secondary/10 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1">สุทธิ</p>
                  <p className="text-xl font-bold text-secondary">{calorieStats.net}</p>
                  <p className="text-xs text-gray-400">/ {stats.targetCalories}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">ความคืบหน้าโปรตีน</span>
                  <span className="text-sm font-medium text-gray-800">{totalProtein.toFixed(1)}g / {stats.protein}g</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all"
                    style={{ width: `${Math.min((totalProtein / stats.protein) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">ความคืบหน้าแคลอรี่</span>
                  <span className="text-sm font-medium text-gray-800">{calorieStats.net} / {stats.targetCalories}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      calorieStats.net > stats.targetCalories ? 'bg-red-500' : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min((calorieStats.net / stats.targetCalories) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-gray-800">อาหาร</h3>
                  </div>
                  <button
                    onClick={() => setShowAddFood(true)}
                    className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {dailyLog.foods.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">ยังไม่มีบันทึกอาหารวันนี้</p>
                ) : (
                  <div className="space-y-2">
                    {dailyLog.foods.map(food => (
                      <div key={food.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{food.name}</p>
                          <p className="text-xs text-gray-500">{food.calories} แคล | {food.protein || 0}g โปรตีน</p>
                        </div>
                        <button
                          onClick={() => deleteFood(food.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-orange-500" />
                    <h3 className="font-bold text-gray-800">ออกกำลังกาย</h3>
                  </div>
                  <button
                    onClick={() => setShowAddExercise(true)}
                    className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {dailyLog.exercises.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">ยังไม่มีบันทึกการออกกำลังกายวันนี้</p>
                ) : (
                  <div className="space-y-2">
                    {dailyLog.exercises.map(exercise => (
                      <div key={exercise.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-800">{exercise.name}</p>
                          <p className="text-xs text-gray-500">{exercise.calories} แคล | {exercise.duration} นาที</p>
                        </div>
                        <button
                          onClick={() => deleteExercise(exercise.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">
                {formatThaiMonthYear(currentDate)}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {getDaysInMonth().map((day, index) => {
                const isSelected = isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedDate(day)
                      setActiveTab('dashboard')
                    }}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all
                      ${isSelected ? 'bg-primary text-white' : ''}
                      ${isToday && !isSelected ? 'bg-primary/20 text-primary' : ''}
                      ${!isSelected && !isToday ? 'hover:bg-gray-50' : ''}
                    `}
                  >
                    <span className="font-medium">{format(day, 'd')}</span>
                  </button>
                )
              })}
            </div>

            <p className="text-center text-gray-500 mt-4 text-sm">
              คลิกที่วันที่เพื่อดูและแก้ไขบันทึกของวันนั้น
            </p>
          </div>
        )}
      </main>

      {showAddFood && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">เพิ่มอาหาร</h3>
            <form onSubmit={addFood} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่ออาหาร</label>
                <div className="relative">
                  <input
                    type="text"
                    value={newFood.name}
                    onChange={(e) => handleFoodSearch(e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="พิมพ์ชื่ออาหาร เช่น ข้าวกะเพรา, อกไก่"
                    required
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                  )}
                  {!searching && newFood.name.length >= 2 && (
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  )}
                </div>
                
                {/* Suggestions dropdown */}
                {foodSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {foodSuggestions.map((food, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectFood(food)}
                        className="w-full px-4 py-3 text-left hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-0"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800">{food.name}</span>
                          <span className="text-sm text-primary">{food.calories} kcal</span>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-500 mt-1">
                          <span>{food.serving}</span>
                          {food.protein && <span>โปรตีน {food.protein}g</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">แคลอรี่</label>
                  <input
                    type="number"
                    value={newFood.calories}
                    onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="kcal"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">โปรตีน (กรัม)</label>
                  <input
                    type="number"
                    value={newFood.protein}
                    onChange={(e) => setNewFood({ ...newFood, protein: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="กรัม"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
              
              <p className="text-xs text-gray-400 bg-gray-50 p-3 rounded-lg">
                💡 เคล็ดลับ: พิมพ์ชื่ออาหารแล้วระบบจะดึงข้อมูลแคลอรี่และโปรตีนให้อัตโนมัติ
              </p>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddFood(false)
                    setFoodSuggestions([])
                    setFoodSearchQuery('')
                  }}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark"
                >
                  เพิ่มอาหาร
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-4">เพิ่มการออกกำลังกาย</h3>
            <form onSubmit={addExercise} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อการออกกำลังกาย</label>
                <input
                  type="text"
                  value={newExercise.name}
                  onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="เช่น วิ่ง"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">แคลอรี่ที่เผาผลาญ</label>
                  <input
                    type="number"
                    value={newExercise.calories}
                    onChange={(e) => setNewExercise({ ...newExercise, calories: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="kcal"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลา (นาที)</label>
                  <input
                    type="number"
                    value={newExercise.duration}
                    onChange={(e) => setNewExercise({ ...newExercise, duration: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="นาที"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddExercise(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600"
                >
                  เพิ่มการออกกำลังกาย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
