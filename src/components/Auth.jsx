import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { UserPlus, LogIn, Mail, Lock, User, Eye, EyeOff, Check, X } from 'lucide-react'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    gender: 'male',
    weight: '',
    height: '',
    age: '',
    activityLevel: 'moderate',
    goal: 'maintain',
    agreeTerms: false
  })

  const passwordValidations = {
    minLength: formData.password.length >= 8,
    hasUpper: /[A-Z]/.test(formData.password),
    hasLower: /[a-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
  }

  const isPasswordValid = Object.values(passwordValidations).every(Boolean)

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!isPasswordValid) {
      setMessage('กรุณาตั้งรหัสผ่านให้ตรงตามเงื่อนไข')
      return
    }
    if (!formData.agreeTerms) {
      setMessage('กรุณายอมรับข้อกำหนดและเงื่อนไข')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            gender: formData.gender,
            weight: parseFloat(formData.weight),
            height: parseFloat(formData.height),
            age: parseInt(formData.age),
            activity_level: formData.activityLevel,
            goal: formData.goal
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setMessage('อีเมลนี้ถูกลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ')
      } else {
        setMessage('กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี!')
        setIsSignUp(false)
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error
    } catch (error) {
      setMessage('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const activityLevels = [
    { value: 'sedentary', label: 'ไม่ค่อยออกกำลังกาย' },
    { value: 'light', label: 'ออกกำลังกายเล็กน้อย (1-3 วัน/สัปดาห์)' },
    { value: 'moderate', label: 'ออกกำลังกายปานกลาง (3-5 วัน/สัปดาห์)' },
    { value: 'active', label: 'ออกกำลังกายมาก (6-7 วัน/สัปดาห์)' },
    { value: 'very_active', label: 'ออกกำลังกายหนักมาก (2 ครั้ง/วัน)' }
  ]

  const goals = [
    { value: 'maintain', label: 'รักษาน้ำหนัก', icon: '⚖️' },
    { value: 'lose_weight', label: 'ลดน้ำหนัก', icon: '🏃' },
    { value: 'lose_fat', label: 'ลดไขมัน / เฟ้นร่าง', icon: '💪' },
    { value: 'build_muscle', label: 'เพิ่มกล้ามเนื้อ', icon: '🏋️' }
  ]

  const nextStep = () => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.username) {
        setMessage('กรุณากรอกข้อมูลให้ครบถ้วน')
        return
      }
      if (!isPasswordValid) {
        setMessage('กรุณาตั้งรหัสผ่านให้ตรงตามเงื่อนไข')
        return
      }
    }
    setStep(step + 1)
    setMessage('')
  }

  const prevStep = () => {
    setStep(step - 1)
    setMessage('')
  }

  const toggleAuthMode = () => {
    setIsAnimating(true)
    setTimeout(() => {
      setIsSignUp(!isSignUp)
      setStep(1)
      setMessage('')
      setFormData({
        email: '',
        password: '',
        username: '',
        gender: 'male',
        weight: '',
        height: '',
        age: '',
        activityLevel: 'moderate',
        goal: 'maintain',
        agreeTerms: false
      })
      setIsAnimating(false)
    }, 300)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 mb-4 shadow-lg animate-bounce-slow overflow-hidden">
            <img src="/logo.png" alt="CHocH" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">CHocH</h1>
          <p className="text-gray-500 mt-1">Change of Character</p>
        </div>

        <div className={`bg-white rounded-2xl shadow-xl p-6 md:p-8 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {isSignUp ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">สร้างบัญชีใหม่</h2>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-emerald-500 w-4' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>

              <form onSubmit={step === 3 ? handleSignUp : (e) => { e.preventDefault(); nextStep(); }}>
                {step === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.username}
                          onChange={(e) => updateFormData('username', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="กรอกชื่อผู้ใช้"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="ตั้งรหัสผ่าน"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <p className="text-sm font-medium text-gray-700">เงื่อนไขรหัสผ่าน:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className={`flex items-center gap-1 transition-colors ${passwordValidations.minLength ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {passwordValidations.minLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>อย่างน้อย 8 ตัว</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-colors ${passwordValidations.hasUpper ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {passwordValidations.hasUpper ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>ตัวพิมพ์ใหญ่ 1 ตัว</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-colors ${passwordValidations.hasLower ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {passwordValidations.hasLower ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>ตัวพิมพ์เล็ก 1 ตัว</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-colors ${passwordValidations.hasNumber ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {passwordValidations.hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>ตัวเลข 1 ตัว</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-colors ${passwordValidations.hasSpecial ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {passwordValidations.hasSpecial ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>อักขระพิเศษ 1 ตัว</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
                        <select
                          value={formData.gender}
                          onChange={(e) => updateFormData('gender', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          <option value="male">ชาย</option>
                          <option value="female">หญิง</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">อายุ</label>
                        <input
                          type="number"
                          value={formData.age}
                          onChange={(e) => updateFormData('age', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="ปี"
                          min="1"
                          max="120"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนัก (กก.)</label>
                        <input
                          type="number"
                          value={formData.weight}
                          onChange={(e) => updateFormData('weight', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="กก."
                          step="0.1"
                          min="1"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ส่วนสูง (ซม.)</label>
                        <input
                          type="number"
                          value={formData.height}
                          onChange={(e) => updateFormData('height', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          placeholder="ซม."
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ระดับการออกกำลังกาย</label>
                      <select
                        value={formData.activityLevel}
                        onChange={(e) => updateFormData('activityLevel', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      >
                        {activityLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">เป้าหมายของคุณคืออะไร?</label>
                      <div className="grid grid-cols-2 gap-3">
                        {goals.map(goal => (
                          <button
                            key={goal.value}
                            type="button"
                            onClick={() => updateFormData('goal', goal.value)}
                            className={`p-4 rounded-xl border-2 text-center transition-all ${
                              formData.goal === goal.value
                                ? 'border-emerald-500 bg-emerald-50 scale-105'
                                : 'border-gray-200 hover:border-emerald-300'
                            }`}
                          >
                            <span className="text-2xl mb-1 block">{goal.icon}</span>
                            <span className="text-sm font-medium">{goal.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.agreeTerms}
                          onChange={(e) => updateFormData('agreeTerms', e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-gray-600">
                          ฉันยอมรับข้อกำหนดและเงื่อนไขการใช้บริการ และเข้าใจว่าข้อมูลสุขภาพของฉันจะถูกเก็บอย่างปลอดภัย
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {message && (
                  <div className={`mt-4 p-3 rounded-lg text-sm animate-fadeIn ${
                    message.includes('กรุณาตรวจสอบอีเมล') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      ย้อนกลับ
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : step === 3 ? (
                      <><UserPlus className="w-5 h-5" /> สร้างบัญชี</>
                    ) : (
                      'ถัดไป'
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">ยินดีต้อนรับกลับ</h2>
              
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="กรอกรหัสผ่าน"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {message && (
                  <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 animate-fadeIn">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><LogIn className="w-5 h-5" /> เข้าสู่ระบบ</>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isSignUp ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}
              <button
                onClick={toggleAuthMode}
                className="ml-1 text-emerald-600 font-medium hover:text-emerald-700"
              >
                {isSignUp ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
