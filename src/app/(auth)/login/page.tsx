'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false) // Estado para alternar ver/ocultar contraseña
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Estados para el Modal de Recuperar Contraseña
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setErrorMsg('Correo o contraseña incorrectos. Por favor verifica tus datos.')
      setLoading(false)
      return
    }

    if (data.user) {
      // 1. Generar token único para esta sesión de usuario
      const newSessionId = crypto.randomUUID()

      // 2. Guardarlo en la base de datos (profiles)
      await supabase
        .from('profiles')
        .update({ active_session_id: newSessionId })
        .eq('id', data.user.id)

      // 3. Guardarlo localmente en el navegador
      localStorage.setItem('lumen_session_id', newSessionId)

      // 4. Consultar rol y estado para redirigir
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/admin')
      } else if (profile?.status === 'pending') {
        router.push('/pending-approval')
      } else {
        router.push('/dashboard')
      }
    }
  }

  // Manejador para el envío de recuperación de contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetMessage(null)

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/callback`,
    })

    if (error) {
      setResetMessage({ type: 'error', text: `Error: ${error.message}` })
    } else {
      setResetMessage({
        type: 'success',
        text: '✅ Se ha enviado un enlace de recuperación a tu correo electrónico.',
      })
      setResetEmail('')
    }

    setResetLoading(false)
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 overflow-hidden selection:bg-orange-500 selection:text-white">
      
      {/* Luz Ambiental Naranja de Fondo */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Contenedor Principal Centrado */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block hover:scale-105 transition-transform">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white text-3xl font-black shadow-lg shadow-orange-500/20 mb-2">
              ⚡
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            PRE ICFES <span className="text-orange-500">LUMEN</span>
          </h1>
          <p className="text-xs text-slate-400">
            Ingresa a tu cuenta para continuar practicando
          </p>
        </div>

        {/* Alerta de Error */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl text-center animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="tu.correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contraseña
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email)
                  setResetMessage(null)
                  setIsForgotModalOpen(true)
                }}
                className="text-[11px] font-semibold text-orange-400 hover:text-orange-300 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Campo con botón para alternar ver/ocultar contraseña */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-4 pr-11 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Iniciando Sesión...' : 'Ingresar a mi Cuenta ➔'}
          </button>
        </form>

        {/* Enlace a Registro */}
        <div className="text-center pt-3 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            ¿Aún no tienes cuenta?{' '}
            <Link
              href="/register"
              prefetch={false}
              className="font-bold text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-4"
            >
              Registrarme aquí
            </Link>
          </p>
        </div>

        {/* Enlace a Inicio */}
        <div className="text-center pt-1">
          <Link
            href="/"
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Volver a la página principal
          </Link>
        </div>

      </div>

      {/* Modal de Restablecer Contraseña */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-150">
            
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                🔑 Restablecer Contraseña
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Ingresa tu correo registrado. Te enviaremos un enlace para crear una nueva clave.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="tu.correo@ejemplo.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              {resetMessage && (
                <div
                  className={`p-2.5 rounded-xl text-[11px] font-semibold text-center ${
                    resetMessage.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                  }`}
                >
                  {resetMessage.text}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 font-black text-xs uppercase text-slate-950 rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-50 transition-all"
                >
                  {resetLoading ? 'Enviando...' : 'Enviar Enlace'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}