'use client'

import { useState, useEffect, use, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
  subject_id: string
  subjects: { name: string } | null
  options: Option[]
}

interface SimulationQuestionRel {
  section_part: number
  question_order: number
  questions: Question
}

interface SimulationData {
  id: string
  title: string
  description: string | null
  type: string
  duration_minutes_part1: number
  duration_minutes_part2: number
  simulation_questions: SimulationQuestionRel[]
}

export default function TakeSimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: simulationId } = use(params)

  const [simulation, setSimulation] = useState<SimulationData | null>(null)
  const [activePart, setActivePart] = useState<1 | 2>(1)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}) // question_id -> option_id
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const fetchSimulation = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('simulations')
        .select(`
          id,
          title,
          description,
          type,
          duration_minutes_part1,
          duration_minutes_part2,
          simulation_questions (
            section_part,
            question_order,
            questions (
              id,
              statement,
              image_url,
              subject_id,
              subjects ( name ),
              options (
                id,
                option_letter,
                option_text,
                option_image_url,
                is_correct
              )
            )
          )
        `)
        .eq('id', simulationId)
        .single()

      if (error || !data) {
        if (isMounted) {
          alert('No se pudo cargar el simulacro.')
          router.push('/dashboard')
        }
        return
      }

      if (isMounted) {
        const simData = data as unknown as SimulationData
        setSimulation(simData)
        
        const initialMinutes = simData.duration_minutes_part1 || 60
        setTimeLeft(initialMinutes * 60)

        setLoading(false)
      }
    }

    fetchSimulation()

    return () => {
      isMounted = false
    }
  }, [supabase, simulationId, router])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const currentQuestions = useMemo(() => {
    if (!simulation?.simulation_questions) return []

    return simulation.simulation_questions
      .filter((sq) => sq.section_part === activePart && sq.questions)
      .sort((a, b) => (a.question_order || 0) - (b.question_order || 0))
      .map((sq) => sq.questions)
  }, [simulation, activePart])

  const activeQuestion = currentQuestions[currentIndex]

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }))
  }

  const handleFinishExam = async () => {
    if (submitting) return
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Sesión expirada.')
        setSubmitting(false)
        return
      }

      // 1. Aplanar lista completa de preguntas
      const allQuestions = (simulation?.simulation_questions || [])
        .map((sq) => sq.questions)
        .filter(Boolean)

      let correctAnswersCount = 0

      // 2. Mapear cada respuesta seleccionada
      const answersToInsert = Object.entries(selectedAnswers).map(([questionId, selectedOptionId]) => {
        const question = allQuestions.find((q) => q.id === questionId)
        const selectedOption = question?.options?.find((opt) => opt.id === selectedOptionId)
        const isCorrect = selectedOption?.is_correct ?? false

        if (isCorrect) correctAnswersCount++

        return {
          question_id: questionId,
          selected_option_id: selectedOptionId,
          is_correct: isCorrect,
        }
      })

      const totalQuestionsCount = allQuestions.length
      const calculatedScore = totalQuestionsCount > 0
        ? Math.round((correctAnswersCount / totalQuestionsCount) * 500)
        : 0

      // 3. Insertar intento principal en student_attempts
      const { data: attemptData, error: attemptErr } = await supabase
        .from('student_attempts')
        .insert({
          student_id: user.id,
          simulation_id: simulationId,
          score: calculatedScore,
          finished_at: new Date().toISOString(),
          is_completed: true,
        })
        .select('id')
        .single()

      if (attemptErr || !attemptData) {
        alert(`Error al registrar el intento: ${attemptErr?.message}`)
        setSubmitting(false)
        return
      }

      const newAttemptId = attemptData.id

      // 4. Insertar respuestas detalladas en attempt_answers
      if (answersToInsert.length > 0) {
        const payloadWithAttemptId = answersToInsert.map((ans) => ({
          attempt_id: newAttemptId,
          ...ans,
        }))

        const { error: answersErr } = await supabase
          .from('attempt_answers')
          .insert(payloadWithAttemptId)

        if (answersErr) {
          alert(`Inconveniente al guardar el desglose: ${answersErr.message}`)
        }
      }

      router.push(`/dashboard/results/${newAttemptId}`)

    } catch (err) {
      console.error('Error al entregar el examen:', err)
      setSubmitting(false)
    }
  }

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
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold space-y-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p>Preparando tu cuadernillo de examen...</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        
        {/* Header Examen */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between sticky top-4 z-20">
          <div>
            <span className="text-[10px] text-orange-400 font-bold uppercase">Sesión Evaluativa</span>
            <h1 className="text-base font-black text-white">{simulation?.title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl font-mono text-amber-400 font-black">
              ⏱ {timeLeft !== null ? formatTime(timeLeft) : '00:00'}
            </div>

            <button
              onClick={handleFinishExam}
              disabled={submitting}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black text-xs uppercase rounded-xl transition-all disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : 'Finalizar Examen ➔'}
            </button>
          </div>
        </div>

        {/* Cuadernillo */}
        {currentQuestions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
            No se encontraron preguntas en esta jornada.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <span className="text-xs font-black text-slate-400 uppercase">
                  Pregunta {currentIndex + 1} de {currentQuestions.length}
                </span>
                <span className="px-2.5 py-1 bg-slate-800 text-orange-400 text-[10px] font-bold rounded-lg">
                  {activeQuestion?.subjects?.name || 'Materia General'}
                </span>
              </div>

              <div className="space-y-4">
                <p className="text-slate-100 text-sm md:text-base font-semibold leading-relaxed">
                  {activeQuestion?.statement}
                </p>

                {activeQuestion?.image_url && (
                  <div className="max-w-lg mx-auto p-2 bg-slate-950 border border-slate-800 rounded-2xl">
                    <img src={activeQuestion.image_url} alt="Apoyo" className="w-full max-h-72 object-contain rounded-xl" />
                  </div>
                )}
              </div>

              {/* Opciones */}
              <div className="space-y-3 pt-2">
                {activeQuestion?.options
                  ?.sort((a, b) => a.option_letter.localeCompare(b.option_letter))
                  .map((opt) => {
                    const isSelected = selectedAnswers[activeQuestion.id] === opt.id

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleSelectOption(activeQuestion.id, opt.id)}
                        className={`w-full text-left p-4 rounded-2xl border text-xs md:text-sm flex items-start space-x-3 transition-all ${
                          isSelected
                            ? 'bg-orange-500/10 border-orange-500 text-orange-300'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className={`font-black w-6 h-6 rounded-lg flex items-center justify-center text-xs uppercase shrink-0 ${
                          isSelected ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {opt.option_letter}
                        </span>

                        <div className="flex-1 pt-0.5 space-y-2">
                          {opt.option_text && <p>{opt.option_text}</p>}
                          {opt.option_image_url && (
                            <img src={opt.option_image_url} alt={`Opción ${opt.option_letter}`} className="max-h-36 rounded-lg border border-slate-800" />
                          )}
                        </div>
                      </button>
                    )
                  })}
              </div>

              {/* Navegación */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold rounded-xl"
                >
                  ← Anterior
                </button>

                <button
                  disabled={currentIndex === currentQuestions.length - 1}
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-slate-950 font-black text-xs uppercase rounded-xl"
                >
                  Siguiente →
                </button>
              </div>

            </div>

            {/* Hoja de Respuestas */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 self-start">
              <h3 className="text-xs font-black text-white uppercase border-b border-slate-800 pb-2">
                Mapa de Preguntas
              </h3>

              <div className="grid grid-cols-5 gap-2">
                {currentQuestions.map((q, idx) => {
                  const isAnswered = Boolean(selectedAnswers[q.id])
                  const isCurrent = idx === currentIndex

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-9 rounded-xl text-xs font-black transition-all border ${
                        isCurrent
                          ? 'border-orange-500 bg-orange-500 text-slate-950'
                          : isAnswered
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-800 bg-slate-950 text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}