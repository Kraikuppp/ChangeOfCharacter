import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import SplashScreen from './components/SplashScreen'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [showSplash, setShowSplash] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSplashComplete = () => {
    // รอให้ session โหลดเสร็จด้วยก่อนจะปิด splash
    if (isReady) {
      setShowSplash(false)
    }
  }

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  return (
    <div className="min-h-screen">
      {!session ? <Auth /> : <Dashboard session={session} />}
    </div>
  )
}

export default App
