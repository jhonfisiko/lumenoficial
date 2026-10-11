'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const whatsappNumber = '573041271545'

  const getWhatsappLink = (programName: string, price: string) => {
    const text = `Hola PRE ICFES LUMEN ⚡, quiero inscribirme al programa *${programName}* por *${price}*. ¿Me ayudan a confirmar mi cupo?`
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
  }

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${
        isDarkMode
          ? 'bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white'
          : 'bg-[#E7E4DC] text-[#04439A] selection:bg-[#FCCA3C] selection:text-[#04439A]'
      }`}
    >
      {/* 1. Header / Navbar */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
          isDarkMode
            ? 'bg-slate-950/80 border-slate-800'
            : 'bg-[#E7E4DC]/90 border-[#3B639E]/20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-md ${
                isDarkMode
                  ? 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-orange-500/20'
                  : 'bg-[#FCCA3C] text-[#04439A]'
              }`}
            >
              ⚡
            </div>
            <div>
              <span
                className={`text-xl font-black tracking-tight block leading-none ${
                  isDarkMode ? 'text-white' : 'text-[#04439A]'
                }`}
              >
                PRE ICFES{' '}
                <span className={isDarkMode ? 'text-orange-500' : 'text-[#3B639E]'}>
                  LUMEN
                </span>
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${
                  isDarkMode ? 'text-amber-400' : 'text-[#04439A]/80'
                }`}
              >
                Puntajes 415+
              </span>
            </div>
          </div>

          <nav
            className={`hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider ${
              isDarkMode ? 'text-slate-300' : 'text-[#04439A]'
            }`}
          >
            <a
              href="#programas"
              className={isDarkMode ? 'hover:text-orange-400' : 'hover:text-[#3B639E]'}
            >
              Programas
            </a>
            <a
              href="#beneficios"
              className={isDarkMode ? 'hover:text-orange-400' : 'hover:text-[#3B639E]'}
            >
              Beneficios
            </a>
            <a
              href="#faq"
              className={isDarkMode ? 'hover:text-orange-400' : 'hover:text-[#3B639E]'}
            >
              FAQ
            </a>
            <a
              href="#contacto"
              className={isDarkMode ? 'hover:text-orange-400' : 'hover:text-[#3B639E]'}
            >
              Contacto
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            {/* BOTÓN TOGGLE MODO OSCURO / MODO CLARO */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                  : 'bg-white border-[#3B639E]/20 text-[#04439A] hover:bg-slate-100 shadow-sm'
              }`}
              title="Cambiar tema de color"
            >
              {isDarkMode ? '☀️ Claro' : '🌙 Oscuro'}
            </button>

            <Link
              href="/login"
              className={`px-3 sm:px-4 py-2 text-xs font-bold transition-colors ${
                isDarkMode ? 'text-slate-300 hover:text-white' : 'text-[#04439A] hover:opacity-80'
              }`}
            >
              Iniciar Sesión
            </Link>

            <Link
              href="/register"
              className={`px-4 sm:px-5 py-2.5 font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] ${
                isDarkMode
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/20'
                  : 'bg-[#04439A] hover:bg-[#3B639E] text-white'
              }`}
            >
              Registrarme
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8 relative z-10">
          <div
            className={`inline-flex items-center space-x-2 px-4 py-1.5 border text-xs font-bold rounded-full uppercase tracking-widest shadow-sm ${
              isDarkMode
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'bg-[#FFFFFF] border-[#3B639E]/20 text-[#04439A]'
            }`}
          >
            <span>⚡ Tres formas de prepararte para el ICFES</span>
          </div>

          <h1
            className={`text-4xl sm:text-6xl lg:text-7xl font-black leading-tight tracking-tight ${
              isDarkMode ? 'text-white' : 'text-[#04439A]'
            }`}
          >
            Estrategias reales que te llevan a sacar{' '}
            <span
              className={
                isDarkMode
                  ? 'bg-gradient-to-r from-orange-400 via-amber-300 to-amber-500 bg-clip-text text-transparent'
                  : 'bg-[#FCCA3C] px-3 py-1 rounded-2xl inline-block text-[#04439A]'
              }
            >
              más de 415 puntos
            </span>
          </h1>

          <p
            className={`text-base sm:text-lg max-w-3xl mx-auto leading-relaxed font-semibold ${
              isDarkMode ? 'text-slate-300 font-normal' : 'text-[#3B639E]'
            }`}
          >
            Clases en vivo, simulacros reales con calificación detallada y acompañamiento cercano paso a paso. Elige el calendario que se ajuste a tu fecha de examen.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <a
              href="#programas"
              className={`w-full sm:w-auto px-8 py-4 font-black rounded-2xl shadow-lg transition-all hover:scale-105 text-sm uppercase tracking-wider ${
                isDarkMode
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
                  : 'bg-[#04439A] hover:bg-[#3B639E] text-white'
              }`}
            >
              Ver Planes y Precios ⚡
            </a>
            <a
              href={getWhatsappLink('Consulta General', 'Preicfes')}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full sm:w-auto px-8 py-4 border font-bold rounded-2xl transition-all text-sm flex items-center justify-center space-x-2 ${
                isDarkMode
                  ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-[#FFFFFF] hover:bg-white/80 border-[#3B639E]/30 text-[#04439A] shadow-sm'
              }`}
            >
              <span>Escríbenos por WhatsApp 💬</span>
            </a>
          </div>

          {/* Destacados rápido */}
          <div
            className={`pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 border-t max-w-4xl mx-auto ${
              isDarkMode ? 'border-slate-800/80' : 'border-[#3B639E]/20'
            }`}
          >
            {[
              { title: '415 – 491', sub: 'Puntaje de Profesores' },
              { title: '5 Áreas', sub: 'Cobertura Total ICFES' },
              { title: 'VIP 24/7', sub: 'Grupo de WhatsApp' },
              { title: '100%', sub: 'Simulacros Reales' },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border ${
                  isDarkMode
                    ? 'bg-slate-900/50 border-slate-800'
                    : 'bg-[#FFFFFF] border-[#3B639E]/15 shadow-sm'
                }`}
              >
                <p
                  className={`text-2xl font-black ${
                    isDarkMode ? 'text-orange-400' : 'text-[#04439A]'
                  }`}
                >
                  {item.title}
                </p>
                <p
                  className={`text-xs font-medium mt-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-[#3B639E] font-bold'
                  }`}
                >
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Sección de Programas y Precios */}
      <section id="programas" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span
            className={`text-xs font-extrabold uppercase tracking-widest ${
              isDarkMode ? 'text-orange-500' : 'text-[#3B639E]'
            }`}
          >
            Inscripciones Abiertas
          </span>
          <h2
            className={`text-3xl sm:text-5xl font-black ${
              isDarkMode ? 'text-white' : 'text-[#04439A]'
            }`}
          >
            Elige la opción que se adapte a ti
          </h2>
          <p
            className={`text-sm max-w-2xl mx-auto ${
              isDarkMode ? 'text-slate-400' : 'text-[#3B639E] font-medium'
            }`}
          >
            Llévalos individualmente o aprovecha nuestros combos para asegurar tus oportunidades de ingresar a la universidad.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Card 1: Calendario G */}
          <div
            className={`rounded-3xl border p-8 flex flex-col justify-between space-y-6 transition-all ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-800 hover:border-orange-500/50'
                : 'bg-[#FFFFFF] border-[#3B639E]/20 hover:shadow-xl'
            }`}
          >
            <div className="space-y-4">
              <span
                className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-full border inline-block ${
                  isDarkMode
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : 'bg-[#E7E4DC] text-[#04439A] border-[#3B639E]/20'
                }`}
              >
                🔥 Nuestro Enfoque Principal
              </span>
              <h3 className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-[#04439A]'}`}>
                PRE-ICFES CALENDARIO G
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#3B639E] font-medium'}`}>
                Preparación completa para quienes presentan el ICFES bajo el Calendario G.
              </p>

              <div className={`py-2 border-y ${isDarkMode ? 'border-slate-800' : 'border-[#3B639E]/15'}`}>
                <p className={`text-xs line-through font-semibold ${isDarkMode ? 'text-slate-500' : 'text-[#3B639E]/70'}`}>
                  $340.000 COP
                </p>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-[#04439A]'}`}>
                    $340.000
                  </span>
                  <span className={`text-xs font-bold ${isDarkMode ? 'text-orange-400' : 'text-[#3B639E]'}`}>
                    Precio por etapas
                  </span>
                </div>
                <p className={`text-[11px] font-medium mt-1 ${isDarkMode ? 'text-amber-400/90' : 'text-[#04439A] font-semibold'}`}>
                  ✅ El precio sube progresivamente hasta $340.000. Inscribirte hoy te asegura este valor.
                </p>
              </div>

              <div className={`space-y-2.5 text-xs ${isDarkMode ? 'text-slate-300' : 'text-[#04439A]'}`}>
                <p className={`font-bold ${isDarkMode ? 'text-orange-400' : 'text-[#3B639E]'}`}>
                  📅 Clases: 17 de octubre al 5 de diciembre
                </p>
                <ul className="space-y-2">
                  {[
                    'Clases en vivo lunes a viernes, 7pm a 9pm (hora Colombia)',
                    'Simulacros tipo ICFES con calificación y retroalimentación detallada',
                    'Plataforma de estudio con grabaciones y banco de preguntas',
                    'Grupo VIP de acompañamiento por WhatsApp',
                    'Las 5 áreas: Lectura Crítica, Matemáticas, Ciencias Naturales, Sociales e Inglés',
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start space-x-2">
                      <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-[#04439A]'}`}>✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <a
              href={getWhatsappLink('Calendario G', '$340.000')}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3.5 font-extrabold text-xs rounded-xl text-center block transition-all shadow-md uppercase tracking-wider ${
                isDarkMode
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                  : 'bg-[#04439A] hover:bg-[#3B639E] text-white'
              }`}
            >
              Inscribirme por WhatsApp — $340.000
            </a>
          </div>

          {/* Card 2: Combo G + B */}
          <div
            className={`rounded-3xl border-2 p-8 flex flex-col justify-between space-y-6 relative shadow-xl ${
              isDarkMode
                ? 'bg-slate-900 border-amber-500/80 shadow-amber-500/10'
                : 'bg-[#FFFFFF] border-[#FCCA3C]'
            }`}
          >
            <div
              className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-sm ${
                isDarkMode ? 'bg-amber-500 text-slate-950' : 'bg-[#FCCA3C] text-[#04439A]'
              }`}
            >
              🎁 Opción Recomendada
            </div>

            <div className="space-y-4 pt-2">
              <span
                className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-full border inline-block ${
                  isDarkMode
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-[#FCCA3C]/30 text-[#04439A] border-[#FCCA3C]'
                }`}
              >
                Para Dos Oportunidades
              </span>
              <h3 className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-[#04439A]'}`}>
                COMBO CALENDARIO G + B
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#3B639E] font-medium'}`}>
                Ideal para prepararte en dos fechas de examen y ahorrar frente a pagar por separado.
              </p>

              <div className={`py-2 border-y ${isDarkMode ? 'border-slate-800' : 'border-[#3B639E]/15'}`}>
                <p className={`text-xs line-through font-semibold ${isDarkMode ? 'text-slate-500' : 'text-[#3B639E]/70'}`}>
                  $470.000 COP
                </p>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-4xl font-black ${isDarkMode ? 'text-amber-400' : 'text-[#04439A]'}`}>
                    $470.000
                  </span>
                </div>
                <p className={`text-[11px] font-bold mt-1 ${isDarkMode ? 'text-slate-300' : 'text-[#3B639E]'}`}>
                  😊 Acceso completo a ambos programas por un solo pago.
                </p>
              </div>

              <div className={`space-y-3 text-xs ${isDarkMode ? 'text-slate-300' : 'text-[#04439A]'}`}>
                <div
                  className={`p-3 rounded-xl border space-y-1 ${
                    isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-[#E7E4DC] border-[#3B639E]/20'
                  }`}
                >
                  <p className={`font-bold ${isDarkMode ? 'text-orange-400' : 'text-[#04439A]'}`}>
                    🗓 Calendario G: 17 de oct – 5 de dic
                  </p>
                  <p className={`font-bold ${isDarkMode ? 'text-amber-400' : 'text-[#3B639E]'}`}>
                    🗓 Calendario B: Enero – marzo/abril
                  </p>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-[#04439A]'}`}>✓</span>
                    <span>Todo lo incluido en cada programa: clases, simulacros y grupo VIP</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-[#04439A]'}`}>✓</span>
                    <span>Segunda oportunidad para subir tu puntaje sin pagar tarifa completa dos veces</span>
                  </li>
                </ul>
              </div>
            </div>

            <a
              href={getWhatsappLink('Combo Calendario G + B', '$470.000')}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3.5 font-black text-xs rounded-xl text-center block transition-all shadow-md uppercase tracking-wider ${
                isDarkMode
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950'
                  : 'bg-[#FCCA3C] hover:bg-[#f3bf26] text-[#04439A]'
              }`}
            >
              Inscribirme por WhatsApp — $470.000
            </a>
          </div>

          {/* Card 3: Pre ICFES Año */}
          <div
            className={`rounded-3xl border p-8 flex flex-col justify-between space-y-6 transition-all ${
              isDarkMode
                ? 'bg-slate-900/80 border-slate-800 hover:border-orange-500/50'
                : 'bg-[#FFFFFF] border-[#3B639E]/20 hover:shadow-xl'
            }`}
          >
            <div className="space-y-4">
              <span
                className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-full border inline-block ${
                  isDarkMode
                    ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    : 'bg-[#E7E4DC] text-[#04439A] border-[#3B639E]/20'
                }`}
              >
                ⭐ La Opción Más Completa
              </span>
              <h3 className={`text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-[#04439A]'}`}>
                PRE ICFES AÑO
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#3B639E] font-medium'}`}>
                Los tres calendarios (A, B y G) del año académico en un solo paquete.
              </p>

              <div className={`py-2 border-y ${isDarkMode ? 'border-slate-800' : 'border-[#3B639E]/15'}`}>
                <div className="flex items-baseline space-x-2">
                  <span className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-[#04439A]'}`}>
                    $740.000
                  </span>
                </div>
                <p className={`text-[11px] font-bold mt-1 ${isDarkMode ? 'text-amber-400/90' : 'text-[#3B639E]'}`}>
                  ⚡ Quedas totalmente cubierto para presentar el ICFES en cualquier fecha del año.
                </p>
              </div>

              <div className={`space-y-2 text-xs ${isDarkMode ? 'text-slate-300' : 'text-[#04439A]'}`}>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-center">
                  <div
                    className={`p-2 rounded-lg border ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#E7E4DC] border-[#3B639E]/20'
                    }`}
                  >
                    <span className={isDarkMode ? 'text-orange-400 block' : 'text-[#04439A] block font-black'}>G</span> Oct-Dic
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#E7E4DC] border-[#3B639E]/20'
                    }`}
                  >
                    <span className={isDarkMode ? 'text-amber-400 block' : 'text-[#3B639E] block font-black'}>B</span> Ene-Abr
                  </div>
                  <div
                    className={`p-2 rounded-lg border ${
                      isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#E7E4DC] border-[#3B639E]/20'
                    }`}
                  >
                    <span className={isDarkMode ? 'text-orange-400 block' : 'text-[#04439A] block font-black'}>A</span> May-Jul
                  </div>
                </div>

                <ul className="space-y-2 pt-2">
                  <li className="flex items-start space-x-2">
                    <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-[#04439A]'}`}>✓</span>
                    <span>Acceso completo a los 3 programas durante todo el año académico</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-[#04439A]'}`}>✓</span>
                    <span>Ideal para tener múltiples oportunidades de alcanzar un puntaje sobresaliente</span>
                  </li>
                </ul>
              </div>
            </div>

            <a
              href={getWhatsappLink('Pre ICFES Año (G + B + A)', '$740.000')}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3.5 font-extrabold text-xs rounded-xl text-center block transition-all shadow-md uppercase tracking-wider ${
                isDarkMode
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                  : 'bg-[#04439A] hover:bg-[#3B639E] text-white'
              }`}
            >
              Inscribirme por WhatsApp — $740.000
            </a>
          </div>
        </div>
      </section>

      {/* 4. Características y Equipo Docente */}
      <section
        id="beneficios"
        className={`py-20 border-y ${
          isDarkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-[#FFFFFF] border-[#3B639E]/20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className={`text-3xl sm:text-4xl font-black ${isDarkMode ? 'text-white' : 'text-[#04439A]'}`}>
              Creado por expertos que ya dominaron el ICFES
            </h2>
            <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-[#3B639E] font-semibold'}`}>
              Nuestro equipo docente está conformado por profesionales que obtuvieron entre{' '}
              <strong className={isDarkMode ? 'text-amber-400' : 'text-[#04439A]'}>
                415 y 491 puntos
              </strong>{' '}
              en el examen real y cuentan con amplia experiencia enseñando metodologías probadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '💻', title: 'Plataforma Interactiva', desc: 'Practica constantemente con simulacros cronometrados y banco de preguntas dinámico.' },
              { icon: '🎥', title: 'Clases Grabadas', desc: 'Acceso a todas las grabaciones por si no puedes asistir a una sesión en vivo.' },
              { icon: '📝', title: 'Material Actualizado', desc: 'Guías en PDF y preguntas tipo ICFES alineadas con las evaluaciones más recientes.' },
              { icon: '🤝', title: 'Grupo VIP WhatsApp', desc: 'Acompañamiento diario y resolución de dudas directo con profesores y compañeros.' },
            ].map((card, i) => (
              <div
                key={i}
                className={`p-6 rounded-2xl border space-y-3 ${
                  isDarkMode
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-[#E7E4DC] border-[#3B639E]/20'
                }`}
              >
                <div className="text-3xl">{card.icon}</div>
                <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#04439A]'}`}>
                  {card.title}
                </h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#3B639E] font-medium'}`}>
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Redes Sociales & Garantía */}
      <section className="py-16 max-w-5xl mx-auto px-4 text-center space-y-8">
        <div
          className={`p-8 rounded-3xl border space-y-4 shadow-sm ${
            isDarkMode
              ? 'bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border-orange-500/20'
              : 'bg-[#FFFFFF] border-[#3B639E]/20'
          }`}
        >
          <span className="text-3xl">📱</span>
          <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-[#04439A]'}`}>
            Síguenos en redes sociales
          </h3>
          <p className={`text-xs max-w-xl mx-auto ${isDarkMode ? 'text-slate-300' : 'text-[#3B639E] font-medium'}`}>
            Publicamos contenido gratuito todos los días: tips de estudio, resoluciones rápidas de preguntas y clases cortas para apoyarte.
          </p>
          <a
            href="https://instagram.com/lumenicfes"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-md transition-all ${
              isDarkMode
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-[#04439A] hover:bg-[#3B639E] text-white'
            }`}
          >
            @lumenicfes en Instagram ↗
          </a>
        </div>
      </section>

      {/* 6. Preguntas Frecuentes (FAQ) */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-[#04439A]'}`}>
            Preguntas Frecuentes
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-[#3B639E] font-medium'}`}>
            Resuelve tus dudas sobre la metodología, fechas y pagos.
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: '¿Cuál es la diferencia entre Calendario G, el Combo y Pre ICFES Año?',
              a: 'Calendario G ($340.000) te prepara solo para esa fecha de examen (17 de oct al 5 de dic). El Combo G+B ($470.000) incluye también el Calendario B (enero a marzo/abril). El Pre ICFES Año ($740.000) abarca los tres calendarios (G, B y A) cubriéndote todo el año académico.',
            },
            {
              q: '¿Por qué el precio de Calendario G sube por etapas?',
              a: 'El valor se incrementa progresivamente a medida que se aproxima la fecha de inicio hasta llegar a $340.000. Inscribirte hoy te asegura el valor en descuento de $340.000.',
            },
            {
              q: '¿Cómo me inscribo?',
              a: 'Haz clic en el botón "Inscribirme por WhatsApp" del programa que prefieras. Abrirás un chat directo con nuestro equipo para confirmar tu cupo y darte acceso inmediato. También nos puedes escribir directamente al 304 127 1545.',
            },
            {
              q: '¿Hay descuentos para grupos o referidos?',
              a: '¡Sí! Contáctanos por WhatsApp al 304 127 1545 e indícanos cuántas personas son. Contamos con descuentos especiales para grupos de 3 o más estudiantes.',
            },
            {
              q: '¿Cuándo inician las clases?',
              a: 'Calendario G inicia del 17 de octubre al 5 de diciembre. Las clases son en vivo de lunes a viernes de 7:00 pm a 9:00 pm (hora Colombia).',
            },
          ].map((faq, idx) => (
            <div
              key={idx}
              className={`border rounded-2xl overflow-hidden shadow-sm ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#FFFFFF] border-[#3B639E]/20'
              }`}
            >
              <button
                onClick={() => toggleFaq(idx)}
                className={`w-full p-5 text-left flex justify-between items-center font-bold text-sm transition-colors ${
                  isDarkMode
                    ? 'text-slate-200 hover:text-orange-400'
                    : 'text-[#04439A] hover:text-[#3B639E]'
                }`}
              >
                <span>{faq.q}</span>
                <span className={isDarkMode ? 'text-orange-500 text-lg' : 'text-[#04439A] text-lg'}>
                  {openFaq === idx ? '−' : '+'}
                </span>
              </button>
              {openFaq === idx && (
                <div
                  className={`px-5 pb-5 text-xs border-t pt-3 leading-relaxed ${
                    isDarkMode
                      ? 'text-slate-400 border-slate-800/60'
                      : 'text-[#3B639E] font-medium border-[#3B639E]/10'
                  }`}
                >
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. Footer / Contacto */}
      <footer
        id="contacto"
        className={`border-t py-12 px-4 text-center space-y-6 ${
          isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-[#3B639E]/20 bg-[#E7E4DC]'
        }`}
      >
        <div className="flex justify-center items-center space-x-2">
          <span className="text-xl">⚡</span>
          <span className={`font-extrabold text-lg ${isDarkMode ? 'text-white' : 'text-[#04439A]'}`}>
            PRE ICFES LUMEN
          </span>
        </div>

        <p className={`text-xs max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-[#3B639E] font-medium'}`}>
          ¿Tienes dudas adicionales? Escríbenos directamente al <strong>304 127 1545</strong> o contáctanos por nuestras redes sociales.
        </p>

        <div className="flex justify-center space-x-6 text-xs font-bold pt-2">
          <Link
            href="/login"
            className={isDarkMode ? 'text-slate-400 hover:text-white' : 'text-[#04439A] hover:text-[#3B639E]'}
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className={isDarkMode ? 'text-slate-400 hover:text-white' : 'text-[#04439A] hover:text-[#3B639E]'}
          >
            Registro de Estudiantes
          </Link>
          <a
            href={getWhatsappLink('Soporte', 'Información')}
            target="_blank"
            rel="noopener noreferrer"
            className={isDarkMode ? 'text-slate-400 hover:text-white' : 'text-[#04439A] hover:text-[#3B639E]'}
          >
            WhatsApp Directo
          </a>
        </div>

        <p className={`text-[11px] pt-4 ${isDarkMode ? 'text-slate-600' : 'text-[#3B639E]/80 font-medium'}`}>
          © 2026 PRE ICFES LUMEN. Todos los derechos reservados.
        </p>
      </footer>

      {/* 8. BOTÓN FLOTANTE DE WHATSAPP */}
      <a
        href={getWhatsappLink('Consulta Directa', 'Asesoría')}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
        title="Chat de WhatsApp"
      >
        <svg
          className="w-6 h-6 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.705 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span className="hidden sm:inline font-bold text-xs">¿Dudas? Habla con un asesor</span>
      </a>
    </div>
  )
}