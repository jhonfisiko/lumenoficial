'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Resource {
  id: string
  title: string
  description?: string | null
  category: 'material_pdf' | 'clase_grabada'
  program_type?: 'preicfes_estandar' | 'preicfes_intensivo' | 'intensivo' | 'megaintensivo' | string
  calendar_group?: 'A' | 'B' | 'G' | string
  drive_or_youtube_url: string
  subjects: { name: string } | null
}

const PROGRAM_CATEGORIES = [
  { id: 'todos', label: 'Todas las Modalidades' },
  { id: 'preicfes_estandar', label: 'PreICFES Estándar' },
  { id: 'preicfes_intensivo', label: 'PreICFES Intensivo' },
  { id: 'intensivo', label: 'Intensivo' },
  { id: 'megaintensivo', label: 'Megaintensivo' },
]

const CALENDAR_GROUPS = [
  { id: 'todos', label: 'Todos los Grupos' },
  { id: 'A', label: 'Calendario A' },
  { id: 'B', label: 'Calendario B' },
  { id: 'G', label: 'Calendario G' },
]

export default function StudentMaterialsPage() {
  const [resources, setResources] = useState<Resource[]>([])
  const [subscriptionType, setSubscriptionType] = useState<string | null>(null)
  
  // Filtros
  const [activeTab, setActiveTab] = useState<'todos' | 'material_pdf' | 'clase_grabada'>('todos')
  const [selectedProgram, setSelectedProgram] = useState<string>('todos')
  const [selectedCalendar, setSelectedCalendar] = useState<string>('todos')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchMaterialsData = async () => {
      // 1. Obtener perfil de usuario para validar plan de acceso
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_type')
          .eq('id', user.id)
          .single()

        if (isMounted && profile) {
          setSubscriptionType(profile.subscription_type)
        }
      }

      // 2. Cargar recursos educativos
      const { data: resData, error } = await supabase
        .from('resources')
        .select('id, title, description, category, program_type, calendar_group, drive_or_youtube_url, subjects(name)')
        .order('created_at', { ascending: false })

      if (isMounted) {
        if (!error && resData) {
          setResources(resData as unknown as Resource[])
        } else if (error) {
          console.error('Error cargando recursos:', error)
        }
        setLoading(false)
      }
    }

    fetchMaterialsData()

    return () => {
      isMounted = false
    }
  }, [supabase])

  // Función para obtener URL del iframe de YouTube
  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-xs font-semibold space-y-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p>Cargando biblioteca de materiales...</p>
      </div>
    )
  }

  // Restricción para usuarios de tipo Simulacro Único
  if (subscriptionType === 'simulacro_unico') {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            🔒
          </div>
          <h1 className="text-xl font-black text-white">Acceso Exclusivo PreICFES Completo</h1>
          <p className="text-slate-400 text-xs leading-relaxed">
            Tu plan actual es <strong className="text-amber-400">Simulacro Único</strong>. Para acceder a la biblioteca de guías teóricas en PDF y videoclases grabadas, solicita la actualización de tu plan.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
          >
            ← Volver al Inicio
          </Link>
        </div>
      </div>
    )
  }

  // Obtener lista de materias únicas para el filtro
  const availableSubjects = Array.from(
    new Set(resources.map((r) => r.subjects?.name).filter(Boolean))
  ) as string[]

  // Filtrado exhaustivo de recursos
  const filteredResources = resources.filter((res) => {
    const matchesCategory = activeTab === 'todos' || res.category === activeTab
    const matchesProgram = selectedProgram === 'todos' || res.program_type === selectedProgram
    const matchesCalendar = selectedCalendar === 'todos' || res.calendar_group === selectedCalendar
    const matchesSubject = selectedSubject === '' || res.subjects?.name === selectedSubject
    const matchesSearch = searchTerm.trim() === '' || res.title.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesProgram && matchesCalendar && matchesSubject && matchesSearch
  })

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 selection:bg-orange-500 selection:text-white">
      
      {/* Luces Ambientales Naranja */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
                Biblioteca Digital LUMEN
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Material de <span className="text-orange-500">Estudio y Clases</span>
            </h1>
            <p className="text-xs text-slate-400">
              Filtra por modalidad (PreICFES, Intensivo, Megaintensivo) y Calendario (A, B, G)
            </p>
          </div>

          <Link
            href="/dashboard"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all self-start md:self-auto"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Panel de Filtros y Búsqueda */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 md:p-6 shadow-xl backdrop-blur-xl space-y-5">
          
          {/* Pestañas de Tipo de Recurso */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
            <button
              onClick={() => setActiveTab('todos')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'todos'
                  ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Todos ({resources.length})
            </button>
            <button
              onClick={() => setActiveTab('material_pdf')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'material_pdf'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              📄 Material PDF (Drive)
            </button>
            <button
              onClick={() => setActiveTab('clase_grabada')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'clase_grabada'
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              🎬 Clases Grabadas (YouTube)
            </button>
          </div>

          {/* Filtros Secundarios: Modalidad y Calendario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-slate-800/60">
            {/* Modalidades / Programas */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Modalidad / Programa:</label>
              <div className="flex flex-wrap gap-1.5">
                {PROGRAM_CATEGORIES.map((prog) => (
                  <button
                    key={prog.id}
                    onClick={() => setSelectedProgram(prog.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedProgram === prog.id
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {prog.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendarios / Cohortes (A, B, G) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Calendario / Grupo:</label>
              <div className="flex flex-wrap gap-1.5">
                {CALENDAR_GROUPS.map((cal) => (
                  <button
                    key={cal.id}
                    onClick={() => setSelectedCalendar(cal.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedCalendar === cal.id
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {cal.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Buscador y Selección de Materia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Buscar por Título
              </label>
              <input
                type="text"
                placeholder="🔍 Escribe un tema o concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Filtrar por Materia
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <option value="">-- Todas las Materias --</option>
                {availableSubjects.map((subName) => (
                  <option key={subName} value={subName}>
                    {subName}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Tarjetas de Recursos */}
        {filteredResources.length === 0 ? (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs font-semibold">
            No se encontraron recursos que coincidan con los filtros seleccionados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((item) => {
              const isPdf = item.category === 'material_pdf'
              const embedUrl = !isPdf ? getYouTubeEmbedUrl(item.drive_or_youtube_url) : null

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-xl flex flex-col justify-between hover:border-slate-700 transition-all space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                          isPdf
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isPdf ? '📄 Documento PDF' : '🎬 Clase Grabada'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {item.calendar_group && (
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                            Cal. {item.calendar_group}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                          {item.subjects?.name || 'General'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors leading-snug">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    {!isPdf && embedUrl ? (
                      <button
                        onClick={() => setActiveVideoUrl(embedUrl)}
                        className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl text-center block transition-all shadow-lg shadow-rose-600/20"
                      >
                        ▶ Ver Clase Aquí
                      </button>
                    ) : (
                      <a
                        href={item.drive_or_youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-center block transition-all shadow-lg ${
                          isPdf
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                            : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                        }`}
                      >
                        {isPdf ? 'Abrir en Google Drive ↗' : 'Ver Clase en YouTube ↗'}
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Modal para ver video de YouTube integrado */}
      {activeVideoUrl && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-4 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-bold text-slate-300">🎬 Reproductor de Clase</span>
              <button
                onClick={() => setActiveVideoUrl(null)}
                className="text-xs font-bold text-rose-400 hover:underline"
              >
                Cerrar Video ✖
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 bg-black">
              <iframe
                src={activeVideoUrl}
                title="Clase Grabada"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}