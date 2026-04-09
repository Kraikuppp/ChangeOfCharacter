import { useState, useEffect } from 'react'

export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setShowText(true), 500)
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => onComplete?.(), 300)
          return 100
        }
        return prev + Math.random() * 15 + 5
      })
    }, 150)

    return () => {
      clearTimeout(timer1)
      clearInterval(interval)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-darker via-primary-dark to-primary flex flex-col items-center justify-center z-50">
      <h1 className="text-6xl font-bold text-white tracking-wide animate-scale-in">
        CHocH
      </h1>
      
      <p className={`text-white/80 mt-4 text-lg transition-all duration-500 ${showText ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        Change of Character
      </p>

      <div className="mt-12 w-48">
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white rounded-full transition-all duration-200 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-white/60 text-sm text-center mt-3">
          กำลังโหลด...
        </p>
      </div>

      <div className="absolute bottom-8 flex gap-2">
        {[0, 1, 2].map(i => (
          <div 
            key={i}
            className="w-2 h-2 bg-white/40 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
