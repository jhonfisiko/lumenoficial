'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  subscription_type: 'simulacro_unico' | 'preicfes_completo'
  calendar: string | null
  institution_id: string | null
  academic_year: number | null
}

interface ActiveSimulation {
  id: string
  title: string
  description: string | null
  type: 'corto' | 'normal_jornadas' | 'tesoro'
  duration_minutes_part1: number
  duration_minutes_part2: number
  is_treasure_active: boolean
  calendar: string | null
  academic_year: number | null
  target_institution_id?: string | null
  allowed_roles?: string[] | null
}

interface RecentAttempt {
  id: string
  score: number
  finished_at: string
  simulations: {
    title: string
  } | null
}

interface SubjectStat {
  subject_name: string
  correct: number
  total: number
}

export default function StudentDashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [simulations, setSimulations] = useState<ActiveSimulation[]>([])
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([])
  const [subjectStats, setSubjectStats] = useState<SubjectStat[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchDashboardData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // 1. Obtener perfil del estudiante
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, subscription_type, calendar, institution_id, academic_year')
        .eq('id', user.id)
        .single()

      const studentProfile = profileData as Profile | null

      if (studentProfile && isMounted) {
        setProfile(studentProfile)
      }

      // 2. Obtener simulacros activos
      const { data: simData } = await supabase
        .from('simulations')
        .select('id, title, description, type, duration_minutes_part1, duration_minutes_part2, is_treasure_active, calendar, academic_year, target_institution_id, allowed_roles')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (simData && isMounted) {
        const validSims = simData.filter((sim) => {
          if (sim.target_institution_id && sim.target_institution_id !== studentProfile?.institution_id) {
            return false
          }
          if (sim.allowed_roles && Array.isArray(sim.allowed_roles) && studentProfile?.subscription_type) {
            if (!sim.allowed_roles.includes(studentProfile.subscription_type)) {
              return false
            }
          }
          return true
        })
        setSimulations(validSims as ActiveSimulation[])
      }

      // 3. Obtener histórico de intentos recientes
      const { data: attemptsData } = await supabase
        .from('student_attempts')
        .select(`
          id,
          score,
          finished_at,
          simulations ( title )
        `)
        .eq('student_id', user.id)
        .eq('is_completed', true)
        .order('finished_at', { ascending: false })
        .limit(5)

      if (attemptsData && isMounted) {
        setRecentAttempts(attemptsData as unknown as RecentAttempt[])
      }

      // 4. Cargar respuestas e indicadores por materia de forma segura
      const { data: userAttempts } = await supabase
        .from('student_attempts')
        .select('id')
        .eq('student_id', user.id)

      if (userAttempts && userAttempts.length > 0) {
        const attemptIds = userAttempts.map((a) => a.id)

        const { data: userAnswers } = await supabase
          .from('attempt_answers')
          .select('question_id, is_correct')
          .in('attempt_id', attemptIds)

        if (userAnswers && userAnswers.length > 0) {
          const qIds = Array.from(new Set(userAnswers.map((a) => a.question_id)))

          const { data: questionsData } = await supabase
            .from('questions')
            .select('id, subjects(name)')
            .in('id', qIds)

          if (questionsData && isMounted) {
            const qMap = new Map(
              questionsData.map((q) => {
                const rawSubject = q.subjects as unknown
                let subjectName = 'General'

                if (Array.isArray(rawSubject) && rawSubject.length > 0) {
                  subjectName = rawSubject[0]?.name || 'General'
                } else if (rawSubject && typeof rawSubject === 'object' && 'name' in rawSubject) {
                  subjectName = (rawSubject as { name: string }).name || 'General'
                }

                return [q.id, subjectName]
              })
            )

            const statsMap: Record<string, { correct: number; total: number }> = {}

            userAnswers.forEach((ans) => {
              const subjectName = qMap.get(ans.question_id) || 'General'
              if (!statsMap[subjectName]) {
                statsMap[subjectName] = { correct: 0, total: 0 }
              }
              statsMap[subjectName].total += 1
              if (ans.is_correct) {
                statsMap[subjectName].correct += 1
              }
            })

            const formattedStats = Object.entries(statsMap).map(([name, data]) => ({
              subject_name: name,
              correct: data.correct,
              total: data.total,
            }))

            setSubjectStats(formattedStats)
          }
        }
      }

      if (isMounted) setLoading(false)
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold space-y-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p>Cargando tu panel de preparación...</p>
      </div>
    )
  }

  const averageScore = recentAttempts.length > 0
    ? Math.round(recentAttempts.reduce((acc, curr) => acc + (curr.score || 0), 0) / recentAttempts.length)
    : 0

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 selection:bg-orange-500 selection:text-white">
      
      {/* Luces Ambientales Naranja */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Banner Principal */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
                {profile?.subscription_type === 'preicfes_completo' ? 'Plan PreICFES Completo 🚀' : 'Plan Simulacro Único 🎯'}
              </span>
              {profile?.calendar && (
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase rounded-lg">
                  Cal. {profile.calendar} {profile.academic_year ? `- Cohorte ${profile.academic_year}` : ''}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              ¡Hola, <span className="text-orange-500">{profile?.full_name || 'Estudiante'}</span>! 👋
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Monitorea tu avance por materia, revisa tu histórico de puntajes e inicia tus exámenes agendados en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center flex-1 md:flex-none min-w-[140px]">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Promedio Global</p>
              <p className="text-3xl font-black text-amber-400 mt-0.5">{averageScore}</p>
              <p className="text-[9px] text-slate-500 font-bold">Puntos de 500</p>
            </div>

            <Link
              href="/dashboard/materials"
              className="hidden sm:flex flex-col items-center justify-center p-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-2xl transition-all text-center min-w-[120px]"
            >
              <span className="text-xl mb-1">📚</span>
              <span className="text-[10px] font-black uppercase">Biblioteca</span>
            </Link>
          </div>
        </div>

        {/* Rendimiento por Materia e Histórico */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Rendimiento por Materia */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <span>📊</span> Rendimiento Global por Materia
              </h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Aciertos Acumulados</span>
            </div>

            {subjectStats.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-semibold">
                Aún no has completado ningún examen. ¡Inicia un simulacro para desbloquear tus métricas!
              </div>
            ) : (
              <div className="space-y-4">
                {subjectStats.map((stat) => {
                  const percentage = Math.round((stat.correct / Math.max(stat.total, 1)) * 100)
                  return (
                    <div key={stat.subject_name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">{stat.subject_name}</span>
                        <span className="text-slate-400 text-[11px]">
                          {stat.correct} de {stat.total} aciertos ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            percentage >= 70
                              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                              : percentage >= 50
                              ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                              : 'bg-rose-500 shadow-sm shadow-rose-500/50'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Histórico Reciente */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
            <h2 className="text-sm font-black text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <span>🕒</span> Últimos Exámenes
            </h2>

            {recentAttempts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8 font-semibold">No hay intentos registrados.</p>
            ) : (
              <ul className="divide-y divide-slate-800/60">
                {recentAttempts.map((att) => (
                  <li key={att.id} className="py-3 flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white text-xs truncate max-w-[140px]">
                        {att.simulations?.title || 'Simulacro'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(att.finished_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-amber-400">{att.score} pts</span>
                      <Link
                        href={`/dashboard/results/${att.id}`}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold border border-slate-700 transition-all"
                      >
                        Análisis no lineal
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Simulacros Disponibles */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>📝</span> Simulacros Disponibles
              </h2>
              <p className="text-xs text-slate-400">Selecciona un examen para comenzar a responder</p>
            </div>
          </div>

          {simulations.length === 0 ? (
            <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl text-center text-slate-500 text-xs font-semibold">
              No tienes simulacros activos asignados en este momento.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {simulations.map((sim) => (
                <div
                  key={sim.id}
                  className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          sim.type === 'tesoro'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : sim.type === 'normal_jornadas'
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {sim.type === 'tesoro'
                          ? '★ Tipo Tesoro'
                          : sim.type === 'normal_jornadas'
                          ? '2 Jornadas ICFES'
                          : 'Simulacro Corto'}
                      </span>

                      <span className="text-[10px] text-slate-400 font-bold">
                        ⏱ {sim.duration_minutes_part1 + (sim.duration_minutes_part2 || 0)} min
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors leading-snug">
                      {sim.title}
                    </h3>
                    {sim.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {sim.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    {sim.is_treasure_active && (
                      <Link
                        href={`/dashboard/leaderboard/${sim.id}`}
                        className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl text-center block border border-amber-500/30 transition-all"
                      >
                        ★ Ver Ranking en Vivo
                      </Link>
                    )}

                    <Link
                      href={`/dashboard/simulations/${sim.id}`}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl text-center block shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
                    >
                      Iniciar Examen ➔
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}