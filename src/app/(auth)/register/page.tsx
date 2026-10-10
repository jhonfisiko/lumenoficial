'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Institution {
  id: string
  name: string
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [calendar, setCalendar] = useState('G')
  const [institutionId, setInstitutionId] = useState('')
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loadingInst, setLoadingInst] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const fetchInstitutions = async () => {
      setLoadingInst(true)
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error al cargar instituciones:', error.message)
      }

      if (data && isMounted) {
        setInstitutions(data)
      }
      if (isMounted) setLoadingInst(false)
    }

    fetchInstitutions()

    return () => {
      isMounted = false
    }
  }, [supabase])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    // 1. Registro en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    })

    if (authError || !authData.user) {
      setErrorMsg(authError?.message || 'Error al crear la cuenta.')
      setLoading(false)
      return
    }

    // 2. Insertar/Actualizar perfil
    const profilePayload: Record<string, unknown> = {
      id: authData.user.id,
      full_name: fullName.trim(),
      institution_id: institutionId || null,
      role: 'student',
      status: 'pending',
      calendar: calendar,
    }

    let { error: profileError } = await supabase.from('profiles').upsert(profilePayload)

    // Fallback si la columna calendar aún es un enum restrictivo
    if (profileError && profileError.message.includes('calendar_type')) {
      delete profilePayload.calendar
      const retry = await supabase.from('profiles').upsert(profilePayload)
      profileError = retry.error
    }

    if (profileError) {
      setErrorMsg(`Error al guardar perfil: ${profileError.message}`)
      setLoading(false)
      return
    }

    // Redirigir a la pantalla de lista de espera
    router.push('/pending-approval')
  }

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 py-12 overflow-hidden selection:bg-orange-500 selection:text-white">
      
      {/* Luz Ambiental Naranja de Fondo */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Contenedor Principal Centrado */}
      <div className="relative z-10 w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block hover:scale-105 transition-transform">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white text-3xl font-black shadow-lg shadow-orange-500/20 mb-2">
              ⚡
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Crea tu cuenta en <span className="text-orange-500">LUMEN</span>
          </h1>
          <p className="text-xs text-slate-400">
            Regístrate para acceder a tus simulacros y material de estudio
          </p>
        </div>

        {/* Alerta de Error */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. María Alejandra Pérez"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Correo Electrónico *
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
              Contraseña *
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Calendario ICFES
              </label>
              <select
                value={calendar}
                onChange={(e) => setCalendar(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
              >
                <option value="G">Calendario G </option>
                <option value="B">Calendario B </option>
                <option value="A">Calendario A </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Colegio / Institución
              </label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                disabled={loadingInst}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-3 text-xs text-slate-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">
                  {loadingInst ? 'Cargando instituciones...' : '-- Independiente / Otra --'}
                </option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Completar Registro ➔'}
          </button>
        </form>

        {/* Enlace a Login */}
        <div className="text-center pt-3 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            ¿Ya tienes una cuenta?{' '}
            <Link
              href="/login"
              prefetch={false}
              className="font-bold text-orange-400 hover:text-orange-300 transition-colors underline underline-offset-4"
            >
              Inicia sesión aquí
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