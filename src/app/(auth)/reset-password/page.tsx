'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setMessage('✅ ¡Contraseña actualizada con éxito! Redirigiendo...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl">
        <div className="text-center space-y-1">
          <span className="text-2xl">🔑</span>
          <h1 className="text-base font-black text-white">Restablecer Contraseña</h1>
          <p className="text-xs text-slate-400">Ingresa tu nueva clave de acceso</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-3">
          {/* Nueva Contraseña */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 pl-2.5 pr-10 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors text-xs p-1"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 pl-2.5 pr-10 py-2.5 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors text-xs p-1"
                title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirmPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          {message && (
            <p className="text-xs font-semibold text-center text-amber-400 pt-1">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? 'Actualizando...' : 'Guardar Nueva Contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}