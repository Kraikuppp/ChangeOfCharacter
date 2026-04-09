import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { User, Mail, Lock, Eye, EyeOff, Camera, ArrowLeft, LogOut, Check } from 'lucide-react'

export default function Profile({ session, onBack }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    gender: 'male',
    weight: '',
    height: '',
    age: '',
    activityLevel: 'moderate',
    goal: 'maintain'
  })
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [session])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          username: data.username || user.user_metadata.username || '',
          email: user.email || '',
          gender: data.gender || user.user_metadata.gender || 'male',
          weight: data.weight || user.user_metadata.weight || '',
          height: data.height || user.user_metadata.height || '',
          age: data.age || user.user_metadata.age || '',
          activityLevel: data.activity_level || user.user_metadata.activity_level || 'moderate',
          goal: data.goal || user.user_metadata.goal || 'maintain'
        })
        setAvatarUrl(data.avatar_url)
      } else {
        setProfile({
          username: user.user_metadata.username || '',
          email: user.email || '',
          gender: user.user_metadata.gender || 'male',
          weight: user.user_metadata.weight || '',
          height: user.user_metadata.height || '',
          age: user.user_metadata.age || '',
          activityLevel: user.user_metadata.activity_level || 'moderate',
          goal: user.user_metadata.goal || 'maintain'
        })
      }
    }
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: profile.username,
        gender: profile.gender,
        weight: parseFloat(profile.weight),
        height: parseFloat(profile.height),
        age: parseInt(profile.age),
        activity_level: profile.activityLevel,
        goal: profile.goal,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })

    if (error) {
      setMessage('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      setMessage('บันทึกข้อมูลสำเร็จ!')
    }
    setLoading(false)
  }

  const updatePassword = async (e) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      setMessage('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    if (passwords.new.length < 8) {
      setMessage('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({
      password: passwords.new
    })

    if (error) {
      setMessage('เกิดข้อผิดพลาด: ' + error.message)
    } else {
      setMessage('เปลี่ยนรหัสผ่านสำเร็จ!')
      setPasswords({ current: '', new: '', confirm: '' })
    }
    setLoading(false)
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      setMessage('อัปโหลดรูปไม่สำเร็จ: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    setAvatarUrl(data.publicUrl)

    await supabase
      .from('profiles')
      .upsert({ id: user.id, avatar_url: data.publicUrl })

    setUploading(false)
    setMessage('อัปโหลดรูปสำเร็จ!')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const activityLevels = [
    { value: 'sedentary', label: 'ไม่ค่อยออกกำลังกาย' },
    { value: 'light', label: 'ออกกำลังกายเล็กน้อย (1-3 วัน/สัปดาห์)' },
    { value: 'moderate', label: 'ออกกำลังกายปานกลาง (3-5 วัน/สัปดาห์)' },
    { value: 'active', label: 'ออกกำลังกายมาก (6-7 วัน/สัปดาห์)' },
    { value: 'very_active', label: 'ออกกำลังกายหนักมาก (2 ครั้ง/วัน)' }
  ]

  const goals = [
    { value: 'maintain', label: 'รักษาน้ำหนัก' },
    { value: 'lose_weight', label: 'ลดน้ำหนัก' },
    { value: 'lose_fat', label: 'ลดไขมัน / เฟ้นร่าง' },
    { value: 'build_muscle', label: 'เพิ่มกล้ามเนื้อ' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient fade from top */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
      
      <main className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>กลับ</span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 animate-fadeIn">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors shadow-lg">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={uploadAvatar}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            <p className="mt-3 text-lg font-semibold text-gray-800">{profile.username}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>

          {/* Profile Form */}
          <form onSubmit={updateProfile} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ข้อมูลส่วนตัว</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เพศ</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อายุ</label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">น้ำหนัก (กก.)</label>
                <input
                  type="number"
                  value={profile.weight}
                  onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ส่วนสูง (ซม.)</label>
                <input
                  type="number"
                  value={profile.height}
                  onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ระดับการออกกำลังกาย</label>
              <select
                value={profile.activityLevel}
                onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {activityLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เป้าหมาย</label>
              <select
                value={profile.goal}
                onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {goals.map(goal => (
                  <option key={goal.value} value={goal.value}>{goal.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Check className="w-5 h-5" /> บันทึกข้อมูล</>
              )}
            </button>
          </form>

          {/* Password Section */}
          <form onSubmit={updatePassword} className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">เปลี่ยนรหัสผ่าน</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="รหัสผ่านใหม่"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ยืนยันรหัสผ่านใหม่"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-900 disabled:opacity-50 transition-colors"
              >
                เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </form>

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.includes('สำเร็จ') ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="w-full mt-8 py-3 border-2 border-red-500 text-red-500 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            ออกจากระบบ
          </button>
        </div>
      </main>
    </div>
  )
}
