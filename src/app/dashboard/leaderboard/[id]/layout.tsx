import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tabla de Liderazgo | PRE ICFES LUMEN',
  description: 'Ranking y posiciones en vivo del simulacro tipo tesoro.',
}

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}