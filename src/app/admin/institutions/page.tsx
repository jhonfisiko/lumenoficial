'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Institution {
  id: string
  name: string
  code: string | null
  city: string | null
  default_calendar: string | null
  contact_email: string | null
  created_at: string
}

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  
  // Formulario
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [city, setCity] = useState('')
  const [defaultCalendar, setDefaultCalendar] = useState('A')
  const [contactEmail, setContactEmail] = useState('')

  // Buscador y Estado
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  // Cargar lista de instituciones
  const loadInstitutions = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setInstitutions(data as Institution[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    const fetchInitialInstitutions = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .order('created_at', { ascending: false })

      if (isMounted) {
        if (!error && data) {
          setInstitutions(data as Institution[])
        }
        setLoading(false)
      }
    }

    fetchInitialInstitutions()

    return () => {
      isMounted = false
    }
  }, [supabase])

  // Filtrado de instituciones en tiempo real
  const filteredInstitutions = useMemo(() => {
    return institutions.filter((inst) => {
      const term = searchTerm.toLowerCase().trim()
      if (!term) return true
      return (
        inst.name.toLowerCase().includes(term) ||
        (inst.code && inst.code.toLowerCase().includes(term)) ||
        (inst.city && inst.city.toLowerCase().includes(term))
      )
    })
  }, [institutions, searchTerm])

  // Crear o Actualizar Institución
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSubmitting(true)

    const payload = {
      name: name.trim(),
      code: code.trim() || null,
      city: city.trim() || null,
      default_calendar: defaultCalendar,
      contact_email: contactEmail.trim() || null,
    }

    if (editingId) {
      const { error } = await supabase.from('institutions').update(payload).eq('id', editingId)
      if (error) {
        alert(`Error al actualizar institución: ${error.message}`)
      } else {
        alert('Institución actualizada con éxito')
        resetForm()
        await loadInstitutions()
      }
    } else {
      const { error } = await supabase.from('institutions').insert(payload)
      if (error) {
        alert(`Error al crear institución: ${error.message}`)
      } else {
        resetForm()
        await loadInstitutions()
      }
    }

    setSubmitting(false)
  }

  const handleEdit = (inst: Institution) => {
    setEditingId(inst.id)
    setName(inst.name)
    setCode(inst.code || '')
    setCity(inst.city || '')
    setDefaultCalendar(inst.default_calendar || 'A')
    setContactEmail(inst.contact_email || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setCode('')
    setCity('')
    setDefaultCalendar('A')
    setContactEmail('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta institución?')) return

    const { error } = await supabase.from('institutions').delete().eq('id', id)
    if (error) {
      alert(`Error al eliminar: ${error.message}`)
    } else {
      await loadInstitutions()
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 selection:bg-orange-500 selection:text-white">
      
      {/* Luces Ambientales Naranja */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
                Directorio Académico
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Gestión de <span className="text-orange-500">Instituciones y Colegios</span>
            </h1>
            <p className="text-xs text-slate-400">
              Registra y parametriza colegios para la vinculación de alumnos, reportes grupales y asignación de simulacros
            </p>
          </div>

          <Link
            href="/admin"
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all self-start md:self-auto"
          >
            ← Volver al Panel
          </Link>
        </div>

        {/* Formulario (Crear / Editar) */}
        <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <span>🏫</span>
              {editingId ? 'Modificar Institución' : 'Agregar Nueva Institución'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 bg-slate-800 text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancelar Edición ✖
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Nombre del Colegio / Institución *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Colegio San José"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Código DANE / Interno (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: CSJ-2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Ciudad / Municipio (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Pasto, Nariño"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Calendario Predeterminado
              </label>
              <select
                value={defaultCalendar}
                onChange={(e) => setDefaultCalendar(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-orange-500 cursor-pointer font-bold"
              >
                <option value="A">Calendario A</option>
                <option value="B">Calendario B</option>
                <option value="G">Calendario G</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Correo de Contacto (Opcional)
              </label>
              <input
                type="email"
                placeholder="rectoria@sanjose.edu.co"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {submitting
              ? 'Guardando...'
              : editingId
              ? 'Actualizar Institución'
              : 'Guardar Institución'}
          </button>
        </form>

        {/* Buscador */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Buscar Colegio
          </label>
          <input
            type="text"
            placeholder="🔍 Escribe un nombre, código o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>

        {/* Lista de Instituciones Creadas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-xl overflow-hidden">
          <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center">
            <span className="font-bold text-white text-xs">Colegios e Instituciones Registradas</span>
            <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black rounded-lg">
              Total: {filteredInstitutions.length}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold space-y-2">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Cargando lista de instituciones...</p>
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              No se encontraron colegios creados.
            </div>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {filteredInstitutions.map((inst) => (
                <li key={inst.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                  <div className="space-y-1">
                    <p className="font-bold text-white text-xs leading-relaxed">{inst.name}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      {inst.code && (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-bold rounded uppercase">
                          Cód: {inst.code}
                        </span>
                      )}
                      {inst.city && (
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-bold rounded uppercase">
                          📍 {inst.city}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold rounded uppercase">
                        Cal. {inst.default_calendar || 'A'}
                      </span>
                      {inst.contact_email && (
                        <span className="text-slate-400 font-semibold">
                          ✉️ {inst.contact_email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => handleEdit(inst)}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl border border-amber-500/30 transition-all"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDelete(inst.id)}
                      className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/30 transition-all"
                    >
                      🗑️
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