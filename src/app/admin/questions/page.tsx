'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Subject {
  id: string
  name: string
}

interface OptionInput {
  id?: string
  letter: string
  text: string
  imageUrl: string
  isCorrect: boolean
}

interface QuestionItem {
  id: string
  statement: string
  image_url: string | null
  subject_id: string
  created_at: string
  options: {
    id: string
    option_letter: string
    option_text: string | null
    option_image_url: string | null
    is_correct: boolean
  }[]
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']

export default function AdminQuestionsPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create')

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState('')
  const [newSubjectName, setNewSubjectName] = useState('')

  // Estado para preguntas cargadas
  const [existingQuestions, setExistingQuestions] = useState<QuestionItem[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Estado del formulario de preguntas (Crear / Editar)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [statement, setStatement] = useState('')
  const [questionImageUrl, setQuestionImageUrl] = useState('')

  // Control de subida de imágenes
  const [uploadingQuestionImg, setUploadingQuestionImg] = useState(false)
  const [uploadingOptionIdx, setUploadingOptionIdx] = useState<number | null>(null)

  // Opciones iniciales
  const [options, setOptions] = useState<OptionInput[]>([
    { letter: 'A', text: '', imageUrl: '', isCorrect: true },
    { letter: 'B', text: '', imageUrl: '', isCorrect: false },
    { letter: 'C', text: '', imageUrl: '', isCorrect: false },
    { letter: 'D', text: '', imageUrl: '', isCorrect: false },
  ])

  // Modal de confirmación para eliminar materia
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')
  const [deletingSubject, setDeletingSubject] = useState(false)

  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  // Cargar Materias
  const loadSubjects = useCallback(async () => {
    setLoadingSubjects(true)
    const { data } = await supabase.from('subjects').select('*').order('name')
    if (data) {
      setSubjects(data)
      if (data.length > 0) {
        setSelectedSubject((prev) => (prev ? prev : data[0].id))
      }
    }
    setLoadingSubjects(false)
  }, [supabase])

  // Cargar Preguntas de la Materia Seleccionada (para llamadas manuales después de guardar/eliminar)
  const loadQuestionsBySubject = useCallback(async (subjectId: string) => {
    if (!subjectId) return
    setLoadingQuestions(true)
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        statement,
        image_url,
        subject_id,
        created_at,
        options (
          id,
          option_letter,
          option_text,
          option_image_url,
          is_correct
        )
      `)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setExistingQuestions(data as unknown as QuestionItem[])
    }
    setLoadingQuestions(false)
  }, [supabase])

  // Cargar materias en el montaje inicial
  useEffect(() => {
    let isMounted = true

    const fetchInitialSubjects = async () => {
      setLoadingSubjects(true)
      const { data } = await supabase.from('subjects').select('*').order('name')
      if (isMounted && data) {
        setSubjects(data)
        if (data.length > 0) {
          setSelectedSubject((prev) => (prev ? prev : data[0].id))
        }
        setLoadingSubjects(false)
      }
    }

    fetchInitialSubjects()

    return () => {
      isMounted = false
    }
  }, [supabase])

  // Reactividad cuando cambia la materia seleccionada
  useEffect(() => {
    if (!selectedSubject) return

    let isMounted = true

    const fetchQuestions = async () => {
      setLoadingQuestions(true)
      const { data, error } = await supabase
        .from('questions')
        .select(`
          id,
          statement,
          image_url,
          subject_id,
          created_at,
          options (
            id,
            option_letter,
            option_text,
            option_image_url,
            is_correct
          )
        `)
        .eq('subject_id', selectedSubject)
        .order('created_at', { ascending: false })

      if (isMounted) {
        if (!error && data) {
          setExistingQuestions(data as unknown as QuestionItem[])
        } else {
          setExistingQuestions([])
        }
        setLoadingQuestions(false)
      }
    }

    fetchQuestions()

    return () => {
      isMounted = false
    }
  }, [selectedSubject, supabase])

  // Subir archivo a Supabase Storage
  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `questions/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('questions')
        .upload(filePath, file)

      if (uploadError) {
        alert(`Error subiendo imagen: ${uploadError.message}`)
        return null
      }

      const { data } = supabase.storage.from('questions').getPublicUrl(filePath)
      return data.publicUrl
    } catch (err) {
      console.error('Error procesando imagen:', err)
      return null
    }
  }

  const handleQuestionImageUpload = async (file: File) => {
    setUploadingQuestionImg(true)
    const url = await uploadImageToStorage(file)
    if (url) setQuestionImageUrl(url)
    setUploadingQuestionImg(false)
  }

  const handleOptionImageUpload = async (index: number, file: File) => {
    setUploadingOptionIdx(index)
    const url = await uploadImageToStorage(file)
    if (url) {
      const updated = [...options]
      updated[index].imageUrl = url
      setOptions(updated)
    }
    setUploadingOptionIdx(null)
  }

  const addOption = () => {
    if (options.length >= LETTERS.length) return
    const nextLetter = LETTERS[options.length]
    setOptions([...options, { letter: nextLetter, text: '', imageUrl: '', isCorrect: false }])
  }

  const removeOption = () => {
    if (options.length <= 2) return
    const newOptions = options.slice(0, -1)
    if (!newOptions.some((o) => o.isCorrect)) {
      newOptions[0].isCorrect = true
    }
    setOptions(newOptions)
  }

  const handleOptionTextChange = (index: number, text: string) => {
    const updated = [...options]
    updated[index].text = text
    setOptions(updated)
  }

  const handleSetCorrect = (index: number) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }))
    setOptions(updated)
  }

  // Cargar datos en el formulario para editar
  const handleEditQuestion = (question: QuestionItem) => {
    setEditingQuestionId(question.id)
    setStatement(question.statement)
    setQuestionImageUrl(question.image_url || '')

    if (question.options && question.options.length > 0) {
      const sortedOptions = [...question.options].sort((a, b) =>
        a.option_letter.localeCompare(b.option_letter)
      )
      setOptions(
        sortedOptions.map((o) => ({
          id: o.id,
          letter: o.option_letter,
          text: o.option_text || '',
          imageUrl: o.option_image_url || '',
          isCorrect: o.is_correct,
        }))
      )
    }
    setActiveTab('create')
  }

  // Cancelar Edición
  const resetForm = () => {
    setEditingQuestionId(null)
    setStatement('')
    setQuestionImageUrl('')
    setOptions([
      { letter: 'A', text: '', imageUrl: '', isCorrect: true },
      { letter: 'B', text: '', imageUrl: '', isCorrect: false },
      { letter: 'C', text: '', imageUrl: '', isCorrect: false },
      { letter: 'D', text: '', imageUrl: '', isCorrect: false },
    ])
  }

  // Eliminar una pregunta
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta? Se borrarán sus opciones vinculadas.')) {
      return
    }

    const { error } = await supabase.from('questions').delete().eq('id', questionId)

    if (error) {
      alert(`Error eliminando pregunta: ${error.message}`)
    } else {
      alert('Pregunta eliminada con éxito.')
      if (selectedSubject) loadQuestionsBySubject(selectedSubject)
    }
  }

  // Crear nueva materia
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubjectName.trim()) return

    const { data, error } = await supabase
      .from('subjects')
      .insert({ name: newSubjectName.trim() })
      .select()
      .single()

    if (error) {
      alert(`Error creando materia: ${error.message}`)
    } else if (data) {
      setNewSubjectName('')
      await loadSubjects()
      setSelectedSubject(data.id)
    }
  }

  // Eliminar materia con clave de admin
  const handleDeleteSubjectWithAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminPassword || !selectedSubject) return

    setDeletingSubject(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      alert('Error obteniendo datos del usuario activo.')
      setDeletingSubject(false)
      return
    }

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: adminPassword,
    })

    if (authErr) {
      alert('Contraseña incorrecta. No se pudo eliminar la materia.')
      setDeletingSubject(false)
      return
    }

    const { error: deleteErr } = await supabase
      .from('subjects')
      .delete()
      .eq('id', selectedSubject)

    if (deleteErr) {
      alert(`Error eliminando materia: ${deleteErr.message}`)
    } else {
      alert('Materia eliminada correctamente.')
      setShowDeleteModal(false)
      setAdminPassword('')
      setSelectedSubject('')
      await loadSubjects()
    }

    setDeletingSubject(false)
  }

  // Guardar / Actualizar pregunta
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubject) {
      alert('Por favor selecciona una materia.')
      return
    }
    if (!statement.trim()) {
      alert('Escribe el enunciado de la pregunta.')
      return
    }

    setSubmitting(true)

    if (editingQuestionId) {
      // ACTUALIZAR PREGUNTA EXISTENTE
      const { error: qError } = await supabase
        .from('questions')
        .update({
          subject_id: selectedSubject,
          statement: statement.trim(),
          image_url: questionImageUrl.trim() || null,
        })
        .eq('id', editingQuestionId)

      if (qError) {
        alert(`Error al actualizar la pregunta: ${qError.message}`)
        setSubmitting(false)
        return
      }

      await supabase.from('options').delete().eq('question_id', editingQuestionId)

      const optionsPayload = options.map((opt) => ({
        question_id: editingQuestionId,
        option_letter: opt.letter,
        option_text: opt.text.trim() || null,
        option_image_url: opt.imageUrl.trim() || null,
        is_correct: opt.isCorrect,
      }))

      const { error: optError } = await supabase.from('options').insert(optionsPayload)

      if (optError) {
        alert(`Error al actualizar las opciones: ${optError.message}`)
      } else {
        alert('¡Pregunta actualizada con éxito!')
        resetForm()
        loadQuestionsBySubject(selectedSubject)
      }
    } else {
      // CREAR NUEVA PREGUNTA
      const { data: questionData, error: qError } = await supabase
        .from('questions')
        .insert({
          subject_id: selectedSubject,
          statement: statement.trim(),
          image_url: questionImageUrl.trim() || null,
        })
        .select()
        .single()

      if (qError || !questionData) {
        alert(`Error al guardar la pregunta: ${qError?.message}`)
        setSubmitting(false)
        return
      }

      const optionsPayload = options.map((opt) => ({
        question_id: questionData.id,
        option_letter: opt.letter,
        option_text: opt.text.trim() || null,
        option_image_url: opt.imageUrl.trim() || null,
        is_correct: opt.isCorrect,
      }))

      const { error: optError } = await supabase.from('options').insert(optionsPayload)

      if (optError) {
        alert(`Error al guardar las opciones: ${optError.message}`)
      } else {
        alert('¡Pregunta guardada con éxito!')
        resetForm()
        loadQuestionsBySubject(selectedSubject)
      }
    }

    setSubmitting(false)
  }

  // Filtrado de preguntas en tiempo real
  const filteredQuestionsList = existingQuestions.filter((q) =>
    q.statement.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 selection:bg-orange-500 selection:text-white">
      
      {/* Luces Ambientales */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
                Módulo Evaluativo
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Banco de <span className="text-orange-500">Preguntas</span>
            </h1>
            <p className="text-xs text-slate-400">
              Creación, edición y administración de preguntas ICFES por materia
            </p>
          </div>

          <Link
            href="/admin"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all self-start md:self-auto"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Sección 1: Materia o Área del Saber */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <span>📚</span> 1. Materia o Área del Saber
          </h2>

          {loadingSubjects ? (
            <p className="text-xs text-slate-400 font-semibold">Cargando materias...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Materia Seleccionada
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value)
                      resetForm()
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {subjects.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>

                  {selectedSubject && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl transition-all"
                      title="Eliminar esta materia"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleCreateSubject} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nueva Materia (Ej: Inglés)"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl whitespace-nowrap border border-slate-700 transition-all"
                >
                  + Crear
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Navegación por Pestañas */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'create'
                ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {editingQuestionId ? '✏️ Editando Pregunta' : '➕ Crear Pregunta'}
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
              activeTab === 'list'
                ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>📋 Preguntas Guardadas</span>
            <span className="px-2 py-0.5 bg-slate-950/80 text-white rounded-md text-[10px] font-black">
              {existingQuestions.length}
            </span>
          </button>
        </div>

        {/* PESTAÑA 1: FORMULARIO CREAR / EDITAR */}
        {activeTab === 'create' && (
          <form onSubmit={handleSaveQuestion} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>📝</span> {editingQuestionId ? 'Modificar Pregunta' : '2. Enunciado y Contexto'}
              </h2>
              {editingQuestionId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-700"
                >
                  Cancelar Edición ✖
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Enunciado / Texto de la pregunta *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escribe aquí la pregunta o lectura de apoyo..."
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Zona Drag & Drop */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Imagen para el Enunciado (Arrastra un archivo o pega la URL)
                </label>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files?.[0]) {
                      handleQuestionImageUpload(e.dataTransfer.files[0])
                    }
                  }}
                  className="border-2 border-dashed border-slate-800 hover:border-orange-500/50 bg-slate-950 rounded-2xl p-4 text-center cursor-pointer transition-all space-y-2"
                >
                  {uploadingQuestionImg ? (
                    <p className="text-xs text-orange-400 font-bold animate-pulse">Subiendo imagen a Supabase Storage...</p>
                  ) : questionImageUrl ? (
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={questionImageUrl} alt="Pregunta" className="max-h-40 mx-auto rounded-lg border border-slate-800" />
                      <button
                        type="button"
                        onClick={() => setQuestionImageUrl('')}
                        className="text-[10px] font-bold text-rose-400 hover:underline"
                      >
                        Quitar Imagen
                      </button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Arrastra aquí una imagen o haz clic para subir</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleQuestionImageUpload(e.target.files[0])}
                        className="hidden"
                        id="question-img-input"
                      />
                      <label htmlFor="question-img-input" className="text-[10px] font-bold text-orange-400 cursor-pointer hover:underline block mt-1">
                        Seleccionar Archivo Local
                      </label>
                    </div>
                  )}
                </div>

                <input
                  type="url"
                  placeholder="O pega una URL externa: https://..."
                  value={questionImageUrl}
                  onChange={(e) => setQuestionImageUrl(e.target.value)}
                  className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Opciones de Respuesta */}
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <span>🎯</span> 3. Opciones de Respuesta
                </h2>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={addOption}
                    disabled={options.length >= LETTERS.length}
                    className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-bold text-xs rounded-xl disabled:opacity-40 transition-all border border-orange-500/20"
                  >
                    + Opción ({LETTERS[options.length] || 'Máx'})
                  </button>
                  <button
                    type="button"
                    onClick={removeOption}
                    disabled={options.length <= 2}
                    className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl disabled:opacity-40 transition-all border border-rose-500/20"
                  >
                    - Quitar Última
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {options.map((opt, idx) => (
                  <div
                    key={opt.letter}
                    className={`p-4 rounded-2xl border transition-all ${
                      opt.isCorrect
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-slate-800 bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-white text-xs">Opción {opt.letter}</span>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="correct_option"
                          checked={opt.isCorrect}
                          onChange={() => handleSetCorrect(idx)}
                          className="accent-emerald-500 h-4 w-4 cursor-pointer"
                        />
                        <span className={`text-xs font-bold ${opt.isCorrect ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {opt.isCorrect ? '✓ Respuesta Correcta' : 'Marcar Correcta'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder={`Texto opción ${opt.letter}`}
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                      />

                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (e.dataTransfer.files?.[0]) {
                            handleOptionImageUpload(idx, e.dataTransfer.files[0])
                          }
                        }}
                        className="border border-slate-800 bg-slate-900 rounded-xl p-2 flex items-center justify-between text-xs"
                      >
                        {uploadingOptionIdx === idx ? (
                          <span className="text-[10px] text-orange-400 font-bold animate-pulse">Subiendo...</span>
                        ) : opt.imageUrl ? (
                          <div className="flex items-center gap-2 w-full justify-between">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={opt.imageUrl} alt={`Opción ${opt.letter}`} className="h-8 rounded" />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...options]
                                updated[idx].imageUrl = ''
                                setOptions(updated)
                              }}
                              className="text-[10px] text-rose-400 font-bold"
                            >
                              Quitar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] text-slate-500">Arrastra una imagen aquí</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => e.target.files?.[0] && handleOptionImageUpload(idx, e.target.files[0])}
                              className="hidden"
                              id={`opt-img-${idx}`}
                            />
                            <label htmlFor={`opt-img-${idx}`} className="text-[10px] font-bold text-orange-400 cursor-pointer hover:underline">
                              Examinar
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              {submitting
                ? 'Guardando...'
                : editingQuestionId
                ? 'Actualizar Pregunta'
                : 'Guardar Pregunta en el Banco'}
            </button>
          </form>
        )}

        {/* PESTAÑA 2: VISOR / LISTA DE PREGUNTAS */}
        {activeTab === 'list' && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
            
            {/* Buscador de preguntas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <input
                type="text"
                placeholder="🔍 Buscar pregunta por texto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:max-w-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
              <span className="text-xs font-bold text-slate-400">
                Mostrando {filteredQuestionsList.length} de {existingQuestions.length} preguntas
              </span>
            </div>

            {loadingQuestions ? (
              <div className="text-center py-12 space-y-2">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">Cargando preguntas de la materia...</p>
              </div>
            ) : filteredQuestionsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <p className="text-3xl">📭</p>
                <p className="text-xs font-bold text-slate-300">No hay preguntas guardadas para esta materia aún.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestionsList.map((q, index) => (
                  <div
                    key={q.id}
                    className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-black text-[10px] rounded-md uppercase">
                          Pregunta #{index + 1}
                        </span>
                        <p className="text-xs font-bold text-white leading-relaxed">{q.statement}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditQuestion(q)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition-all"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/30 transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {q.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={q.image_url} alt="Adjunto" className="max-h-32 rounded-lg border border-slate-800" />
                    )}

                    {/* Opciones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-900">
                      {q.options?.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                            opt.is_correct
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-bold'
                              : 'bg-slate-900/50 border-slate-800/80 text-slate-400'
                          }`}
                        >
                          <span className="font-black px-1.5 py-0.5 bg-slate-950 rounded text-[10px]">
                            {opt.option_letter}
                          </span>
                          <span className="truncate">{opt.option_text || '(Opción con imagen)'}</span>
                          {opt.is_correct && <span className="ml-auto text-emerald-400">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Modal de Eliminación Segura con Contraseña */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-white">⚠️ Eliminar Materia</h3>
            <p className="text-xs text-slate-400">
              Esta acción es irreversible y eliminará la materia elegida. Por seguridad, ingresa tu contraseña de administrador para confirmar:
            </p>

            <form onSubmit={handleDeleteSubjectWithAuth} className="space-y-4">
              <input
                type="password"
                required
                placeholder="Tu contraseña de administrador"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setAdminPassword('')
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deletingSubject}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all"
                >
                  {deletingSubject ? 'Validando...' : 'Confirmar Eliminación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}