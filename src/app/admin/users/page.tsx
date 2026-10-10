'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface UserProfile {
  id: string
  full_name: string
  status: 'pending' | 'approved' | 'rejected'
  subscription_type: 'simulacro_unico' | 'preicfes_completo' | null
  calendar: string | null
  access_start_date: string | null
  access_end_date: string | null
  institutions: { name: string } | null
}

interface InstitutionOption {
  id: string
  name: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [institutionsList, setInstitutionsList] = useState<InstitutionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Filtros y Paginación
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInstitution, setSelectedInstitution] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)

  const supabase = createClient()

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const [usersRes, instRes] = await Promise.all([
      supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          status,
          subscription_type,
          calendar,
          access_start_date,
          access_end_date,
          institutions ( name )
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('institutions')
        .select('id, name')
        .order('name', { ascending: true })
    ])

    if (!usersRes.error && usersRes.data) {
      setUsers(usersRes.data as unknown as UserProfile[])
    }
    if (!instRes.error && instRes.data) {
      setInstitutionsList(instRes.data as InstitutionOption[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    const fetchInitialData = async () => {
      setLoading(true)
      const [usersRes, instRes] = await Promise.all([
        supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            status,
            subscription_type,
            calendar,
            access_start_date,
            access_end_date,
            institutions ( name )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('institutions')
          .select('id, name')
          .order('name', { ascending: true })
      ])

      if (isMounted) {
        if (!usersRes.error && usersRes.data) {
          setUsers(usersRes.data as unknown as UserProfile[])
        }
        if (!instRes.error && instRes.data) {
          setInstitutionsList(instRes.data as InstitutionOption[])
        }
        setLoading(false)
      }
    }

    fetchInitialData()

    return () => {
      isMounted = false
    }
  }, [supabase])

  // Lógica de filtrado en cliente
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm.trim() === '' ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesInst =
        selectedInstitution === '' ||
        (selectedInstitution === 'independiente'
          ? !user.institutions?.name
          : user.institutions?.name === selectedInstitution)

      const matchesStatus =
        selectedStatus === '' || user.status === selectedStatus

      return matchesSearch && matchesInst && matchesStatus
    })
  }, [users, searchTerm, selectedInstitution, selectedStatus])

  // Lógica de paginación
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  const handleUpdateStatus = async (
    userId: string,
    newStatus: 'approved' | 'rejected',
    subscriptionType?: 'simulacro_unico' | 'preicfes_completo',
    startDate?: string,
    endDate?: string
  ) => {
    setUpdatingId(userId)

    const updatePayload: Record<string, unknown> = {
      status: newStatus,
    }

    if (newStatus === 'approved') {
      if (!subscriptionType) {
        alert('Debes seleccionar un tipo de suscripción para aprobar.')
        setUpdatingId(null)
        return
      }
      updatePayload.subscription_type = subscriptionType
      if (startDate) updatePayload.access_start_date = new Date(startDate).toISOString()
      if (endDate) updatePayload.access_end_date = new Date(endDate).toISOString()
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)

    if (error) {
      alert(`Error actualizando el usuario: ${error.message}`)
    } else {
      await loadUsers()
    }
    setUpdatingId(null)
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 selection:bg-orange-500 selection:text-white">
      
      {/* Luces Ambientales Naranja */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado Principal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider rounded-lg">
                Gestión de Estudiantes
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Administración de <span className="text-orange-500">Usuarios</span>
            </h1>
            <p className="text-xs text-slate-400">
              Validación manual de matrículas, permisos de acceso y asignación de planes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
            >
              ← Volver al Panel
            </Link>

            <button
              onClick={loadUsers}
              className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
            >
              🔄 Refrescar
            </button>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shadow-xl backdrop-blur-xl">
          
          {/* Búsqueda por Nombre */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Buscar Estudiante
            </label>
            <input
              type="text"
              placeholder="Escribe un nombre..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>

          {/* Filtro por Colegio */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Filtrar por Colegio
            </label>
            <select
              value={selectedInstitution}
              onChange={(e) => {
                setSelectedInstitution(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
            >
              <option value="">-- Todos los Colegios --</option>
              <option value="independiente">Independiente / Ninguno</option>
              {institutionsList.map((inst) => (
                <option key={inst.id} value={inst.name}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Filtrar por Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
            >
              <option value="">-- Todos los Estados --</option>
              <option value="pending">En Espera (Pendiente)</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>

          {/* Cantidad de Usuarios Visibles */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Registros por Página
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all cursor-pointer"
            >
              <option value={10}>10 usuarios</option>
              <option value={20}>20 usuarios (Predeterminado)</option>
              <option value={50}>50 usuarios</option>
              <option value={100}>100 usuarios</option>
            </select>
          </div>

        </div>

        {/* Tabla Principal */}
        {loading ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-400">Cargando base de datos de usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-2">
            <p className="text-3xl">🔍</p>
            <p className="text-sm font-bold text-slate-300">No se encontraron estudiantes con los filtros actuales.</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedInstitution('')
                setSelectedStatus('')
                setCurrentPage(1)
              }}
              className="text-xs font-bold text-orange-400 hover:underline mt-2 inline-block"
            >
              Limpiar todos los filtros
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Estudiante</th>
                    <th className="p-4">Colegio</th>
                    <th className="p-4">Calendario</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Plan de Estudio</th>
                    <th className="p-4">Vigencia Acceso</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedUsers.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      isUpdating={updatingId === user.id}
                      onUpdate={handleUpdateStatus}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginador */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs text-slate-400">
              <p>
                Mostrando <span className="font-bold text-slate-200">{paginatedUsers.length}</span> de{' '}
                <span className="font-bold text-slate-200">{filteredUsers.length}</span> estudiantes filtrados
              </p>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-bold disabled:opacity-40 hover:bg-slate-800 transition-colors"
                >
                  ◀ Anterior
                </button>
                <span className="font-semibold text-slate-300 px-2">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 font-bold disabled:opacity-40 hover:bg-slate-800 transition-colors"
                >
                  Siguiente ▶
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function UserRow({
  user,
  isUpdating,
  onUpdate,
}: {
  user: UserProfile
  isUpdating: boolean
  onUpdate: (
    id: string,
    status: 'approved' | 'rejected',
    subType?: 'simulacro_unico' | 'preicfes_completo',
    startDate?: string,
    endDate?: string
  ) => void
}) {
  const [selectedType, setSelectedType] = useState<'simulacro_unico' | 'preicfes_completo'>(
    user.subscription_type || 'preicfes_completo'
  )
  const [startDate, setStartDate] = useState(
    user.access_start_date ? user.access_start_date.split('T')[0] : ''
  )
  const [endDate, setEndDate] = useState(
    user.access_end_date ? user.access_end_date.split('T')[0] : ''
  )

  return (
    <tr className="hover:bg-slate-800/30 transition-colors">
      <td className="p-4 font-bold text-white">{user.full_name || 'Sin Nombre'}</td>
      <td className="p-4 text-slate-300">{user.institutions?.name || 'Independiente'}</td>
      <td className="p-4">
        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-bold text-[10px] rounded uppercase">
          {user.calendar ? `Cal. ${user.calendar}` : 'N/A'}
        </span>
      </td>
      <td className="p-4">
        <span
          className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
            user.status === 'approved'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : user.status === 'rejected'
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
          }`}
        >
          {user.status === 'pending'
            ? 'En Espera'
            : user.status === 'approved'
            ? 'Aprobado'
            : 'Rechazado'}
        </span>
      </td>
      <td className="p-4">
        <select
          value={selectedType}
          onChange={(e) =>
            setSelectedType(e.target.value as 'simulacro_unico' | 'preicfes_completo')
          }
          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
        >
          <option value="preicfes_completo">PreICFES Completo</option>
          <option value="simulacro_unico">Simulacro Único</option>
        </select>
      </td>
      <td className="p-4">
        <div className="flex items-center space-x-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-orange-500"
          />
          <span className="text-slate-600">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-orange-500"
          />
        </div>
      </td>
      <td className="p-4 text-right space-x-2">
        <button
          disabled={isUpdating}
          onClick={() => onUpdate(user.id, 'approved', selectedType, startDate, endDate)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg disabled:opacity-50 transition-colors shadow-sm"
        >
          {isUpdating ? '...' : 'Aprobar'}
        </button>
        <button
          disabled={isUpdating}
          onClick={() => onUpdate(user.id, 'rejected')}
          className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[11px] rounded-lg disabled:opacity-50 transition-colors shadow-sm"
        >
          Rechazar
        </button>
      </td>
    </tr>
  )
}