'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Subject {
  id: string
  name: string
}

interface Resource {
  id: string
  title: string
  description: string | null
  category: 'material_pdf' | 'clase_grabada'
  program_type: string | null
  calendar_group: string | null
  academic_year: number | null
  drive_or_youtube_url: string
  subject_id: string | null
  subjects: { name: string } | null
}

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1, CURRENT_YEAR + 2]

const PROGRAM_OPTIONS = [
  { id: 'preicfes_estandar', label: 'PreICFES Estándar' },
  { id: 'preicfes_intensivo', label: 'PreICFES Intensivo' },
  { id: 'intensivo', label: 'Intensivo' },
  { id: 'megaintensivo', label: 'Megaintensivo' },
]

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])

  // Campos de Formulario (Crear / Editar)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'material_pdf' | 'clase_grabada'>('material_pdf')
  const [programType, setProgramType] = useState<string>('preicfes_estandar')
  const [calendarGroup, setCalendarGroup] = useState<string>('A')
  const [academicYear, setAcademicYear] = useState<number>(CURRENT_YEAR)
  const [url, setUrl] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterProgram, setFilterProgram] = useState<string>('')
  const [filterCalendar, setFilterCalendar] = useState<string>('')
  const [filterYear, setFilterYear] = useState<string>('')
  const [filterSubject, setFilterSubject] = useState<string>('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  // Cargar lista de datos
  const loadData = useCallback(async () => {
    setLoading(true)
    const [resData, subData] = await Promise.all([
      supabase.from('resources').select('*, subjects(name)').order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').order('name'),
    ])

    if (resData.data) setResources(resData.data as unknown as Resource[])
    if (subData.data) {
      setSubjects(subData.data)
      if (subData.data.length > 0 && !selectedSubject) {
        setSelectedSubject(subData.data[0].id)
      }
    }
    setLoading(false)
  }, [supabase, selectedSubject])

  useEffect(() => {
    let isMounted = true

    const fetchInitialData = async () => {
      setLoading(true)
      const [resData, subData] = await Promise.all([
        supabase.from('resources').select('*, subjects(name)').order('created_at', { ascending: false }),
        supabase.from('subjects').select('*').order('name'),
      ])

      if (isMounted) {
        if (resData.data) setResources(resData.data as unknown as Resource[])
        if (subData.data) {
          setSubjects(subData.data)
          if (subData.data.length > 0) {
            setSelectedSubject(subData.data[0].id)
          }
        }
        setLoading(false)
      }
    }

    fetchInitialData()

    return () => { isMounted = false }
  }, [supabase])

  // Lógica de Filtrado en Tiempo Real
  const filteredResources = useMemo(() => {
    return resources.filter((res) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        res.title.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCat =
        filterCategory === '' || res.category === filterCategory

      const matchesProg =
        filterProgram === '' || res.program_type === filterProgram

      const matchesCal =
        filterCalendar === '' || res.calendar_group === filterCalendar

      const matchesYear =
        filterYear === '' || res.academic_year === Number(filterYear)

      const matchesSub =
        filterSubject === '' || res.subject_id === filterSubject

      return matchesSearch && matchesCat && matchesProg && matchesCal && matchesYear && matchesSub
    })
  }, [resources, searchTerm, filterCategory, filterProgram, filterCalendar, filterYear, filterSubject])

  // Resetear Formulario
  const resetForm = () => {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setUrl('')
    setCategory('material_pdf')
    setProgramType('preicfes_estandar')
    setCalendarGroup('A')
    setAcademicYear(CURRENT_YEAR)
    if (subjects.length > 0) setSelectedSubject(subjects[0].id)
  }

  // Guardar o Actualizar Recurso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return

    setSubmitting(true)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      program_type: programType,
      calendar_group: calendarGroup,
      academic_year: academicYear,
      drive_or_youtube_url: url.trim(),
      subject_id: selectedSubject || null,
    }

    if (editingId) {
      const { error } = await supabase
        .from('resources')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        alert(`Error al actualizar recurso: ${error.message}`)
      } else {
        alert('✅ Recurso actualizado con éxito')
        resetForm()
        await loadData()
      }
    } else {
      const { error } = await supabase
        .from('resources')
        .insert(payload)

      if (error) {
        alert(`Error al publicar recurso: ${error.message}`)
      } else {
        resetForm()
        await loadData()
      }
    }

    setSubmitting(false)
  }

  // Cargar datos en el formulario para editar
  const handleEdit = (resource: Resource) => {
    setEditingId(resource.id)
    setTitle(resource.title)
    setDescription(resource.description || '')
    setCategory(resource.category)
    setProgramType(resource.program_type || 'preicfes_estandar')
    setCalendarGroup(resource.calendar_group || 'A')
    setAcademicYear(resource.academic_year || CURRENT_YEAR)
    setUrl(resource.drive_or_youtube_url)
    if (resource.subject_id) setSelectedSubject(resource.subject_id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Eliminar Recurso
  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este recurso?')) return

    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (error) {
      alert(`Error al eliminar: ${error.message}`)
    } else {
      await loadData()
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 selection:bg-orange-500 selection:text-white font-sans">
      
      {/* Luces Ambientales Naranja */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
                Panel de Administración
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Gestión de <span className="text-orange-500">Recursos y Clases</span>
            </h1>
            <p className="text-xs text-slate-400">
              Categorización y administración de guías PDF (Drive) y videoclases (YouTube) por modalidad y calendario
            </p>
          </div>

          <Link
            href="/admin"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all self-start md:self-auto"
          >
            ← Volver al Panel Admin
          </Link>
        </div>

        {/* Formulario (Crear / Editar) */}
        <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span>{editingId ? '✏️' : '➕'}</span>
              {editingId ? 'Modificar Recurso' : 'Agregar Nuevo Recurso Educativo'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-700 transition-all"
              >
                Cancelar Edición ✕
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Título del Recurso *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Taller 1 - Análisis Textual y Lectura Crítica"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Materia o Área *
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tipo de Recurso *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'material_pdf' | 'clase_grabada')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="material_pdf">📄 Documento PDF (Google Drive)</option>
                <option value="clase_grabada">🎬 Clase Grabada (YouTube)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Modalidad / Programa *
              </label>
              <select
                value={programType}
                onChange={(e) => setProgramType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {PROGRAM_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Calendario / Grupo *
              </label>
              <select
                value={calendarGroup}
                onChange={(e) => setCalendarGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer font-bold"
              >
                <option value="A">Calendario A</option>
                <option value="B">Calendario B</option>
                <option value="G">Calendario G</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Año / Cohorte *
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer font-bold"
              >
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    Año {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Enlace / URL del Material *
            </label>
            <input
              type="url"
              required
              placeholder={category === 'material_pdf' ? 'https://drive.google.com/file/d/...' : 'https://www.youtube.com/watch?v=...'}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {submitting
              ? 'Guardando...'
              : editingId
              ? 'Guardar Cambios del Recurso'
              : 'Publicar Recurso Educativo'}
          </button>
        </form>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 shadow-xl backdrop-blur-xl">
          <div className="lg:col-span-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Modalidad
            </label>
            <select
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="">-- Todas --</option>
              {PROGRAM_OPTIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Calendario
            </label>
            <select
              value={filterCalendar}
              onChange={(e) => setFilterCalendar(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="">-- Todos --</option>
              <option value="A">Calendario A</option>
              <option value="B">Calendario B</option>
              <option value="G">Calendario G</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Año
            </label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="">-- Todos --</option>
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Tipo
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="">-- Todos --</option>
              <option value="material_pdf">📄 PDFs</option>
              <option value="clase_grabada">🎬 Clases</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Materia
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              <option value="">-- Todas --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de Recursos Creados */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-xl overflow-hidden">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <span className="font-bold text-white text-xs">Materiales Publicados</span>
            <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black rounded-lg">
              Total: {filteredResources.length}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold space-y-2">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Cargando lista de recursos...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              No se encontraron recursos registrados.
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {filteredResources.map((item) => (
                <li key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                  <div className="space-y-1">
                    <p className="font-bold text-white text-xs leading-relaxed">{item.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-black uppercase ${
                        item.category === 'material_pdf'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {item.category === 'material_pdf' ? '📄 PDF (Drive)' : '🎬 Clase (YouTube)'}
                      </span>
                      
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold rounded uppercase">
                        Cal. {item.calendar_group || 'A'} - {item.academic_year || CURRENT_YEAR}
                      </span>

                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-bold rounded uppercase">
                        {PROGRAM_OPTIONS.find((p) => p.id === item.program_type)?.label || item.program_type || 'Estándar'}
                      </span>

                      <span className="text-slate-500">|</span>
                      
                      <span className="text-slate-400 font-semibold">
                        Materia: {item.subjects?.name || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <a
                      href={item.drive_or_youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-all"
                    >
                      🔗 Enlace
                    </a>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/30 transition-all"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/30 transition-all"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}