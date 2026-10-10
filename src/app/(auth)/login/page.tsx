'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
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
    </div>
  )
}