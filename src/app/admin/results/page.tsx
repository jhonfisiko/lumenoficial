// RUTA: app/admin/results/page.tsx   (panel de resultados del administrador - ARCHIVO NUEVO)
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SimulationOption {
  id: string
  title: string
}

interface InstitutionOption {
  id: string
  name: string
}

interface AttemptRow {
  attempt_id: string
  student_id: string
  full_name: string | null
  institution_name: string | null
  simulation_title: string | null
  score_ranking: number | null
  score_icfes: number
  started_at: string
  finished_at: string | null
  is_completed: boolean
  archived_at: string | null
  correct_count: number
  answered_count: number
  total_questions: number
  total_count: number
}

interface Summary {
  total: number
  completed: number
  in_progress: number
  avg: number | null
  max: number | null
  min: number | null
  median: number | null
  distribution: number[]
  by_subject: { name: string; correct: number; total: number }[]
  by_institution: { name: string; attempts: number; avg: number }[]
  hardest: {
    question_id: string
    upload_position: number | null
    statement: string
    subject: string
    correct: number
    total: number
  }[]
}

type Metric = 'ranking' | 'icfes'
type StatusFilter = 'completed' | 'in_progress' | 'all'

const PAGE_SIZE = 100

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'

const fmt = (n: number | null | undefined) => (n === null || n === undefined ? '—' : String(Math.round(Number(n) * 10) / 10))

export default function AdminResultsPage() {
  const [simulations, setSimulations] = useState<SimulationOption[]>([])
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([])

  // Filtros
  const [simulationId, setSimulationId] = useState('')
  const [institutionId, setInstitutionId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState<StatusFilter>('completed')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [metric, setMetric] = useState<Metric>('ranking')

  // Datos
  const [summary, setSummary] = useState<Summary | null>(null)
  const [rows, setRows] = useState<AttemptRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const supabase = createClient()
  const router = useRouter()

  const buildParams = useCallback(
    () => ({
      p_simulation_id: simulationId || null,
      p_institution_id: institutionId || null,
      p_from: dateFrom ? new Date(`${dateFrom}T00:00:00`).toISOString() : null,
      p_to: dateTo ? new Date(new Date(`${dateTo}T00:00:00`).getTime() + 86400000).toISOString() : null,
      p_include_archived: includeArchived,
      p_status: status,
    }),
    [simulationId, institutionId, dateFrom, dateTo, includeArchived, status]
  )

  // Listas para los selectores de filtro
  useEffect(() => {
    let isMounted = true

    const loadOptions = async () => {
      const [simRes, instRes] = await Promise.all([
        supabase.from('simulations').select('id, title').order('created_at', { ascending: false }),
        supabase.from('institutions').select('id, name').order('name'),
      ])
      if (!isMounted) return
      if (simRes.data) setSimulations(simRes.data as SimulationOption[])
      if (instRes.data) setInstitutions(instRes.data as InstitutionOption[])
    }

    loadOptions()
    return () => {
      isMounted = false
    }
  }, [supabase])

  // Estadísticas + primera página de resultados
  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setLoading(true)
      setErrorMsg(null)

      const params = buildParams()
      const [sumRes, listRes] = await Promise.all([
        supabase.rpc('admin_results_summary', { ...params, p_metric: metric }),
        supabase.rpc('admin_attempts_list', {
          ...params,
          p_order: metric,
          p_limit: PAGE_SIZE,
          p_offset: 0,
        }),
      ])

      if (!isMounted) return

      const err = sumRes.error || listRes.error
      if (err) {
        if (/No autorizado/i.test(err.message)) {
          router.push('/dashboard')
          return
        }
        setErrorMsg(err.message)
        setLoading(false)
        return
      }

      const list = (listRes.data ?? []) as AttemptRow[]
      setSummary(sumRes.data as Summary)
      setRows(list)
      setTotalCount(list[0]?.total_count ?? 0)
      setLoading(false)
    }

    load()
    return () => {
      isMounted = false
    }
  }, [supabase, router, buildParams, metric, reloadKey])

  const handleLoadMore = async () => {
    setLoadingMore(true)
    const { data, error } = await supabase.rpc('admin_attempts_list', {
      ...buildParams(),
      p_order: metric,
      p_limit: PAGE_SIZE,
      p_offset: rows.length,
    })
    if (error) {
      alert(`Error cargando más resultados: ${error.message}`)
    } else if (data) {
      setRows((prev) => [...prev, ...(data as AttemptRow[])])
    }
    setLoadingMore(false)
  }

  const handleArchive = async () => {
    if (!simulationId) {
      alert('Selecciona un simulacro específico para archivar su ranking.')
      return
    }
    const simTitle = simulations.find((s) => s.id === simulationId)?.title ?? 'este simulacro'
    const scope = institutionId
      ? ' (solo del colegio seleccionado)'
      : ' (de todos los colegios)'

    if (
      !confirm(
        `¿Archivar el ranking de "${simTitle}"${scope}?\n\nLos intentos dejarán de aparecer en el ranking en vivo, pero se conservan aquí para estadísticas. Podrás restaurarlos cuando quieras.`
      )
    ) {
      return
    }

    setBusy(true)
    const { data, error } = await supabase.rpc('admin_archive_attempts', {
      p_simulation_id: simulationId,
      p_institution_id: institutionId || null,
    })
    setBusy(false)

    if (error) {
      alert(`Error al archivar: ${error.message}`)
    } else {
      alert(`✅ Se archivaron ${data ?? 0} intento(s). El ranking quedó en cero.`)
      setReloadKey((k) => k + 1)
    }
  }

  const handleRestore = async () => {
    if (!simulationId) {
      alert('Selecciona un simulacro específico para restaurar sus intentos archivados.')
      return
    }
    if (!confirm('¿Restaurar todos los intentos archivados de este simulacro? Volverán a aparecer en el ranking.')) {
      return
    }

    setBusy(true)
    const { data, error } = await supabase.rpc('admin_restore_attempts', { p_simulation_id: simulationId })
    setBusy(false)

    if (error) {
      alert(`Error al restaurar: ${error.message}`)
    } else {
      alert(`✅ Se restauraron ${data ?? 0} intento(s).`)
      setReloadKey((k) => k + 1)
    }
  }

  const handleDeleteAttempt = async (row: AttemptRow) => {
    if (
      !confirm(
        `¿Eliminar DEFINITIVAMENTE el intento de ${row.full_name || 'este estudiante'}?\n\nEsta acción no se puede deshacer. Si solo quieres sacarlo del ranking, usa "Archivar".`
      )
    ) {
      return
    }
    const { error } = await supabase.rpc('admin_delete_attempt', { p_attempt_id: row.attempt_id })
    if (error) {
      alert(`Error al eliminar: ${error.message}`)
    } else {
      setReloadKey((k) => k + 1)
    }
  }

  const handleExportCsv = () => {
    const header = [
      'Posición',
      'Estudiante',
      'Colegio',
      'Simulacro',
      'Puntaje ranking (0-500)',
      'Puntaje ICFES ponderado (0-500)',
      'Respondidas',
      'Total preguntas',
      'Correctas',
      'Estado',
      'Finalizado',
    ]

    const esc = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`

    const lines = rows.map((r, idx) =>
      [
        idx + 1,
        r.full_name,
        r.institution_name,
        r.simulation_title,
        r.score_ranking,
        r.score_icfes,
        r.answered_count,
        r.total_questions,
        r.correct_count,
        r.archived_at ? 'Archivado' : r.is_completed ? 'Completado' : 'En progreso',
        formatDate(r.finished_at),
      ]
        .map(esc)
        .join(';')
    )

    const csv = '\uFEFF' + [header.map(esc).join(';'), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resultados-lumen-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSimulationId('')
    setInstitutionId('')
    setDateFrom('')
    setDateTo('')
    setStatus('completed')
    setIncludeArchived(false)
  }

  const maxBin = summary ? Math.max(...summary.distribution, 1) : 1
  const metricLabel = metric === 'ranking' ? 'Puntaje ranking' : 'Puntaje ICFES ponderado'

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 selection:bg-orange-500 selection:text-white">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
              Análisis de Desempeño
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-2">
              Resultados y <span className="text-orange-500">Estadísticas</span>
            </h1>
            <p className="text-xs text-slate-400">
              Revisa cómo quedaron los estudiantes, analiza el rendimiento y administra los rankings
            </p>
          </div>

          <Link
            href="/admin"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all self-start md:self-auto"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Filtros */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4 backdrop-blur-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Simulacro</label>
              <select
                value={simulationId}
                onChange={(e) => setSimulationId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="">-- Todos los simulacros --</option>
                {simulations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Colegio</label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="">-- Todos los colegios --</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="completed">Solo completados</option>
                <option value="in_progress">Solo en progreso</option>
                <option value="all">Todos</option>
              </select>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={(e) => setIncludeArchived(e.target.checked)}
                  className="accent-orange-500 h-4 w-4"
                />
                Incluir archivados
              </label>

              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setMetric('ranking')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    metric === 'ranking' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Aciertos sobre el total de preguntas x 500. Es el puntaje que usa el ranking en vivo."
                >
                  Puntaje ranking
                </button>
                <button
                  onClick={() => setMetric('icfes')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    metric === 'icfes' ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ponderado por materia (x3 y x1). Es el que ve el estudiante en su pantalla de resultados."
                >
                  Puntaje ICFES ponderado
                </button>
              </div>

              <button onClick={clearFilters} className="text-[11px] font-bold text-slate-400 hover:text-orange-400">
                Limpiar filtros
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportCsv}
                disabled={rows.length === 0}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all disabled:opacity-40"
              >
                ⬇ Exportar CSV
              </button>
              {includeArchived && (
                <button
                  onClick={handleRestore}
                  disabled={busy || !simulationId}
                  className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl transition-all disabled:opacity-40"
                  title={!simulationId ? 'Selecciona un simulacro' : undefined}
                >
                  ↩ Restaurar archivados
                </button>
              )}
              <button
                onClick={handleArchive}
                disabled={busy || !simulationId}
                className="px-3 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-400 font-bold text-xs rounded-xl transition-all disabled:opacity-40"
                title={!simulationId ? 'Selecciona un simulacro para archivar su ranking' : undefined}
              >
                🧹 Archivar ranking
              </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Puntaje ranking:</strong> aciertos sobre el total de preguntas × 500 (el del
            ranking en vivo). <strong className="text-slate-400">Puntaje ICFES ponderado:</strong> por materia, con peso x3
            (matemáticas, lectura, sociales, ciencias) y x1 (inglés), como lo ve el estudiante en su pantalla de resultados.
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold p-4 rounded-2xl">
            No se pudieron cargar los resultados: {errorMsg}
            <p className="text-[11px] text-rose-400/80 mt-1">
              Verifica que ya corriste el SQL de la Fase 3 (fase3_panel_resultados.sql) en Supabase.
            </p>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">Calculando estadísticas...</p>
          </div>
        ) : summary ? (
          <>
            {/* Tarjetas de métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Completados', value: summary.completed, color: 'text-white' },
                { label: 'En progreso', value: summary.in_progress, color: 'text-amber-400' },
                { label: `Promedio`, value: fmt(summary.avg), color: 'text-orange-400' },
                { label: 'Mediana', value: fmt(summary.median), color: 'text-blue-400' },
                { label: 'Máximo', value: fmt(summary.max), color: 'text-emerald-400' },
                { label: 'Mínimo', value: fmt(summary.min), color: 'text-rose-400' },
              ].map((card) => (
                <div key={card.label} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                  <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 -mt-3">
              Promedio, mediana, máximo y mínimo calculados con: <strong className="text-slate-400">{metricLabel}</strong>
            </p>

            {/* Distribución y materias */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <span>📈</span> Distribución de puntajes
                </h2>
                {summary.completed === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Sin intentos completados con estos filtros.</p>
                ) : (
                  <div className="flex items-end gap-2 h-44">
                    {summary.distribution.map((n, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                        <span className="text-[10px] font-bold text-slate-400">{n}</span>
                        <div
                          className="w-full bg-gradient-to-t from-orange-600 to-amber-400 rounded-t-md transition-all"
                          style={{ height: `${Math.max((n / maxBin) * 100, n > 0 ? 4 : 0)}%` }}
                        />
                        <span className="text-[9px] text-slate-500 font-semibold">
                          {idx * 50}
                          {idx === 9 ? '+' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <span>📚</span> Rendimiento por materia
                </h2>
                {summary.by_subject.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-8">Sin respuestas registradas.</p>
                ) : (
                  <div className="space-y-3">
                    {summary.by_subject.map((s) => {
                      const pct = Math.round((s.correct / Math.max(s.total, 1)) * 100)
                      return (
                        <div key={s.name} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-300">{s.name}</span>
                            <span className="text-slate-400 text-[11px]">
                              {pct}% ({s.correct}/{s.total})
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 70 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Colegios y preguntas difíciles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <span>🏫</span> Promedio por colegio
                </h2>
                {summary.by_institution.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">Sin datos.</p>
                ) : (
                  <div className="divide-y divide-slate-800/60 max-h-72 overflow-y-auto">
                    {summary.by_institution.map((inst) => (
                      <div key={inst.name} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <span className="font-bold text-slate-200 truncate">{inst.name}</span>
                        <span className="shrink-0 text-slate-400">
                          {inst.attempts} intento(s) · <strong className="text-orange-400">{fmt(inst.avg)}</strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <span>🎯</span> Preguntas con menor acierto
                </h2>
                {summary.hardest.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    Se necesitan al menos 3 respuestas por pregunta.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {summary.hardest.map((h) => {
                      const pct = Math.round((h.correct / Math.max(h.total, 1)) * 100)
                      return (
                        <div key={h.question_id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-[10px] font-black">
                                #{h.upload_position ?? '—'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold">{h.subject}</span>
                            </div>
                            <span className="text-[11px] font-black text-rose-400">
                              {pct}% ({h.correct}/{h.total})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">{h.statement}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Tabla de intentos */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-white flex items-center gap-2">
                  <span>👥</span> Resultados por estudiante
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  Mostrando {rows.length} de {totalCount}
                </span>
              </div>

              {rows.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl space-y-2">
                  <p className="text-2xl">📭</p>
                  <p className="text-xs font-bold text-slate-300">No hay intentos con estos filtros.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[10px] font-black uppercase text-slate-500 tracking-wider border-b border-slate-800">
                        <th className="text-left py-2 pr-3">#</th>
                        <th className="text-left py-2 pr-3">Estudiante / Colegio</th>
                        <th className="text-left py-2 pr-3">Simulacro</th>
                        <th className="text-right py-2 pr-3">Ranking</th>
                        <th className="text-right py-2 pr-3">ICFES pond.</th>
                        <th className="text-right py-2 pr-3">Respondidas</th>
                        <th className="text-left py-2 pr-3">Fecha</th>
                        <th className="text-right py-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {rows.map((r, idx) => (
                        <tr key={r.attempt_id} className="hover:bg-slate-950/60">
                          <td className="py-2.5 pr-3 font-black text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 pr-3">
                            <p className="font-bold text-white">{r.full_name || 'Estudiante'}</p>
                            <p className="text-[10px] text-slate-500">{r.institution_name || 'Sin colegio'}</p>
                          </td>
                          <td className="py-2.5 pr-3 text-slate-300 max-w-[200px] truncate">{r.simulation_title}</td>
                          <td className="py-2.5 pr-3 text-right font-black text-amber-400">
                            {r.is_completed ? fmt(r.score_ranking) : '—'}
                          </td>
                          <td className="py-2.5 pr-3 text-right font-black text-indigo-400">
                            {r.answered_count > 0 ? r.score_icfes : '—'}
                          </td>
                          <td className="py-2.5 pr-3 text-right text-slate-300">
                            {r.answered_count}/{r.total_questions}
                          </td>
                          <td className="py-2.5 pr-3 text-slate-400">
                            <div className="flex flex-col gap-0.5">
                              <span>{formatDate(r.finished_at ?? r.started_at)}</span>
                              <div className="flex gap-1">
                                {!r.is_completed && (
                                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-black uppercase w-fit">
                                    En progreso
                                  </span>
                                )}
                                {r.archived_at && (
                                  <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[9px] font-black uppercase w-fit">
                                    Archivado
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 text-right whitespace-nowrap">
                            {r.is_completed && (
                              <Link
                                href={`/dashboard/results/${r.attempt_id}`}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold border border-slate-700 transition-all mr-1.5"
                              >
                                Ver detalle
                              </Link>
                            )}
                            <button
                              onClick={() => handleDeleteAttempt(r)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-[11px] font-bold border border-rose-500/20 transition-all"
                              title="Eliminar definitivamente este intento"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {rows.length < totalCount && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all disabled:opacity-50"
                >
                  {loadingMore ? 'Cargando...' : `Cargar más (${totalCount - rows.length} restantes)`}
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
