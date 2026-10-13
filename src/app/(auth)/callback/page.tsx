'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Procesando enlace de recuperación...')
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Escuchar el evento de autenticación cuando Supabase parsea el hash #access_token
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        if (session) {
          router.push('/reset-password')
        }
      } else if (event === 'SIGNED_OUT') {
        setStatus('El enlace ha expirado o es inválido.')
        setTimeout(() => router.push('/login'), 2500)
      }
    })

    // Comprobación de respaldo por si la sesión ya estaba lista
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/reset-password')
      }
    }

    checkInitialSession()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 space-y-3 font-sans">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-semibold text-slate-400">{status}</p>
    </div>
  )
}