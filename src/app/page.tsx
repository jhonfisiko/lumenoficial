'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const whatsappNumber = '573041271545'

  const getWhatsappLink = (programName: string, price: string) => {
    const text = `Hola PRE ICFES LUMEN 🧡, quiero inscribirme al programa *${programName}* por *${price}*. ¿Me ayudan a confirmar mi cupo?`
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-orange-500/20">
              ⚡
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-none">
                PRE ICFES <span className="text-orange-500">LUMEN</span>
              </span>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Puntajes 415+</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold uppercase tracking-wider text-slate-300">
            <a href="#programas" className="hover:text-orange-400 transition-colors">Programas</a>
            <a href="#beneficios" className="hover:text-orange-400 transition-colors">Beneficios</a>
            <a href="#faq" className="hover:text-orange-400 transition-colors">FAQ</a>
            <a href="#contacto" className="hover:text-orange-400 transition-colors">Contacto</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all hover:scale-[1.02]"
            >
              Registrarme
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-radial from-slate-900 via-slate-950 to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-full uppercase tracking-widest shadow-sm">
            <span>🧡 Tres formas de prepararte para el ICFES</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight">
            Estrategias reales que te llevan a sacar <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">más de 415 puntos</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-3xl mx-auto leading-relaxed font-normal">
            Clases en vivo, simulacros reales con calificación detallada y acompañamiento cercano paso a paso. Elige el calendario que se ajuste a tu fecha de examen.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <a
              href="#programas"
              className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/25 transition-all hover:scale-105 text-sm uppercase tracking-wider"
            >
              Ver Planes y Precios ⚡
            </a>
            <a
              href={getWhatsappLink('Consulta General', 'Preicfes')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-2xl transition-all text-sm flex items-center justify-center space-x-2"
            >
              <span>Escríbenos por WhatsApp 💬</span>
            </a>
          </div>

          {/* Destacados rápido */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-800/80 max-w-4xl mx-auto">
            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <p className="text-2xl font-black text-orange-400">415 – 491</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Puntaje de Profesores</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <p className="text-2xl font-black text-amber-400">5 Áreas</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Cobertura Total ICFES</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <p className="text-2xl font-black text-orange-400">VIP 24/7</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Grupo de WhatsApp</p>
            </div>
            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <p className="text-2xl font-black text-amber-400">100%</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Simulacros Reales</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Sección de Programas y Precios */}
      <section id="programas" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-extrabold text-orange-500 uppercase tracking-widest">Inscripciones Abiertas</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white">Elige la opción que se adapte a ti</h2>
          <p className="text-slate-400 text-sm max-w-2xl mx-auto">
            Llévalos individualmente o aprovecha nuestros combos para asegurar tus oportunidades de ingresar a la universidad.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Card 1: Calendario G */}
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-8 flex flex-col justify-between space-y-6 hover:border-orange-500/50 transition-all">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-orange-500/10 text-orange-400 text-[11px] font-extrabold uppercase rounded-full border border-orange-500/20 inline-block">
                🔥 Nuestro Enfoque Principal
              </span>
              <h3 className="text-2xl font-extrabold text-white">PRE-ICFES CALENDARIO G</h3>
              <p className="text-xs text-slate-400">Preparación completa para quienes presentan el ICFES bajo el Calendario G.</p>

              <div className="py-2 border-y border-slate-800">
                <p className="text-xs text-slate-500 line-through font-semibold">$340.000 COP</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-black text-white">$340.000</span>
                  <span className="text-xs text-orange-400 font-bold">Precio por etapas</span>
                </div>
                <p className="text-[11px] text-amber-400/90 font-medium mt-1">
                  ✅ El precio sube progresivamente hasta $340.000. Inscribirte hoy te asegura este valor.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <p className="font-bold text-orange-400">📅 Clases: 17 de octubre al 5 de diciembre</p>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Clases en vivo lunes a viernes, 7pm a 9pm (hora Colombia)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Simulacros tipo ICFES con calificación y retroalimentación detallada</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Plataforma de estudio con grabaciones y banco de preguntas</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Grupo VIP de acompañamiento por WhatsApp</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Las 5 áreas: Lectura Crítica, Matemáticas, Ciencias Naturales, Sociales e Inglés</span>
                  </li>
                </ul>
              </div>
            </div>

            <a
              href={getWhatsappLink('Calendario G', '$340.000')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl text-center block transition-all shadow-md shadow-orange-500/20 uppercase tracking-wider"
            >
              Inscribirme por WhatsApp — $340.000
            </a>
          </div>

          {/* Card 2: Combo G + B (Destacado) */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl border-2 border-amber-500/80 p-8 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-amber-500/10">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
              🎁 Opción Recomendada
            </div>

            <div className="space-y-4 pt-2">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[11px] font-extrabold uppercase rounded-full border border-amber-500/20 inline-block">
                Para Dos Oportunidades
              </span>
              <h3 className="text-2xl font-extrabold text-white">COMBO CALENDARIO G + B</h3>
              <p className="text-xs text-slate-400">Ideal para prepararte en dos fechas de examen y ahorrar frente a pagar por separado.</p>

              <div className="py-2 border-y border-slate-800">
                <p className="text-xs text-slate-500 line-through font-semibold">$470.000 COP</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-black text-amber-400">$470.000</span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mt-1">
                  😊 Acceso completo a ambos programas por un solo pago.
                </p>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
                  <p className="font-bold text-orange-400">🗓 Calendario G: 17 de oct – 5 de dic</p>
                  <p className="font-bold text-amber-400">🗓 Calendario B: Enero – marzo/abril</p>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Todo lo incluido en cada programa: clases, simulacros y grupo VIP</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Segunda oportunidad para subir tu puntaje sin pagar tarifa completa dos veces</span>
                  </li>
                </ul>
              </div>
            </div>

            <a
              href={getWhatsappLink('Combo Calendario G + B', '$470.000')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl text-center block transition-all shadow-lg uppercase tracking-wider"
            >
              Inscribirme por WhatsApp — $470.000
            </a>
          </div>

          {/* Card 3: Pre ICFES Año */}
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-8 flex flex-col justify-between space-y-6 hover:border-orange-500/50 transition-all">
            <div className="space-y-4">
              <span className="px-3 py-1 bg-orange-500/10 text-orange-400 text-[11px] font-extrabold uppercase rounded-full border border-orange-500/20 inline-block">
                ⭐ La Opción Más Completa
              </span>
              <h3 className="text-2xl font-extrabold text-white">PRE ICFES AÑO</h3>
              <p className="text-xs text-slate-400">Los tres calendarios (A, B y G) del año académico en un solo paquete.</p>

              <div className="py-2 border-y border-slate-800">
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-black text-white">$740.000</span>
                </div>
                <p className="text-[11px] text-amber-400/90 font-medium mt-1">
                  🧡 Quedas totalmente cubierto para presentar el ICFES en cualquier fecha del año.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-bold text-center">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-orange-400 block">G</span> Oct-Dic
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-amber-400 block">B</span> Ene-Abr
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-orange-400 block">A</span> May-Jul
                  </div>
                </div>

                <ul className="space-y-2 pt-2">
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Acceso completo a los 3 programas durante todo el año académico</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Ideal para tener múltiples oportunidades de alcanzar un puntaje sobresaliente</span>
                  </li>
                </ul>
              </div>
            </div>

            <a
              href={getWhatsappLink('Pre ICFES Año (G + B + A)', '$740.000')}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl text-center block transition-all shadow-md shadow-orange-500/20 uppercase tracking-wider"
            >
              Inscribirme por WhatsApp — $740.000
            </a>
          </div>

        </div>
      </section>

      {/* 4. Características y Equipo Docente */}
      <section id="beneficios" className="py-20 bg-slate-900/60 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black text-white">Creado por expertos que ya dominaron el ICFES</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Nuestro equipo docente está conformado por profesionales que obtuvieron entre <strong className="text-amber-400">415 y 491 puntos</strong> en el examen real y cuentan con amplia experiencia enseñando metodologías probadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="text-3xl">💻</div>
              <h3 className="text-base font-bold text-white">Plataforma Interactiva</h3>
              <p className="text-xs text-slate-400">Practica constantemente con simulacros cronometrados y banco de preguntas dinámico.</p>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="text-3xl">🎥</div>
              <h3 className="text-base font-bold text-white">Clases Grabadas</h3>
              <p className="text-xs text-slate-400">Acceso a todas las grabaciones por si no puedes asistir a una sesión en vivo.</p>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="text-3xl">📝</div>
              <h3 className="text-base font-bold text-white">Material Actualizado</h3>
              <p className="text-xs text-slate-400">Guías en PDF y preguntas tipo ICFES alineadas con las evaluaciones más recientes.</p>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="text-3xl">🤝</div>
              <h3 className="text-base font-bold text-white">Grupo VIP WhatsApp</h3>
              <p className="text-xs text-slate-400">Acompañamiento diario y resolución de dudas directo con profesores y compañeros.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Redes Sociales & Garantía */}
      <section className="py-16 max-w-5xl mx-auto px-4 text-center space-y-8">
        <div className="p-8 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 rounded-3xl border border-orange-500/20 space-y-4">
          <span className="text-3xl">📱</span>
          <h3 className="text-2xl font-black text-white">Síguenos en redes sociales</h3>
          <p className="text-xs text-slate-300 max-w-xl mx-auto">
            Publicamos contenido gratuito todos los días: tips de estudio, resoluciones rápidas de preguntas y clases cortas para apoyarte.
          </p>
          <a
            href="https://instagram.com/lumenicfes"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
          >
            @lumenicfes en Instagram ↗
          </a>
        </div>
      </section>

      {/* 6. Preguntas Frecuentes (FAQ) */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white">Preguntas Frecuentes</h2>
          <p className="text-xs text-slate-400">Resuelve tus dudas sobre la metodología, fechas y pagos.</p>
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
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left flex justify-between items-center font-bold text-sm text-slate-200 hover:text-orange-400 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-orange-500 text-lg ml-4">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-400 border-t border-slate-800/60 pt-3 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. Footer / Contacto */}
      <footer id="contacto" className="border-t border-slate-800 bg-slate-950 py-12 px-4 text-center space-y-6">
        <div className="flex justify-center items-center space-x-2">
          <span className="text-xl">⚡</span>
          <span className="font-extrabold text-lg text-white">PRE ICFES LUMEN</span>
        </div>
        
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          ¿Tienes dudas adicionales? Escríbenos directamente al <strong>304 127 1545</strong> o contáctanos por nuestras redes sociales.
        </p>

        <div className="flex justify-center space-x-6 text-xs text-slate-400 pt-2">
          <Link href="/login" className="hover:text-white transition-colors">Iniciar Sesión</Link>
          <Link href="/register" className="hover:text-white transition-colors">Registro de Estudiantes</Link>
          <a href={getWhatsappLink('Soporte', 'Información')} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp Directo</a>
        </div>

        <p className="text-[11px] text-slate-600 pt-4">
          © 2026 PRE ICFES LUMEN. Todos los derechos reservados.
        </p>
      </footer>

    </div>
  )
}