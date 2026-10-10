'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Option {
  id: string
  option_letter: string
  option_text: string | null
  option_image_url: string | null
  is_correct: boolean
}

interface Question {
  id: string
  statement: string
  image_url: string | null
  options: Option[]
}

interface SimulationQuestion {
  section_part: number
  question_order: number
  questions: Question
}

interface SimulationData {
  id: string
  title: string
  type: 'corto' | 'normal_jornadas' | 'tesoro'
  duration_minutes_part1: number
  duration_minutes_part2: number
}

export default function StudentSimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: simulationId } = use(params)
  
  const [simulation, setSimulation] = useState<SimulationData | null>(null)
  const [currentPart, setCurrentPart] = useState<number>(1)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  
  // Control de estado del examen
  const [timeLeft, setTimeLeft] = useState<number>(0) // segundos
  const [isOnBreak, setIsOnBreak] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const fetchInitialSimulation = async () => {
      // 1. Obtener detalles del simulacro
      const { data: simData, error: simError } = await supabase
        .from('simulations')
        .select('*')
        .eq('id', simulationId)
        .single()

      if (simError || !simData) {
        if (isMounted) {
          alert('Error cargando el simulacro')
          router.push('/dashboard/simulations')
        }
        return
      }

      // 2. Cargar preguntas de la Jornada 1
      const { data: qData } = await supabase
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
              option_image_url,
              is_correct
            )
          )
        `)
        .eq('simulation_id', simulationId)
        .order('question_order', { ascending: true })

      if (isMounted) {
        setSimulation(simData as SimulationData)
        setTimeLeft(simData.duration_minutes_part1 * 60)

        if (qData) {
          const formatted = (qData as unknown as SimulationQuestion[])
            .filter((sq) => sq.section_part === 1)
            .map((sq) => sq.questions)
          setQuestions(formatted)
        }
        setLoading(false)
      }
    }

    fetchInitialSimulation()

    return () => {
      isMounted = false
    }
  }, [supabase, simulationId, router])

  // Iniciar Receso / Descanso entre Jornadas
  const startBreak = useCallback(async () => {
    setIsOnBreak(true)

    // Cargar preguntas para la Jornada 2
    const { data: qData } = await supabase
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
            option_image_url,
            is_correct
          )
        )
      `)
      .eq('simulation_id', simulationId)
      .order('question_order', { ascending: true })

    if (qData && simulation) {
      const formatted = (qData as unknown as SimulationQuestion[])
        .filter((sq) => sq.section_part === 2)
        .map((sq) => sq.questions)
      setQuestions(formatted)
      setCurrentPart(2)
      setCurrentIndex(0)
      setTimeLeft(simulation.duration_minutes_part2 * 60)
    }
  }, [supabase, simulationId, simulation])

  // Enviar el examen y calcular el resultado
  const handleFinishExam = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      alert('Error de sesión al enviar respuestas.')
      setSubmitting(false)
      return
    }

    // 1. Calcular aciertos
    let correctCount = 0
    let totalQuestionsCount = 0

    const { data: allOptions } = await supabase
      .from('options')
      .select('id, question_id, is_correct')

    if (allOptions) {
      const optionsMap = new Map(allOptions.map((o) => [o.id, o.is_correct]))
      Object.values(selectedAnswers).forEach((optionId) => {
        if (optionsMap.get(optionId)) correctCount++
      })
      totalQuestionsCount = Object.keys(selectedAnswers).length || 1
    }

    const calculatedScore = Math.round((correctCount / Math.max(totalQuestionsCount, 1)) * 500)

    // 2. Registrar el intento
    const { data: attemptData, error: attemptError } = await supabase
      .from('student_attempts')
      .insert({
        student_id: userData.user.id,
        simulation_id: simulationId,
        score: calculatedScore,
        finished_at: new Date().toISOString(),
        is_completed: true,
      })
      .select()
      .single()

    if (attemptError || !attemptData) {
      alert(`Error al guardar resultados: ${attemptError?.message}`)
      setSubmitting(false)
      return
    }

    // 3. Registrar cada respuesta seleccionada
    const answersPayload = Object.entries(selectedAnswers).map(([qId, optId]) => ({
      attempt_id: attemptData.id,
      question_id: qId,
      selected_option_id: optId,
      is_correct: allOptions?.find((o) => o.id === optId)?.is_correct || false,
    }))

    if (answersPayload.length > 0) {
      await supabase.from('attempt_answers').insert(answersPayload)
    }

    alert(`¡Simulacro finalizado! Tu puntaje estimado es: ${calculatedScore} / 500`)
    router.push(`/dashboard/results/${attemptData.id}`)
  }, [submitting, supabase, selectedAnswers, simulationId, router])

  // Manejo de fin de tiempo por jornada
  const handleTimeExpired = useCallback(() => {
    if (simulation?.type === 'normal_jornadas' && currentPart === 1) {
      alert('¡El tiempo de la primera jornada ha finalizado! Entras en receso.')
      startBreak()
    } else {
      alert('¡El tiempo ha finalizado! Guardando tus respuestas...')
      handleFinishExam()
    }
  }, [simulation, currentPart, startBreak, handleFinishExam])

  // Cronómetro regresivo
  useEffect(() => {
    if (loading || isOnBreak || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleTimeExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, isOnBreak, timeLeft, handleTimeExpired])

  const resumePart2 = () => {
    setIsOnBreak(false)
  }

  // Seleccionar respuesta para la pregunta actual
  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }

  // Formato MM:SS o HH:MM:SS para el cronómetro
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-medium">Cargando simulacro...</div>
  }

  // Pantalla de Receso entre Jornadas
  if (isOnBreak) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-md text-center space-y-6">
        <div className="inline-block p-4 bg-amber-50 text-amber-600 rounded-full text-3xl">☕</div>
        <h1 className="text-2xl font-bold text-slate-800">Receso entre Jornadas</h1>
        <p className="text-slate-600 text-sm">
          Has completado la **Jornada 1**. Tómate un tiempo para descansar. Cuando estés listo, haz clic en el botón para comenzar la **Jornada 2**.
        </p>
        <button
          onClick={resumePart2}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
        >
          Iniciar Jornada 2
        </button>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Encabezado Superior con Cronómetro */}
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <div>
          <h1 className="font-bold text-sm md:text-base text-slate-100">{simulation?.title}</h1>
          <p className="text-xs text-slate-400">
            {simulation?.type === 'normal_jornadas' ? `Jornada ${currentPart}` : 'Sesión Única'}
          </p>
        </div>

        <div className="flex items-center space-x-6">
          <div className={`px-4 py-1.5 rounded-full font-mono text-sm font-bold ${
            timeLeft < 300 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-amber-400'
          }`}>
            ⏱ {formatTime(timeLeft)}
          </div>

          <button
            onClick={() => {
              if (confirm('¿Deseas finalizar y enviar el simulacro ahora?')) handleFinishExam()
            }}
            disabled={submitting}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white rounded-md transition-colors disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Finalizar Examen'}
          </button>
        </div>
      </header>

      {/* Cuerpo Principal */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Pregunta Actual */}
        <div className="lg:col-span-3 bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          {currentQuestion ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Pregunta {currentIndex + 1} de {questions.length}
                </span>
              </div>

              {/* Enunciado e Imagen opcional */}
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

              {/* Opciones de Respuesta */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options
                  .sort((a, b) => a.option_letter.localeCompare(b.option_letter))
                  .map((opt) => {
                    const isSelected = selectedAnswers[currentQuestion.id] === opt.id
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
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700'
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
            <p className="text-slate-500 text-center py-12">No hay preguntas disponibles en esta sección.</p>
          )}

          {/* Botones de Navegación */}
          <div className="flex justify-between items-center border-t pt-6 mt-8">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-4 py-2 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Anterior
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold"
              >
                Siguiente →
              </button>
            ) : simulation?.type === 'normal_jornadas' && currentPart === 1 ? (
              <button
                onClick={startBreak}
                className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold"
              >
                Ir a Receso / Jornada 2 →
              </button>
            ) : (
              <button
                onClick={handleFinishExam}
                disabled={submitting}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold"
              >
                {submitting ? 'Enviando...' : 'Finalizar Examen'}
              </button>
            )}
          </div>
        </div>

        {/* Panel Lateral: Mapa de Preguntas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b pb-2">
            Navegación ({Object.keys(selectedAnswers).length}/{questions.length} respondidas)
          </h2>

          <div className="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto p-1">
            {questions.map((q, idx) => {
              const isAnswered = !!selectedAnswers[q.id]
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
        </div>

      </div>
    </div>
  )
}