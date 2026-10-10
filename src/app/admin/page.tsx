'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalStudents: number
  pendingApprovals: number
  totalInstitutions: number
  totalQuestions: number
  totalResources: number
  totalSimulations: number
}

interface PendingUser {
  id: string
  full_name: string
  created_at: string
  calendar: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    pendingApprovals: 0,
    totalInstitutions: 0,
    totalQuestions: 0,
    totalResources: 0,
    totalSimulations: 0,
  })
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const loadDashboardData = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          if (isMounted) router.push('/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        const isAdmin = profile?.role === 'admin' || user.email === 'lumenicfes@gmail.com'

        if (!isAdmin) {
          if (isMounted) router.push('/dashboard')
          return
        }

        // Consultar conteos de todos los módulos del admin de forma segura
        const [
          { count: studentsCount },
          { count: pendingCount, data: pendingData },
          { count: instCount },
          { count: questionsCount },
          { count: resourcesCount },
          { count: simulationsCount }
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
          supabase.from('profiles').select('id, full_name, created_at, calendar', { count: 'exact' }).eq('status', 'pending').limit(10),
          supabase.from('institutions').select('*', { count: 'exact', head: true }),
          supabase.from('questions').select('*', { count: 'exact', head: true }),
          supabase.from('resources').select('*', { count: 'exact', head: true }),
          supabase.from('simulations').select('*', { count: 'exact', head: true }),
        ])

        if (isMounted) {
          setStats({
            totalStudents: studentsCount || 0,
            pendingApprovals: pendingCount || 0,
            totalInstitutions: instCount || 0,
            totalQuestions: questionsCount || 0,
            totalResources: resourcesCount || 0,
            totalSimulations: simulationsCount || 0,
          })
          setPendingUsers(pendingData || [])
        }
      } catch (err) {
        console.error('Error al cargar datos del panel administrativo:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadDashboardData()

    return () => {
      isMounted = false
    }
  }, [supabase, router])

  const handleApproveUser = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'approved' })
      .eq('id', userId)

    if (!error) {
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId))
      setStats((prev) => ({
        ...prev,
        pendingApprovals: Math.max(0, prev.pendingApprovals - 1),
      }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold">Cargando Panel de Control...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado Superior */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
                Panel de Administración
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-2">
              PRE ICFES <span className="text-orange-500">LUMEN</span>
            </h1>
            <p className="text-xs text-slate-400">
              Centro de gestión general del sistema y administración de contenidos
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition-all"
            >
              👥 Usuarios
            </Link>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs rounded-xl transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas Principales */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estudiantes</span>
            <p className="text-2xl font-black text-white">{stats.totalStudents}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Por Aprobar</span>
            <p className="text-2xl font-black text-amber-400">{stats.pendingApprovals}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulacros</span>
            <p className="text-2xl font-black text-purple-400">{stats.totalSimulations}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preguntas</span>
            <p className="text-2xl font-black text-blue-400">{stats.totalQuestions}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recursos</span>
            <p className="text-2xl font-black text-emerald-400">{stats.totalResources}</p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instituciones</span>
            <p className="text-2xl font-black text-white">{stats.totalInstitutions}</p>
          </div>
        </div>

        {/* Módulos del Administrador y Lista de Pendientes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Accesos Rápidos a Todos los Módulos de la Estructura */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>⚡</span> Módulos del Sistema
            </h2>
            <div className="space-y-2">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    👥 Usuarios (`/admin/users`)
                  </p>
                  <p className="text-[11px] text-slate-400">Aprobar, asignar roles y gestionar cuentas</p>
                </div>
                <span className="text-slate-500 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>

              <Link
                href="/admin/simulations"
                className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    🚀 Simulacros (`/admin/simulations`)
                  </p>
                  <p className="text-[11px] text-slate-400">Crear y parametrizar exámenes ICFES</p>
                </div>
                <span className="text-slate-500 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>

              <Link
                href="/admin/questions"
                className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    ❓ Banco de Preguntas (`/admin/questions`)
                  </p>
                  <p className="text-[11px] text-slate-400">Gestionar preguntas por área y componente</p>
                </div>
                <span className="text-slate-500 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>

              <Link
                href="/admin/resources"
                className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    📑 Recursos de Estudio (`/admin/resources`)
                  </p>
                  <p className="text-[11px] text-slate-400">Subir guías, material PDF y clases</p>
                </div>
                <span className="text-slate-500 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>

              <Link
                href="/admin/institutions"
                className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    🏫 Instituciones (`/admin/institutions`)
                  </p>
                  <p className="text-[11px] text-slate-400">Administrar colegios y sedes registradas</p>
                </div>
                <span className="text-slate-500 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-2xl transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">
                    🎓 Vista Estudiante (`/dashboard`)
                  </p>
                  <p className="text-[11px] text-slate-400">Probar la experiencia del estudiante</p>
                </div>
                <span className="text-slate-500 group-hover:translate-x-1 transition-transform">➔</span>
              </Link>
            </div>
          </div>

          {/* Solicitudes de Aprobación Recientes */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>⏳</span> Solicitudes Pendientes
              </h2>
              <Link
                href="/admin/users"
                className="text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
              >
                Ver todas ({stats.pendingApprovals})
              </Link>
            </div>

            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <p className="text-2xl">🎉</p>
                <p className="text-xs font-bold text-slate-300">¡Al día! No hay registros pendientes de aprobación.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl gap-3"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">{user.full_name || 'Estudiante Sin Nombre'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded-md font-bold">
                          Calendario {user.calendar || 'G'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(user.created_at).toLocaleDateString('es-CO')}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleApproveUser(user.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all self-start sm:self-auto"
                    >
                      Aprobar Cupo ✓
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}