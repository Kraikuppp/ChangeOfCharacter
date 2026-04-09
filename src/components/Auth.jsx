import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { UserPlus, LogIn, Mail, Lock, User, Eye, EyeOff, Check, X, KeyRound, ArrowLeft } from 'lucide-react'

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetStep, setResetStep] = useState(1)
  const [resetEmail, setResetEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetSuccess, setResetSuccess] = useState(false)
  
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

  // Forgot password functions
  const handleSendOTP = async (e) => {
    e.preventDefault()
    if (!resetEmail) {
      setMessage('กรุณากรอกอีเมล')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setResetStep(2)
      setMessage('ส่งรหัส OTP ไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล')
    } catch (error) {
      setMessage(error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (!otpCode || !newPassword) {
      setMessage('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    if (newPassword.length < 8) {
      setMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Verify OTP and update password
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: resetEmail,
        token: otpCode,
        type: 'recovery'
      })

      if (verifyError) throw verifyError

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setResetSuccess(true)
      setMessage('เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่')
    } catch (error) {
      setMessage(error.message || 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ')
    } finally {
      setLoading(false)
    }
  }

  const backToSignIn = () => {
    setShowForgotPassword(false)
    setResetStep(1)
    setResetEmail('')
    setOtpCode('')
    setNewPassword('')
    setResetSuccess(false)
    setMessage('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="CHocH" className="w-16 h-16 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-bold text-gray-800">CHocH</h1>
          <p className="text-gray-500 mt-1">Change of Character</p>
        </div>

        <div className={`bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6 md:p-8 transition-all duration-300 ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          {showForgotPassword ? (
            <>
              <button
                type="button"
                onClick={backToSignIn}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              {resetSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Success!</h2>
                  <p className="text-gray-600 mb-6">{message}</p>
                  <button
                    onClick={backToSignIn}
                    className="w-full py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">Forgot Password</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    {resetStep === 1 
                      ? 'Enter your email to receive a password reset link' 
                      : 'Check your email for the reset link'}
                  </p>

                  {resetStep === 1 ? (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                      </div>

                      {message && (
                        <div className={`p-3 rounded-lg text-sm ${
                          message.includes('success') || message.includes('sent') || message.includes('OTP')
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {message}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-primary-darker text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><KeyRound className="w-5 h-5" /> Send Reset Link</>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-gray-600 mb-4">
                        We've sent a password reset link to <strong>{resetEmail}</strong>
                      </p>
                      <p className="text-gray-500 text-sm mb-6">
                        Click the link in the email to reset your password
                      </p>
                      <button
                        onClick={backToSignIn}
                        className="text-primary-dark hover:text-primary-darker font-medium"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : isSignUp ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">สร้างบัญชีใหม่</h2>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-primary w-4' : 'bg-gray-200'}`} />
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
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                          className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                        <div className={`flex items-center gap-1 transition-colors ${passwordValidations.minLength ? 'text-sky-600' : 'text-gray-400'}`}>
                          {passwordValidations.minLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>อย่างน้อย 8 ตัว</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-colors ${passwordValidations.hasUpper ? 'text-sky-600' : 'text-gray-400'}`}>
                          {passwordValidations.hasUpper ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>ตัวพิมพ์ใหญ่ 1 ตัว</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-colors ${passwordValidations.hasLower ? 'text-sky-600' : 'text-gray-400'}`}>
                          {passwordValidations.hasLower ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>ตัวพิมพ์เล็ก 1 ตัว</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-colors ${passwordValidations.hasNumber ? 'text-sky-600' : 'text-gray-400'}`}>
                          {passwordValidations.hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          <span>ตัวเลข 1 ตัว</span>
                        </div>
                        <div className={`flex items-center gap-1 transition-colors ${passwordValidations.hasSpecial ? 'text-sky-600' : 'text-gray-400'}`}>
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                                ? 'border-sky-500 bg-sky-50 scale-105'
                                : 'border-gray-200 hover:border-sky-300'
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
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-sky-500 focus:ring-primary"
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
                    message.includes('กรุณาตรวจสอบอีเมล') ? 'bg-sky-50 text-sky-700' : 'bg-red-50 text-red-700'
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
                    className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                      className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                  className="w-full py-3 px-4 bg-primary-darker text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><LogIn className="w-5 h-5" /> เข้าสู่ระบบ</>
                  )}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(true)
                  setMessage('')
                }}
                className="w-full mt-3 text-sm text-primary-dark hover:text-primary-darker text-center"
              >
                ลืมรหัสผ่าน?
              </button>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isSignUp ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชี?'}
              <button
                onClick={toggleAuthMode}
                className="ml-1 text-sky-600 font-medium hover:text-sky-700"
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
