'use client'

import Link from 'next/link'

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center text-3xl mx-auto">
          ⏳
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Cuenta en Proceso de Validacion</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tu registro en <strong className="text-orange-400">PRE ICFES LUMEN</strong> ha sido recibido con exito. Estamos confirmando tu asignacion de cupo y pago.
          </p>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-300 space-y-2 text-left">
          <p className="font-bold text-amber-400 flex items-center gap-1.5">
            <span>💬</span> ¿Quieres agilizar la activacion?
          </p>
          <p className="text-[11px] text-slate-400">
            Envianos tu comprobante o correo registrado por WhatsApp al <strong>304 127 1545</strong> para activar tu cuenta de inmediato.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <a
            href="https://wa.me/573041271545?text=Hola%20PRE%20ICFES%20LUMEN%20%F0%9F%A7%A1%2C%20acabo%20de%20registrarme%20y%20quiero%20confirmar%20mi%20cuenta."
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <span>Escribir a WhatsApp</span>
          </a>

          <Link
            href="/login"
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
          >
            Volver al inicio de sesion
          </Link>
        </div>
      </div>
    </div>
  )
}