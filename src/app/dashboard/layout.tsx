'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [authorized, setAuthorized] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isMounted) router.push('/login')
        return
      }

      // Consultar perfil para verificar rol, estado y token de sesión activa
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_session_id, role, status')
        .eq('id', user.id)
        .maybeSingle()

      // Si la cuenta está pendiente de aprobación, enviarlo a la lista de espera
      if (profile?.status === 'pending') {
        if (isMounted) router.push('/pending-approval')
        return
      }

      // Control de Sesión Única (Únicamente para estudiantes)
      if (profile?.role !== 'admin') {
        const localSessionId = localStorage.getItem('lumen_session_id')

        if (
          profile?.active_session_id &&
          localSessionId &&
          profile.active_session_id !== localSessionId
        ) {
          alert('Se ha iniciado sesión en otro dispositivo o navegador con esta cuenta.')
          await supabase.auth.signOut()
          localStorage.removeItem('lumen_session_id')
          if (isMounted) router.push('/login')
          return
        }
      }

      if (isMounted) setAuthorized(true)
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [supabase, router])

  if (!authorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}