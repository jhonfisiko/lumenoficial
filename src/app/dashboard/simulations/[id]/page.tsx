'use client'

import { useState, useEffect, useCallback, useMemo, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Option {
  id: string
  option_letter: string
  option_text: string | null
  option_image_url: string | null
}

interface Question {
  id: string
  statement: string
  image_url: string | null
  options: Option[]
}

interface SimulationQuestion {
  section_part: number | null
  question_order: number | null
  questions: Question | null
}

interface SimulationData {
  id: string
  title: string
  type: 'corto' | 'normal_jornadas' | 'tesoro'
  duration_minutes_part1: number
  duration_minutes_part2: number | null
}

interface AttemptState {
  attempt_id: string
  current_section: number
  section_started_at: string
  server_now: string
  answers?: Record<string, string>
}

interface FinishResult {
  attempt_id: string
  score: number
  correct: number
  total: number
}

type SaveStatus = 'saved' | 'saving' | 'error'

// Convierte la hora límite del servidor a hora del reloj local (evita trampas con la hora del dispositivo)
const computeDeadline = (startedAt: string, serverNow: string, minutes: number) => {
  const offset = Date.parse(serverNow) - Date.now()
  return Date.parse(startedAt) + minutes * 60000 - offset
}

const secondsUntil = (deadline: number) => Math.max(0, Math.round((deadline - Date.now()) / 1000))

const friendlyError = (message: string | undefined) => {
  if (!message) return 'Ocurrió un error inesperado.'
  if (message.includes('FALTAN')) return 'Aún tienes preguntas sin responder en esta sección.'
  return message
}

export default function StudentSimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: simulationId } = use(params)

  const [simulation, setSimulation] = useState<SimulationData | null>(null)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentPart, setCurrentPart] = useState<number>(1)
  const [sections, setSections] = useState<Record<number, Question[]>>({ 1: [], 2: [] })
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const [deadline, setDeadline] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [section1Done, setSection1Done] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [advancing, setAdvancing] = useState<boolean>(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [retryTick, setRetryTick] = useState<number>(0)

  const unsavedRef = useRef<Map<string, string>>(new Map())
  const submittingRef = useRef<boolean>(false)
  const autoFinishRef = useRef<boolean>(false)

  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  // ---------- Carga inicial: simulacro, intento (nuevo o retomado) y preguntas ----------
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const { data: simData, error: simError } = await supabase
        .from('simulations')
        .select('id, title, type, duration_minutes_part1, duration_minutes_part2')
        .eq('id', simulationId)
        .single()

      if (simError || !simData) {
        if (isMounted) {
          alert('Error cargando el simulacro')
          router.push('/dashboard/simulations')
        }
        return
      }

      const { data: attemptData, error: attemptError } = await supabase.rpc('start_or_resume_attempt', {
        p_simulation_id: simulationId,
      })

      if (attemptError || !attemptData) {
        if (isMounted) {
          alert(`No se pudo iniciar el intento: ${friendlyError(attemptError?.message)}`)
          router.push('/dashboard/simulations')
        }
        return
      }

      // OJO: ya no se pide is_correct al navegador
      const { data: qData, error: qError } = await supabase
        .from('simulation_questions')
        .select(`
          section_part,
          question_order,
          questions (
            id,
            statement,
            image_url,
            options (
              id,
              option_letter,
              option_text,
              option_image_url
            )
          )
        `)
        .eq('simulation_id', simulationId)
        .order('question_order', { ascending: true })

      if (qError || !qData) {
        if (isMounted) {
          alert('Error cargando las preguntas')
          router.push('/dashboard/simulations')
        }
        return
      }

      if (!isMounted) return

      const grouped: Record<number, Question[]> = { 1: [], 2: [] }
      ;(qData as unknown as SimulationQuestion[]).forEach((sq) => {
        if (!sq.questions) return
        const part = sq.section_part === 2 ? 2 : 1
        grouped[part].push({
          ...sq.questions,
          options: [...(sq.questions.options ?? [])].sort((a, b) =>
            a.option_letter.localeCompare(b.option_letter)
          ),
        })
      })

      const sim = simData as SimulationData
      const attempt = attemptData as AttemptState
      const minutes =
        attempt.current_section === 2 ? sim.duration_minutes_part2 ?? 0 : sim.duration_minutes_part1
      const dl = computeDeadline(attempt.section_started_at, attempt.server_now, minutes)

      setSimulation(sim)
      setSections(grouped)
      setAttemptId(attempt.attempt_id)
      setCurrentPart(attempt.current_section === 2 ? 2 : 1)
      setAnswers(attempt.answers ?? {})
      setDeadline(dl)
      setTimeLeft(secondsUntil(dl))
      setLoading(false)
    }

    init()

    return () => {
      isMounted = false
    }
  }, [supabase, simulationId, router])

  // ---------- Cronómetro (se recalcula contra la hora límite, no se acumula) ----------
  useEffect(() => {
    if (loading || deadline === null) return
    const tick = () => setTimeLeft(secondsUntil(deadline))
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [loading, deadline])

  // ---------- Guardado en tiempo real ----------
  const persistAnswer = useCallback(
    async (questionId: string, optionId: string) => {
      if (!attemptId) return
      const { error } = await supabase.rpc('save_answer', {
        p_attempt_id: attemptId,
        p_question_id: questionId,
        p_option_id: optionId,
      })

      if (error) {
        // Errores definitivos: no tiene sentido reintentar
        if (/Tiempo agotado|ya fue finalizado/i.test(error.message)) {
          unsavedRef.current.delete(questionId)
        }
        setSaveStatus(unsavedRef.current.size === 0 ? 'saved' : 'error')
        return
      }

      if (unsavedRef.current.get(questionId) === optionId) {
        unsavedRef.current.delete(questionId)
      }
      setSaveStatus(unsavedRef.current.size === 0 ? 'saved' : 'saving')
    },
    [supabase, attemptId]
  )

  const flushUnsaved = useCallback(async () => {
    const pending = Array.from(unsavedRef.current.entries())
    await Promise.all(pending.map(([qId, optId]) => persistAnswer(qId, optId)))
  }, [persistAnswer])

  // Reintento automático si hubo fallas de conexión
  useEffect(() => {
    if (!attemptId) return
    const timer = setInterval(() => {
      unsavedRef.current.forEach((optId, qId) => {
        void persistAnswer(qId, optId)
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [attemptId, persistAnswer])

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
    unsavedRef.current.set(questionId, optionId)
    setSaveStatus('saving')
    void persistAnswer(questionId, optionId)
  }

  // ---------- Valores derivados ----------
  const hasTwoSections = (simulation?.duration_minutes_part2 ?? 0) > 0 && sections[2].length > 0
  const questions = sections[currentPart] ?? []
  const unansweredList = questions
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => !answers[q.id])
  const answeredCount = questions.length - unansweredList.length
  const canFinishSection = questions.length > 0 && unansweredList.length === 0
  const showBreak =
    !loading && hasTwoSections && currentPart === 1 && (section1Done || timeLeft <= 0)

  // ---------- Finalizar ----------
  const handleFinish = useCallback(
    async (force: boolean) => {
      if (!attemptId || submittingRef.current) return
      submittingRef.current = true
      setSubmitting(true)

      await flushUnsaved()

      if (!force && unsavedRef.current.size > 0) {
        alert('No se pudieron guardar todas tus respuestas. Revisa tu conexión e inténtalo de nuevo.')
        submittingRef.current = false
        setSubmitting(false)
        return
      }

      const { data, error } = await supabase.rpc('finish_attempt', {
        p_attempt_id: attemptId,
        p_force: force,
      })

      if (error || !data) {
        if (!force) alert(`No se pudo finalizar: ${friendlyError(error?.message)}`)
        submittingRef.current = false
        setSubmitting(false)
        if (force) {
          // Reintenta el envío automático en 5 segundos
          setTimeout(() => {
            autoFinishRef.current = false
            setRetryTick((t) => t + 1)
          }, 5000)
        }
        return
      }

      const result = data as FinishResult
      alert(
        `¡Simulacro finalizado! Tu puntaje es: ${result.score} / 500 (${result.correct} de ${result.total} correctas)`
      )
      router.push(`/dashboard/results/${result.attempt_id}`)
    },
    [attemptId, flushUnsaved, supabase, router]
  )

  // Fin de tiempo: en la última sección se envía solo
  useEffect(() => {
    if (loading || !attemptId || deadline === null || submitting) return
    if (timeLeft > 0 || showBreak || autoFinishRef.current) return
    autoFinishRef.current = true
    void handleFinish(true)
  }, [loading, attemptId, deadline, submitting, timeLeft, showBreak, handleFinish, retryTick])

  // ---------- Pasar a la Sección 2 ----------
  const handleStartSection2 = async () => {
    if (!attemptId || !simulation || advancing) return
    setAdvancing(true)

    await flushUnsaved()
    const expired = timeLeft <= 0

    if (!expired && unsavedRef.current.size > 0) {
      alert('No se pudieron guardar todas tus respuestas. Revisa tu conexión e inténtalo de nuevo.')
      setAdvancing(false)
      return
    }

    const { data, error } = await supabase.rpc('advance_section', {
      p_attempt_id: attemptId,
      p_force: expired,
    })

    if (error || !data) {
      alert(`No se pudo pasar a la Sección 2: ${friendlyError(error?.message)}`)
      setAdvancing(false)
      return
    }

    const att = data as AttemptState
    const dl = computeDeadline(
      att.section_started_at,
      att.server_now,
      simulation.duration_minutes_part2 ?? 0
    )

    setCurrentPart(2)
    setCurrentIndex(0)
    setSection1Done(false)
    setDeadline(dl)
    setTimeLeft(secondsUntil(dl))
    setAdvancing(false)
  }

  // Botón principal de fin de sección / examen
  const handleMainAction = () => {
    if (!canFinishSection || submitting) return

    if (hasTwoSections && currentPart === 1) {
      if (confirm('¿Terminar la Sección 1? Después no podrás volver a ella.')) {
        setSection1Done(true)
      }
      return
    }

    if (confirm('¿Finalizar y enviar el simulacro? No podrás modificar tus respuestas.')) {
      void handleFinish(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // ---------- Render ----------
  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Cargando simulacro...</div>
  }

  if (showBreak) {
    const expired = timeLeft <= 0
    const missing = sections[1].filter((q) => !answers[q.id]).length

    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-md text-center space-y-6">
        <div className="inline-block p-4 bg-amber-50 text-amber-600 rounded-full text-3xl">☕</div>
        <h1 className="text-2xl font-bold text-slate-800">
          {expired ? 'Se terminó el tiempo de la Sección 1' : 'Sección 1 completada'}
        </h1>
        <p className="text-slate-600 text-sm">
          {expired && missing > 0
            ? `Quedaron ${missing} pregunta(s) sin responder en la Sección 1. `
            : ''}
          Tómate un momento para descansar. El tiempo de la <strong>Sección 2</strong> empieza a
          correr cuando presiones el botón y no podrás volver a la Sección 1.
        </p>
        <button
          onClick={handleStartSection2}
          disabled={advancing}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
        >
          {advancing ? 'Cargando...' : 'Iniciar Sección 2'}
        </button>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLastQuestion = currentIndex >= questions.length - 1
  const mainActionLabel =
    hasTwoSections && currentPart === 1 ? 'Terminar Sección 1' : 'Finalizar Examen'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <div>
          <h1 className="font-bold text-sm md:text-base text-slate-100">{simulation?.title}</h1>
          <p className="text-xs text-slate-400">
            {hasTwoSections ? `Sección ${currentPart} de 2` : 'Sesión Única'}
          </p>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          <span
            className={`hidden sm:inline text-[11px] font-semibold ${
              saveStatus === 'saved'
                ? 'text-emerald-400'
                : saveStatus === 'saving'
                ? 'text-slate-400'
                : 'text-rose-400'
            }`}
          >
            {saveStatus === 'saved'
              ? '✓ Guardado'
              : saveStatus === 'saving'
              ? 'Guardando...'
              : '⚠ Sin conexión, reintentando'}
          </span>

          <div
            className={`px-4 py-1.5 rounded-full font-mono text-sm font-bold ${
              timeLeft < 300 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-amber-400'
            }`}
          >
            ⏱ {formatTime(timeLeft)}
          </div>

          <button
            onClick={handleMainAction}
            disabled={submitting || !canFinishSection}
            title={
              canFinishSection
                ? undefined
                : `Te faltan ${unansweredList.length} pregunta(s) por responder`
            }
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? 'Enviando...'
              : canFinishSection
              ? mainActionLabel
              : `Faltan ${unansweredList.length}`}
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          {currentQuestion ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pregunta {currentIndex + 1} de {questions.length}
                </span>
              </div>

              <div className="space-y-4">
                <p className="text-slate-800 text-base md:text-lg leading-relaxed whitespace-pre-line font-medium">
                  {currentQuestion.statement}
                </p>

                {currentQuestion.image_url && (
                  <div className="my-4 max-w-lg mx-auto overflow-hidden rounded-lg border border-slate-200">
                    <img
                      src={currentQuestion.image_url}
                      alt="Apoyo a la pregunta"
                      className="w-full object-contain max-h-80"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opt.option_letter}
                      </span>

                      <div className="flex-1 text-sm text-slate-800 pt-0.5">
                        {opt.option_text && <p>{opt.option_text}</p>}
                        {opt.option_image_url && (
                          <img
                            src={opt.option_image_url}
                            alt={`Opción ${opt.option_letter}`}
                            className="mt-2 max-h-40 rounded border"
                          />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-12">
              No hay preguntas disponibles en esta sección.
            </p>
          )}

          <div className="flex justify-between items-center border-t pt-6 mt-8">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Anterior
            </button>

            {!isLastQuestion ? (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
              >
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleMainAction}
                disabled={submitting || !canFinishSection}
                className={`px-6 py-2 text-white rounded-md text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                  hasTwoSections && currentPart === 1
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {submitting
                  ? 'Enviando...'
                  : canFinishSection
                  ? `${mainActionLabel} →`
                  : `Faltan ${unansweredList.length} por responder`}
              </button>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b pb-2">
            Navegación ({answeredCount}/{questions.length} respondidas)
          </h2>

          <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q.id]
              const isCurrent = idx === currentIndex

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`py-2 text-xs font-bold rounded-md border transition-all ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-600 text-white ring-2 ring-blue-300'
                      : isAnswered
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          {unansweredList.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <p className="text-[11px] font-bold text-rose-600">
                Sin responder ({unansweredList.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {unansweredList.slice(0, 30).map(({ idx }) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                  >
                    {idx + 1}
                  </button>
                ))}
                {unansweredList.length > 30 && (
                  <span className="text-[11px] text-slate-400">...</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
