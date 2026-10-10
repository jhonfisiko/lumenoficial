import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PRE ICFES LUMEN | Preparación Saber 11°',
  description:
    'Plataforma oficial de entrenamiento PreICFES LUMEN. Simulacros reales, estadísticas por materia y clases en vivo.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}