'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const checkAdminAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          if (isMounted) router.push('/login')
          return
        }

        // Consultar el rol en profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        const isAdmin = profile?.role === 'admin' || user.email === 'lumenicfes@gmail.com'

        if (!isAdmin) {
          console.warn('Acceso denegado: Se intentó ingresar a una subruta admin sin permisos.')
          if (isMounted) router.push('/dashboard')
          return
        }

        if (isMounted) {
          setAuthorized(true)
          setLoading(false)
        }
      } catch (err) {
        console.error('Error al validar sesión en Admin Layout:', err)
        if (isMounted) router.push('/dashboard')
      }
    }

    checkAdminAuth()

    return () => {
      isMounted = false
    }
  }, [supabase, router])

  // Mostrar pantalla de carga mientras se verifica la sesión para que NO parpadee el contenido
  if (loading || !authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-400">Verificando credenciales de administrador...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}