'use client'

import { useState, useEffect, useMemo, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AttemptResult {
  id: string
  score: number
  finished_at: string
  simulations: {
    title: string
  } | null
}

interface OptionDetail {
  id: string
  option_letter: string
  option_text: string | null
  is_correct: boolean
}

interface QuestionDetail {
  id: string
  statement: string
  image_url: string | null
  explanation?: string | null
  subjects: { name: string } | null
  options: OptionDetail[]
}

interface AttemptAnswer {
  question_id: string
  selected_option_id: string
  is_correct: boolean
  questions: QuestionDetail
}

// Configuración base de materias según parámetros ICFES
const SUBJECT_CONFIG: Record<string, { weight: number; color: string; emoji: string; key: string }> = {
  matematicas: { weight: 3, color: '#00BFFF', emoji: '🧮', key: 'matematicas' },
  lectura: { weight: 3, color: '#FF1493', emoji: '📖', key: 'lectura' },
  sociales: { weight: 3, color: '#BF00FF', emoji: '🧠', key: 'sociales' },
  ciencias: { weight: 3, color: '#39FF14', emoji: '🔬', key: 'ciencias' },
  ingles: { weight: 1, color: '#FFD700', emoji: '🌍', key: 'ingles' },
}

// Helper flexible para hacer match sin importar mayúsculas, tildes o variaciones de nombre
function getSubjectConfig(subjectName: string) {
  const normalized = subjectName.toLowerCase()
  if (normalized.includes('matem')) return SUBJECT_CONFIG.matematicas
  if (normalized.includes('lectur')) return SUBJECT_CONFIG.lectura
  if (normalized.includes('social') || normalized.includes('ciudadan')) return SUBJECT_CONFIG.sociales
  if (normalized.includes('cienc')) return SUBJECT_CONFIG.ciencias
  if (normalized.includes('ingl')) return SUBJECT_CONFIG.ingles

  return { weight: 1, color: '#6366f1', emoji: '📌', key: 'general' }
}

// Información detallada de Niveles de Desempeño ICFES
const PERFORMANCE_DETAILS: Record<string, Record<string | number, { title: string; general: string }>> = {
  lectura: {
    1: { title: "Nivel 1 (0-35)", general: "Identifica elementos literales en textos continuos y discontinuos sin establecer relaciones." },
    2: { title: "Nivel 2 (36-50)", general: "Comprende textos de forma literal y reconoce relaciones básicas entre elementos." },
    3: { title: "Nivel 3 (51-65)", general: "Interpreta información implícita, distingue estructuras, estrategias y valora argumentos." },
    4: { title: "Nivel 4 (66-100)", general: "Reflexiona críticamente sobre la visión del autor, elementos paratextuales y aplica análisis literario." }
  },
  matematicas: {
    1: { title: "Nivel 1 (0-35)", general: "Interpreta información puntual y situaciones cotidianas simples." },
    2: { title: "Nivel 2 (36-50)", general: "Diferencia procedimientos; asocia conceptos básicos y patrones matemáticos." },
    3: { title: "Nivel 3 (51-70)", general: "Analiza alternativas y elige la mejor solución. Relaciona variables y convierte datos." },
    4: { title: "Nivel 4 (71-100)", general: "Deduce y combina conceptos, ecuaciones y procedimientos complejos." }
  },
  sociales: {
    1: { title: "Nivel 1 (0-40)", general: "Reconoce información básica: hechos y datos sencillos." },
    2: { title: "Nivel 2 (41-55)", general: "Comprende relaciones entre hechos e interpreta conceptos básicos del entorno." },
    3: { title: "Nivel 3 (56-70)", general: "Analiza situaciones, relaciona fuentes y comprende perspectivas sociales multicausales." },
    4: { title: "Nivel 4 (71-100)", general: "Evalúa argumentos, conoce principios constitucionales y propone soluciones ciudadanas." }
  },
  ciencias: {
    1: { title: "Nivel 1 (0-40)", general: "Reconoce información explícita en gráficos o tablas sin interpretación." },
    2: { title: "Nivel 2 (41-55)", general: "Identifica patrones, relaciona esquemas y hace predicciones científicas básicas." },
    3: { title: "Nivel 3 (56-70)", general: "Interrelaciona conceptos y leyes, distingue evidencia de conclusión y plantea hipótesis." },
    4: { title: "Nivel 4 (71-100)", general: "Aplica conceptos, teorías y leyes para resolver problemas científicos complejos." }
  },
  ingles: {
    1: { title: "Nivel A- (0-47)", general: "Por debajo de A1. Vocabulario y estructuras muy básicos." },
    2: { title: "Nivel A1 (48-57)", general: "Comprende y utiliza expresiones cotidianas y frases sencillas." },
    3: { title: "Nivel A2 (58-67)", general: "Comprende frases e intercambia información directa sobre tareas habituales." },
    4.5: { title: "Nivel B1 (68-78)", general: "Comprende puntos principales de textos claros y produce textos sencillos." },
    5: { title: "Nivel B+ (79-100)", general: "Entiende ideas principales de textos complejos y se expresa con naturalidad." }
  }
}

function getPerformanceLevelKey(subjectKey: string, score: number) {
  switch (subjectKey) {
    case 'lectura': if (score <= 35) return 1; if (score <= 50) return 2; if (score <= 65) return 3; return 4;
    case 'matematicas': if (score <= 35) return 1; if (score <= 50) return 2; if (score <= 70) return 3; return 4;
    case 'sociales': if (score <= 40) return 1; if (score <= 55) return 2; if (score <= 70) return 3; return 4;
    case 'ciencias': if (score <= 40) return 1; if (score <= 55) return 2; if (score <= 70) return 3; return 4;
    case 'ingles': if (score <= 47) return 1; if (score <= 57) return 2; if (score <= 67) return 3; if (score <= 78) return 4.5; return 5;
    default: return 1;
  }
}

export default function StudentResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: attemptId } = use(params)

  const [attempt, setAttempt] = useState<AttemptResult | null>(null)
  const [answers, setAnswers] = useState<AttemptAnswer[]>([])
  const [filterMode, setFilterMode] = useState<'all' | 'incorrect' | 'correct'>('all')
  const [viewMode, setViewMode] = useState<'summary' | 'list' | 'review'>('summary')
  const [reviewIndex, setReviewIndex] = useState<number>(0)
  const [modalData, setModalData] = useState<{ title: string; content: { title: string; general: string }[] } | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const fetchResultData = async () => {
      setLoading(true)

      const { data: attemptData } = await supabase
        .from('student_attempts')
        .select('id, score, finished_at, simulations(title)')
        .eq('id', attemptId)
        .single()

      if (!attemptData && isMounted) {
        alert('No se encontró el registro del examen.')
        router.push('/dashboard')
        return
      }

      const { data: answersData } = await supabase
        .from('attempt_answers')
        .select(`
          question_id,
          selected_option_id,
          is_correct,
          questions (
            id,
            statement,
            image_url,
            explanation,
            subjects ( name ),
            options (
              id,
              option_letter,
              option_text,
              is_correct
            )
          )
        `)
        .eq('attempt_id', attemptId)

      if (isMounted) {
        setAttempt(attemptData as unknown as AttemptResult)
        if (answersData) setAnswers(answersData as unknown as AttemptAnswer[])
        setLoading(false)
      }
    }

    fetchResultData()

    return () => { isMounted = false }
  }, [supabase, attemptId, router])

  // Desglose dinámico por materia
  const subjectBreakdown = useMemo(() => {
    const map: Record<string, { correct: number; total: number }> = {}

    answers.forEach((ans) => {
      const rawSubject = ans.questions?.subjects as unknown
      let name = 'General'
      if (Array.isArray(rawSubject) && rawSubject.length > 0) name = rawSubject[0]?.name || 'General'
      else if (rawSubject && typeof rawSubject === 'object' && 'name' in rawSubject) name = (rawSubject as { name: string }).name || 'General'

      if (!map[name]) map[name] = { correct: 0, total: 0 }
      map[name].total += 1
      if (ans.is_correct) map[name].correct += 1
    })

    return Object.entries(map).map(([name, data]) => {
      const config = getSubjectConfig(name)
      const percentage = Math.round((data.correct / Math.max(data.total, 1)) * 100)
      
      return {
        name,
        correct: data.correct,
        total: data.total,
        percentage,
        weight: config.weight,
        color: config.color,
        emoji: config.emoji,
        key: config.key
      }
    })
  }, [answers])

  // Puntaje Global Ponderado ICFES (Escala 0 a 500)
  const calculatedGlobalScore = useMemo(() => {
    if (subjectBreakdown.length === 0) return attempt?.score ?? 0

    let totalWeightedScore = 0
    let totalWeights = 0

    subjectBreakdown.forEach((sb) => {
      totalWeightedScore += sb.percentage * sb.weight
      totalWeights += sb.weight
    })

    return Math.round((totalWeightedScore / Math.max(totalWeights, 1)) * 5)
  }, [subjectBreakdown, attempt])

  const filteredAnswers = useMemo(() => {
    return answers.filter((ans) => {
      if (filterMode === 'correct') return ans.is_correct
      if (filterMode === 'incorrect') return !ans.is_correct
      return true
    })
  }, [answers, filterMode])

  const totalQuestions = answers.length
  const correctCount = answers.filter((a) => a.is_correct).length
  const incorrectCount = totalQuestions - correctCount
  const scoreDegree = Math.round((calculatedGlobalScore / 500) * 360)

  const strongAreas = subjectBreakdown.filter((s) => s.percentage >= 70)
  const weakAreas = subjectBreakdown.filter((s) => s.percentage < 70)

  const openModal = (subjectKey: string, subjectName: string, score: number, type: 'achieved' | 'missing') => {
    const detailsObj = PERFORMANCE_DETAILS[subjectKey]
    if (!detailsObj) return

    const currentLevel = getPerformanceLevelKey(subjectKey, score)
    const allKeys = Object.keys(detailsObj)

    const filteredKeys = type === 'achieved'
      ? allKeys.filter((k) => parseFloat(k) <= parseFloat(String(currentLevel)))
      : allKeys.filter((k) => parseFloat(k) > parseFloat(String(currentLevel)))

    const content = filteredKeys.map((k) => detailsObj[k])

    setModalData({
      title: `${type === 'achieved' ? 'Niveles Alcanzados' : 'Niveles Faltantes'} - ${subjectName}`,
      content
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p>Procesando simulación de puntaje LUMEN...</p>
      </div>
    )
  }

  const activeReviewItem = filteredAnswers[reviewIndex]

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 font-black text-lg">
              L
            </div>
            <div>
              <h1 className="text-xl font-black text-white">{attempt?.simulations?.title || 'Simulacro Evaluativo'}</h1>
              <p className="text-xs text-slate-400">Plataforma de Diagnóstico y Análisis de Resultados LUMEN</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase rounded-xl transition-all"
            >
              ← Volver al Panel
            </Link>

            {totalQuestions > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('summary')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'summary' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  📊 Resumen
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  📋 Lista Completa
                </button>
                <button
                  onClick={() => { setViewMode('review'); setReviewIndex(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'review' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  📖 Pasapalabras
                </button>
              </div>
            )}
          </div>
        </div>

        {totalQuestions === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto text-xl">⚠️</div>
            <p className="text-white font-bold text-base">No hay respuestas registradas en este examen.</p>
            <Link href="/dashboard" className="inline-block px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold uppercase rounded-xl">Ir a Simulacros</Link>
          </div>
        ) : viewMode === 'summary' ? (
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Columna Izquierda */}
            <aside className="lg:col-span-4 space-y-6">
              
              {/* Anillo de Puntaje Global */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-xl backdrop-blur-xl">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Puntaje Global ICFES</h2>
                
                <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full transition-all duration-1000"
                    style={{ background: `conic-gradient(#6366f1 ${scoreDegree}deg, #1e293b 0deg)` }}
                  />
                  <div className="absolute inset-3 bg-slate-950 rounded-full flex flex-col items-center justify-center">
                    <span className="text-5xl font-black text-white">{calculatedGlobalScore}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1">de 500 puntos</span>
                  </div>
                </div>

                <p className={`text-xs font-bold ${calculatedGlobalScore >= 350 ? 'text-emerald-400' : calculatedGlobalScore >= 250 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {calculatedGlobalScore >= 350 ? '🎉 Nivel Sobresaliente' : calculatedGlobalScore >= 250 ? '👍 Buen Camino' : '📈 Necesita Refuerzo'}
                </p>
              </div>

              {/* Resumen Rápido */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resumen Rápido</h2>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-emerald-400 mb-1">Áreas Destacadas</h3>
                    {strongAreas.length > 0 ? (
                      <div className="space-y-1">
                        {strongAreas.map((a) => (
                          <p key={a.name} className="text-xs text-slate-300 font-medium">{a.emoji} {a.name} ({a.percentage} ptos)</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">Ninguna por encima del 70%.</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <h3 className="text-xs font-bold text-rose-400 mb-1">Áreas a Mejorar</h3>
                    {weakAreas.length > 0 ? (
                      <div className="space-y-1">
                        {weakAreas.map((a) => (
                          <p key={a.name} className="text-xs text-slate-300 font-medium">{a.emoji} {a.name} ({a.percentage} ptos)</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">¡Todas las áreas sobre el umbral!</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Indicadores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-emerald-400 uppercase">Aciertos</p>
                  <p className="text-3xl font-black text-emerald-400">{correctCount}</p>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-black text-rose-400 uppercase">Errores</p>
                  <p className="text-3xl font-black text-rose-400">{incorrectCount}</p>
                </div>
              </div>

            </aside>

            {/* Columna Derecha */}
            <main className="lg:col-span-8 space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>📊</span> Calculadora y Diagnóstico por Áreas
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjectBreakdown.map((sb) => (
                    <div
                      key={sb.name}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden"
                      style={{ borderColor: `${sb.color}30` }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{sb.emoji}</span> {sb.name}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                          Peso x{sb.weight}
                        </span>
                      </div>

                      <div className="text-center my-2">
                        <span className="text-4xl font-extrabold" style={{ color: sb.color }}>
                          {sb.percentage}
                        </span>
                        <span className="text-xs text-slate-500"> / 100</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{sb.correct} de {sb.total} preguntas correctas</p>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-900">
                        <button
                          onClick={() => openModal(sb.key, sb.name, sb.percentage, 'achieved')}
                          className="flex-1 py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[11px] font-bold rounded-lg border border-emerald-500/30 transition-all"
                        >
                          Alcanzados
                        </button>
                        <button
                          onClick={() => openModal(sb.key, sb.name, sb.percentage, 'missing')}
                          className="flex-1 py-1.5 px-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[11px] font-bold rounded-lg border border-rose-500/30 transition-all"
                        >
                          Faltantes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>

          </div>
        ) : viewMode === 'review' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <button onClick={() => { setFilterMode('incorrect'); setReviewIndex(0); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${filterMode === 'incorrect' ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>Errores ({incorrectCount})</button>
                <button onClick={() => { setFilterMode('correct'); setReviewIndex(0); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filterMode === 'correct' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>Aciertos ({correctCount})</button>
                <button onClick={() => { setFilterMode('all'); setReviewIndex(0); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filterMode === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Todas ({answers.length})</button>
              </div>
              <span className="text-xs font-bold text-slate-400">Pregunta {reviewIndex + 1} de {filteredAnswers.length}</span>
            </div>

            {activeReviewItem && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg">{(activeReviewItem.questions.subjects as unknown as { name: string })?.name || 'General'}</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${activeReviewItem.is_correct ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{activeReviewItem.is_correct ? '✓ Correcta' : '✕ Incorrecta'}</span>
                </div>

                <p className="text-base font-semibold text-white leading-relaxed">{activeReviewItem.questions.statement}</p>

                {activeReviewItem.questions.image_url && (
                  <div className="max-w-md mx-auto p-2 bg-slate-950 border border-slate-800 rounded-2xl">
                    <img src={activeReviewItem.questions.image_url} alt="Apoyo" className="w-full max-h-60 object-contain rounded-xl" />
                  </div>
                )}

                <div className="space-y-3">
                  {activeReviewItem.questions.options?.sort((a, b) => a.option_letter.localeCompare(b.option_letter)).map((opt) => {
                    const isSelected = activeReviewItem.selected_option_id === opt.id
                    const isTheCorrectOption = opt.is_correct
                    let styleClass = 'border-slate-800 bg-slate-950 text-slate-300'
                    if (isTheCorrectOption) styleClass = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-bold'
                    else if (isSelected && !isTheCorrectOption) styleClass = 'border-rose-500/60 bg-rose-500/10 text-rose-300 font-bold'

                    return (
                      <div key={opt.id} className={`p-4 rounded-2xl border text-xs md:text-sm flex items-start space-x-3 ${styleClass}`}>
                        <span className={`font-black w-6 h-6 rounded-lg flex items-center justify-center text-xs uppercase shrink-0 ${isTheCorrectOption ? 'bg-emerald-500 text-slate-950' : isSelected ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{opt.option_letter}</span>
                        <div className="flex-1 pt-0.5">{opt.option_text}</div>
                        {isSelected && <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 shrink-0">Tu Respuesta</span>}
                      </div>
                    )
                  })}
                </div>

                {/* Explicación Pedagógica Opcional */}
                {activeReviewItem.questions.explanation && (
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-1">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
                      <span>💡</span> Explicación / Retroalimentación:
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {activeReviewItem.questions.explanation}
                    </p>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <button disabled={reviewIndex === 0} onClick={() => setReviewIndex((prev) => prev - 1)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold rounded-xl">← Anterior</button>
                  <button disabled={reviewIndex === filteredAnswers.length - 1} onClick={() => setReviewIndex((prev) => prev + 1)} className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 text-xs font-bold rounded-xl">Siguiente →</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAnswers.map((ans, idx) => {
              const question = ans.questions
              const isCorrect = ans.is_correct
              const rawSubject = question?.subjects as unknown
              let subjectName = 'General'
              if (Array.isArray(rawSubject) && rawSubject.length > 0) subjectName = rawSubject[0]?.name || 'General'
              else if (rawSubject && typeof rawSubject === 'object' && 'name' in rawSubject) subjectName = (rawSubject as { name: string }).name || 'General'

              return (
                <div key={ans.question_id} className={`bg-slate-900 border rounded-3xl p-6 space-y-4 ${isCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase">Pregunta #{idx + 1}</span>
                      <span className="px-2.5 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-md">{subjectName}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{isCorrect ? '✓ Correcta' : '✕ Incorrecta'}</span>
                  </div>

                  <p className="text-slate-100 text-sm font-semibold">{question?.statement}</p>

                  <div className="space-y-2 pt-2">
                    {question?.options?.sort((a, b) => a.option_letter.localeCompare(b.option_letter)).map((opt) => {
                      const isSelected = ans.selected_option_id === opt.id
                      const isTheCorrectOption = opt.is_correct
                      let styleClass = 'border-slate-800 bg-slate-950 text-slate-300'
                      if (isTheCorrectOption) styleClass = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-bold'
                      else if (isSelected && !isTheCorrectOption) styleClass = 'border-rose-500/60 bg-rose-500/10 text-rose-300 font-bold'

                      return (
                        <div key={opt.id} className={`p-3 rounded-2xl border text-xs md:text-sm flex items-start space-x-3 ${styleClass}`}>
                          <span className={`font-black w-6 h-6 rounded-lg flex items-center justify-center text-xs uppercase ${isTheCorrectOption ? 'bg-emerald-500 text-slate-950' : isSelected ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{opt.option_letter}</span>
                          <div className="flex-1 pt-0.5">{opt.option_text}</div>
                          {isSelected && <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20 shrink-0">Tu respuesta</span>}
                        </div>
                      )
                    })}
                  </div>

                  {question?.explanation && (
                    <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-1 mt-2">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase">
                        <span>💡</span> Explicación / Retroalimentación:
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Modal de Niveles */}
        {modalData && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white">{modalData.title}</h3>
                <button onClick={() => setModalData(null)} className="text-slate-400 hover:text-white text-lg font-bold">✕</button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {modalData.content.length > 0 ? (
                  modalData.content.map((item, i) => (
                    <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                      <p className="text-xs font-bold text-indigo-400">{item.title}</p>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{item.general}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 text-center py-4">No hay niveles registrados para esta categoría.</p>
                )}
              </div>

              <button onClick={() => setModalData(null)} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-all">
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}