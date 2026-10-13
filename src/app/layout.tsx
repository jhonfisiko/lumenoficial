import type { Metadata, Viewport } from 'next'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#f97316', // Color naranja característico de LUMEN para navbars móviles
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://lumenicfes.com'), // Reemplaza por tu dominio oficial en producción
  title: {
    default: 'PRE ICFES LUMEN | Preparación y Simulacros Saber 11°',
    template: '%s | PRE ICFES LUMEN',
  },
  description:
    'Plataforma oficial de entrenamiento PreICFES LUMEN en Colombia. Accede a simulacros interactivos reales, banco de preguntas explicadas, estadísticas por materia y preparación efectiva para la Prueba Saber 11°.',
  keywords: [
    'PreICFES',
    'Preicfes Colombia',
    'Prueba Saber 11',
    'Simulacros ICFES gratis',
    'Examen ICFES 2026',
    'Estrategias ICFES',
    'Preicfes Lumen',
    'Puntaje ICFES',
    'Preguntas ICFES explicadas',
  ],
  authors: [{ name: 'PRE ICFES LUMEN' }],
  creator: 'PRE ICFES LUMEN',
  publisher: 'PRE ICFES LUMEN',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'PRE ICFES LUMEN | Entrenamiento Oficial Saber 11°',
    description:
      'Puntúa más alto en las Pruebas Saber 11°. Simulacros tipo examen, análisis de rendimiento por área y preparación guiada.',
    url: 'https://lumenicfes.com',
    siteName: 'PRE ICFES LUMEN',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/og-image.png', // Coloca una imagen atractiva (1200x630px) en tu carpeta public/
        width: 1200,
        height: 630,
        alt: 'PRE ICFES LUMEN - Plataforma de preparación Saber 11',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRE ICFES LUMEN | Preparación Pruebas Saber 11°',
    description:
      'Mide tus conocimientos con simulacros ICFES reales y estadísticas detalladas por materia.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
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