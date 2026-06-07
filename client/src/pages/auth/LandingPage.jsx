import { useState, useEffect, useRef } from 'react'
import { 
  Users, BarChart3, GraduationCap, Calendar, 
  Wallet, MessageSquare, ShieldCheck, Clock, 
  Globe, Award, CheckCircle2, ChevronRight, PlayCircle
} from 'lucide-react'

// ── Palette & tokens ──────────────────────────────────────────────
// Direction artistique : éducation de prestige
// Marine profond + Or chaud + Crème ivoire
// Typographie : Playfair Display (titres) + DM Sans (corps)

// ── Hook : observer pour animations au scroll ─────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

// ── Composant : Badge ─────────────────────────────────────────────
function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
      text-xs font-semibold tracking-widest uppercase
      bg-amber-50 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      {children}
    </span>
  )
}

// ── Composant : Bouton ────────────────────────────────────────────
function Button({ children, variant = 'primary', href, onClick, size = 'md', className = '' }) {
  const base = `inline-flex items-center justify-center gap-2 font-semibold
    rounded-xl transition-all duration-200 cursor-pointer select-none`
  const sizes = {
    sm:  'px-4 py-2 text-sm',
    md:  'px-6 py-3 text-sm',
    lg:  'px-8 py-4 text-base',
    xl:  'px-10 py-5 text-lg',
  }
  const variants = {
    primary:   `bg-[#1B3A6B] text-white hover:bg-[#142d54]
                shadow-lg shadow-[#1B3A6B]/25 hover:shadow-xl hover:shadow-[#1B3A6B]/30
                hover:-translate-y-0.5 active:translate-y-0`,
    secondary: `bg-white text-[#1B3A6B] border-2 border-[#1B3A6B]/20
                hover:border-[#1B3A6B]/60 hover:bg-[#1B3A6B]/5
                hover:-translate-y-0.5 active:translate-y-0`,
    gold:      `bg-gradient-to-r from-amber-500 to-amber-600 text-white
                shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40
                hover:-translate-y-0.5 active:translate-y-0`,
    ghost:     `text-[#1B3A6B] hover:bg-[#1B3A6B]/8 rounded-xl`,
  }
  const Tag = href ? 'a' : 'button'
  return (
    <Tag
      href={href}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </Tag>
  )
}

// ── Composant : Navbar ────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Accueil',       href: '#hero'           },
    { label: 'Notre école',   href: '#fonctionnalites' },
    { label: 'Nos services',  href: '#avantages'       },
    { label: 'Témoignages',   href: '#temoignages'     },
  ]

  const scrollTo = (href) => {
    setMenuOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-sm shadow-[#1B3A6B]/8 py-3'
        : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#1B3A6B] flex items-center
            justify-center shadow-lg shadow-[#1B3A6B]/30">
            {/* Icône graduation cap SVG */}
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
              <path d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-[#1B3A6B] text-xl tracking-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            EduGest
          </span>
        </div>

        {/* Liens desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <button key={l.label}
              onClick={() => scrollTo(l.href)}
              className="px-4 py-2 text-sm font-medium text-slate-800
                hover:text-[#1B3A6B] rounded-lg hover:bg-[#1B3A6B]/5
                transition-all duration-150">
              {l.label}
            </button>
          ))}
        </div>

        {/* CTA desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" href="/login">Se connecter</Button>
          <Button variant="primary" size="sm" href="/register">S'inscrire</Button>
        </div>

        {/* Burger mobile */}
        <button
          className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5"
          onClick={() => setMenuOpen(v => !v)}>
          <span className={`block w-5 h-0.5 bg-[#1B3A6B] transition-all duration-200
            ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#1B3A6B] transition-all duration-200
            ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#1B3A6B] transition-all duration-200
            ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0
          bg-white/98 backdrop-blur-md shadow-lg border-t border-slate-100 p-4">
          {links.map(l => (
            <button key={l.label}
              onClick={() => scrollTo(l.href)}
              className="w-full text-left px-4 py-3 text-sm font-medium
                text-slate-700 hover:text-[#1B3A6B] hover:bg-[#1B3A6B]/5
                rounded-lg transition-all">
              {l.label}
            </button>
          ))}
          <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
            <Button variant="secondary" size="sm" href="/login" className="flex-1">
              Se connecter
            </Button>
            <Button variant="primary" size="sm" href="/register" className="flex-1">
              S'inscrire
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Composant : FeatureCard ───────────────────────────────────────
function FeatureCard({ image, icon: Icon, title, description, color, delay = 0 }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`group overflow-hidden rounded-2xl border border-slate-200/80
        bg-white hover:border-[#1B3A6B]/30 hover:shadow-xl hover:shadow-[#1B3A6B]/8
        transition-all duration-500 cursor-default
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

      {/* Image de fond / illustration */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img 
          src={image || "/hero.jpg"} 
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
        
        {/* Icône flottante */}
        <div className={`absolute bottom-4 left-5 w-11 h-11 rounded-xl bg-white flex items-center justify-center
          shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={22} className="text-[#1B3A6B]" />
        </div>
      </div>

      <div className="p-6">
        <h3 className="font-bold text-slate-900 mb-2 text-lg
          group-hover:text-[#1B3A6B] transition-colors">
          {title}
        </h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">{description}</p>

        <div className="flex items-center text-[#1B3A6B] text-xs font-bold uppercase tracking-wider gap-2">
          En savoir plus <ChevronRight size={14} />
        </div>
      </div>
    </div>
  )
}

// ── Composant : StatisticsSection ─────────────────────────────────
function StatisticsSection() {
  const [ref, inView] = useInView()
  const stats = [
    { label: 'Élèves inscrits', value: '1200+', icon: GraduationCap, color: 'text-blue-600' },
    { label: 'Personnel qualifié', value: '45', icon: Users, color: 'text-emerald-600' },
    { label: 'Classes équipées', value: '32', icon: ShieldCheck, color: 'text-amber-600' },
    { label: 'Taux de réussite', value: '98%', icon: Award, color: 'text-purple-600' },
  ]

  return (
    <section className="py-20 bg-slate-50 relative overflow-hidden border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.label} 
                style={{ transitionDelay: `${i * 100}ms` }}
                className={`text-center transition-all duration-700 
                  ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm mb-4">
                  <Icon className={s.color} size={28} />
                </div>
                <p className={`text-4xl font-bold mb-1 text-slate-900`}
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  {s.value}
                </p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {s.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Composant : AdvantageItem ─────────────────────────────────────
function AdvantageItem({ icon: Icon, title, description, index }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref}
      style={{ transitionDelay: `${index * 120}ms` }}
      className={`flex items-start gap-4 transition-all duration-500
        ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1B3A6B] to-[#2d5a9e]
        flex items-center justify-center shrink-0 shadow-md shadow-[#1B3A6B]/20">
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// ── Composant : TestimonialCard ───────────────────────────────────
function TestimonialCard({ name, role, school, quote, avatar, delay = 0 }) {
  const [ref, inView] = useInView()
  return (
    <div ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`p-7 rounded-2xl bg-white border border-slate-200/80
        hover:border-amber-300/60 hover:shadow-xl hover:shadow-amber-500/8
        transition-all duration-500
        ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

      {/* Étoiles */}
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="text-amber-400 text-sm">★</span>
        ))}
      </div>

   {/* Citation */}
    <blockquote className="text-slate-700 leading-relaxed mb-5 text-sm italic">
      {quote}
    </blockquote>

    {/* Auteur */}
    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1B3A6B] to-[#2d5a9e] flex items-center justify-center text-white font-bold text-sm">
        {avatar}
      </div>
      <div>
        <p className="font-semibold text-slate-900 text-sm">{name}</p>
        <p className="text-slate-400 text-xs">{role} — {school}</p>
      </div>
    </div>
  </div> // Fermeture du conteneur principal
);
}


// ── Composant : DashboardMockup ───────────────────────────────────
function DashboardMockup() {
  const [ref, inView] = useInView(0.1)
  return (
    <div ref={ref}
      className={`transition-all duration-700 delay-200
        ${inView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`}>

      {/* Fenêtre navigateur */}
      <div className="rounded-2xl overflow-hidden shadow-2xl shadow-[#1B3A6B]/20
        border border-slate-200/80 bg-white">

        {/* Barre navigateur */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 mx-3">
            <div className="bg-white rounded-md px-3 py-1 text-xs text-slate-400
              border border-slate-200 max-w-xs mx-auto text-center">
              app.edugest.cm
            </div>
          </div>
        </div>

        {/* Dashboard simulé */}
        <div className="flex h-64 bg-slate-50">

          {/* Sidebar */}
          <div className="w-14 bg-[#1B3A6B] flex flex-col items-center py-4 gap-3">
            {[
              <Users size={16} />,
              <GraduationCap size={16} />,
              <BarChart3 size={16} />,
              <Wallet size={16} />,
              <Calendar size={16} />,
              <MessageSquare size={16} />,
            ].map((icon, i) => (
              <div key={i} className={`w-9 h-9 rounded-lg flex items-center justify-center
                cursor-pointer transition-all
                ${i === 0
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
                {icon}
              </div>
            ))}
          </div>

          {/* Contenu */}
          <div className="flex-1 p-4 overflow-hidden">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: 'Élèves',      value: '342', icon: GraduationCap, color: 'text-blue-600' },
                { label: 'Enseignants', value: '28',  icon: Users,         color: 'text-emerald-600' },
                { label: 'Paiements',   value: '94%', icon: Wallet,        color: 'text-amber-600' },
              ].map(s => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-white rounded-xl p-3 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">{s.label}</span>
                      <Icon size={14} className={s.color} />
                    </div>
                    <p className="font-bold text-slate-900 text-lg leading-none">{s.value}</p>
                  </div>
                )
              })}
            </div>

            {/* Graphique + liste */}
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 bg-white rounded-xl p-3 border border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-3">Notes par classe</p>
                <div className="flex items-end gap-2 h-16">
                  {[65, 82, 74, 90, 68, 85].map((h, i) => (
                    <div key={i} className="flex-1">
                      <div className="w-full rounded-sm bg-gradient-to-t from-[#1B3A6B] to-[#2d5a9e]"
                        style={{ height: `${h}%` }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-2 bg-white rounded-xl p-3 border border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-2">Récents</p>
                <div className="space-y-2">
                  {[
                    { name: 'Marie K.', note: '16/20', color: 'text-emerald-500' },
                    { name: 'Jean B.',  note: '12/20', color: 'text-amber-500' },
                    { name: 'Paul T.',  note: '18/20', color: 'text-blue-500' },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#1B3A6B]/10
                        flex items-center justify-center text-[8px] text-[#1B3A6B] font-bold">
                        {e.name[0]}
                      </div>
                      <span className="text-xs text-slate-600 truncate">{e.name}</span>
                      <span className={`ml-auto text-[10px] font-semibold ${e.color}`}>{e.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Section : Hero ────────────────────────────────────────────────
function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center
      overflow-hidden bg-gradient-to-br from-slate-950 via-[#0d2044] to-[#1B3A6B]">

      {/* Texture de fond */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #2d5a9e 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, #f59e0b22 0%, transparent 50%)`,
        }} />

      {/* Grille décorative */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      {/* Cercles décoratifs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 rounded-full
        bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full
        bg-blue-500/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16
        grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Texte */}
        <div>
          <div className="mb-6 animate-[fadeInUp_0.6s_ease_both]">
            <Badge>Bienvenue dans notre établissement</Badge>
          </div>

          <h1 className="font-bold leading-tight mb-6 text-white
            animate-[fadeInUp_0.7s_0.1s_ease_both] opacity-0 [animation-fill-mode:forwards]"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            }}>
            Bienvenue sur la plateforme
            <span className="block text-transparent bg-clip-text
              bg-gradient-to-r from-amber-400 to-amber-200">
              académique
            </span>
            de notre école
          </h1>

          <p className="text-slate-300/90 text-lg leading-relaxed mb-8 max-w-lg
            animate-[fadeInUp_0.7s_0.2s_ease_both] opacity-0 [animation-fill-mode:forwards]">
            Votre espace numérique dédié : suivez les notes, les bulletins,
            les paiements et restez en contact avec l’équipe enseignante.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 mb-10
            animate-[fadeInUp_0.7s_0.3s_ease_both] opacity-0 [animation-fill-mode:forwards]">
            <Button variant="gold" size="lg" href="/login">
              Accéder à mon espace
              <ChevronRight size={18} className="ml-1" />
            </Button>
            <Button variant="primary" size="lg" href="/register"
              className="!text-white !border-white/30 hover:!bg-white/10">
              Créer un compte
            </Button>
          </div>

          {/* Points clés scolaires */}
          <div className="flex flex-wrap gap-8
            animate-[fadeInUp_0.7s_0.4s_ease_both] opacity-0 [animation-fill-mode:forwards]">
            {[
              { icon: GraduationCap, label: 'Élèves & familles' },
              { icon: ShieldCheck,   label: 'Données sécurisées' },
              { icon: Clock,         label: 'Accès 24h/24' },
            ].map((p, i) => {
              const Icon = p.icon
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <Icon size={16} className="text-amber-400" />
                  <span className="text-slate-300 text-sm font-medium">{p.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Photo Hero — droite du titre */}
        <div className="animate-[fadeIn_1s_0.4s_ease_both]
          [animation-fill-mode:forwards] lg:pl-8">
          <div className="relative">
            {/* Cadre décoratif */}
            <div className="absolute -inset-4 border border-white/10 rounded-[2rem] -rotate-3" />
            <div className="absolute -inset-4 border border-amber-500/20 rounded-[2rem] rotate-3" />
            
            {/* Conteneur Photo */}
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50 border-8 border-white/5">
              <img 
                src="/hero.jpg" 
                alt="Excellence Scolaire" 
                className="w-full aspect-[4/5] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d2044]/60 to-transparent" />
              
              {/* Badge flottant sur photo */}
              <div className="absolute bottom-8 left-8 right-8 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                <p className="text-white font-bold text-xl mb-1">Qualité & Prestige</p>
                <p className="text-white/70 text-sm">Le futur de l'éducation commence ici.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vague bas */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" className="w-full">
          <path d="M0 80L1440 80L1440 20C1200 60 960 80 720 60C480 40 240 0 0 40L0 80Z"
            fill="#f8fafc"/>
        </svg>
      </div>
    </section>
  )
}

// ── Section : Fonctionnalités ─────────────────────────────────────
function FeaturesSection() {
  const [ref, inView] = useInView()
  const features = [
    {
      image: '/eleves.webp',
      icon: Users, title: 'Gestion des élèves',
      description: 'Inscriptions, fiches complètes, suivi de scolarité et dossiers académiques centralisés.',
      color: 'bg-blue-50',
    },
    {
      image: '/notes.jpg',
      icon: BarChart3, title: 'Notes & évaluations',
      description: 'Saisie par cours, calcul automatique des moyennes et génération de bulletins sécurisés.',
      color: 'bg-emerald-50',
    },
    {
      image: '/personnel.jpg',
      icon: GraduationCap, title: 'Gestion du personnel',
      description: 'Profils enseignants, affectation aux classes et suivi des performances académiques.',
      color: 'bg-violet-50',
    },
    {
      image: '/planning.webp',
      icon: Calendar, title: 'Emplois du temps',
      description: 'Organisation optimisée des cours, gestion des salles et synchronisation des agendas.',
      color: 'bg-amber-50',
    },
    {
      image: '/paiements.jpg',
      icon: Wallet, title: 'Paiements & scolarité',
      description: 'Suivi rigoureux des frais scolaires, facturation automatique et historique des transactions.',
      color: 'bg-rose-50',
    },
    {
      image: '/messagerie.webp',
      icon: MessageSquare, title: 'Communication directe',
      description: 'Canal privilégié entre parents, enseignants et administration pour un suivi optimal.',
      color: 'bg-cyan-50',
    },
  ]

  return (
    <section id="fonctionnalites" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div ref={ref}
          className={`text-center mb-16 transition-all duration-600
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Badge>Fonctionnalités</Badge>
          <h2 className="mt-4 font-bold text-slate-900 mb-4"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            }}>
            fonctionnalités de notre plateforme
                      </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Une suite complète d'outils pensée pour les établissements scolaires
            francophones.
          </p>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 80} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section : Avantages ───────────────────────────────────────────
function AdvantagesSection() {
  const [ref, inView] = useInView()
  const advantages = [
    {
      icon: Award, title: 'Bulletins numériques automatiques',
      description: 'Générez et distribuez les bulletins de chaque trimestre directement depuis la plateforme, sans impression ni délai.',
    },
    {
      icon: Users, title: 'Lien direct parents-école',
      description: 'Les parents suivent les notes, absences et paiements de leurs enfants depuis leur espace personnel sécurisé.',
    },
    {
      icon: ShieldCheck, title: 'Données confidentielles et protégées',
      description: 'Chaque dossier élève est accessible uniquement aux personnes autorisées par l\'administration scolaire.',
    },
    {
      icon: Globe, title: 'Accessible à tout moment, partout',
      description: 'Depuis n\'importe quel appareil connecté : ordinateur, tablette ou smartphone, où que vous soyez.',
    },
  ]


  return (
    <section id="avantages" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Texte */}
          <div>
            <div ref={ref}
              className={`transition-all duration-600
                ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Badge>Notre école</Badge>
              <h2 className="mt-4 font-bold text-slate-900 mb-4"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                }}>
                Un environnement
                <span className="block text-[#1B3A6B]">de confiance et de progrès</span>
              </h2>
              <p className="text-slate-500 mb-10 leading-relaxed">
                Notre plateforme renforce le lien entre l’administration, les enseignants
                et les familles pour le bien-être de chaque élève.
              </p>
            </div>

            <div className="space-y-7">
              {advantages.map((a, i) => (
                <AdvantageItem key={a.title} {...a} index={i} />
              ))}
            </div>
          </div>

          {/* Visuel - chiffres scolaires */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br
              from-[#1B3A6B]/5 to-amber-500/5" />
            <div className="relative grid grid-cols-2 gap-4">
              {[
                { val: 'Bulletins',  label: 'numériques', color: 'from-[#1B3A6B] to-[#2d5a9e]', icon: Award },
                { val: 'Suivi',     label: 'en temps réel', color: 'from-amber-500 to-amber-600', icon: Clock },
                { val: 'Données',  label: 'sécurisées', color: 'from-emerald-600 to-emerald-700', icon: ShieldCheck },
                { val: 'Accès',    label: '24h/24 - 7j/7', color: 'from-violet-600 to-violet-700', icon: Globe },
              ].map((s, i) => {
                const Icon = s.icon
                return (
                  <div key={s.label}
                    className={`p-6 rounded-2xl bg-gradient-to-br ${s.color}
                      text-white shadow-lg transform
                      ${i % 2 === 1 ? 'translate-y-4' : ''}`}>
                    <Icon size={28} className="mb-2 opacity-80" />
                    <p className="font-bold text-2xl leading-tight mb-1"
                      style={{ fontFamily: "'Playfair Display', serif" }}>
                      {s.val}
                    </p>
                    <p className="text-white/70 text-sm">{s.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ── Section : Témoignages ─────────────────────────────────────────
function TestimonialsSection() {
  const [ref, inView] = useInView()
  const testimonials = [
    {
      name: 'Mme Ngo Biyong',
      role: 'Directrice',
      school: 'École Sainte-Marie, Yaoundé',
      avatar: 'N',
      quote: 'EduGest a transformé notre gestion. Les parents reçoivent les notes en temps réel et les paiements sont enfin traçables. Je recommande vivement.',
    },
    {
      name: 'M. Kamdem Pierre',
      role: 'Directeur adjoint',
      school: 'Collège Les Palmiers, Douala',
      avatar: 'K',
      quote: 'Le suivi des salaires enseignants est devenu un jeu d\'enfant. Fini les erreurs de paie et les réclamations. L\'équipe support est très réactive.',
    },
    {
      name: 'Mme Awono Claire',
      role: 'Responsable scolarité',
      school: 'Institut Lumière, Bafoussam',
      avatar: 'A',
      quote: 'Nous gérons 600 élèves avec seulement 2 personnes administratives. EduGest nous a permis de diviser notre temps de saisie par trois.',
    },
  ]

  return (
    <section id="temoignages" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">

        <div ref={ref}
          className={`text-center mb-16 transition-all duration-600
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Badge>Témoignages</Badge>
          <h2 className="mt-4 font-bold text-slate-900"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            }}>
            Ce que disent nos familles
          </h2>
          <p className="text-slate-500 mt-3 text-lg">
            La confiance de nos parents et enseignants est notre plus grande fierté.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} {...t} delay={i * 100} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section : Aperçu dashboard ────────────────────────────────────
function PreviewSection() {
  const [ref, inView] = useInView(0.1)
  return (
    <section id="apercu" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">

        <div ref={ref}
          className={`text-center mb-12 transition-all duration-600
            ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Badge>Votre espace numérique</Badge>
          <h2 className="mt-4 font-bold text-slate-900"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
            }}>
            Simple, clair
            <span className="text-[#1B3A6B]"> et accessible à tous</span>
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            L’administration, les enseignants et les parents disposent chacun
            d’un espace adapté à leur rôle au sein de l’école.
          </p>
        </div>

        {/* Capture d'écran réelle du tableau de bord */}
        <div className="max-w-5xl mx-auto">
          {/* Barre navigateur décorative */}
          <div className="bg-slate-100 rounded-t-2xl px-4 py-3 flex items-center gap-2 border border-b-0 border-slate-200">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-white rounded-md px-3 py-1 text-xs text-slate-400
                border border-slate-200 max-w-xs mx-auto text-center">
                Tableau de bord — Administration
              </div>
            </div>
          </div>
          {/* Image du vrai dashboard */}
          <div className="rounded-b-2xl overflow-hidden border border-slate-200 shadow-2xl shadow-slate-900/20">
            <img
              src="/dashboard-preview.PNG"
              alt="Tableau de bord EduGest"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Onglets rôles */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {[
            { role: 'Administrateur', desc: 'Vue globale, statistiques, gestion', active: true },
            { role: 'Enseignant',     desc: 'Notes, cours, planning', active: false },
            { role: 'Parent',         desc: 'Notes enfant, paiements, messagerie', active: false },
          ].map(r => (
            <div key={r.role}
              className={`px-5 py-3 rounded-xl border text-sm transition-all cursor-pointer
                ${r.active
                  ? 'border-[#1B3A6B] bg-[#1B3A6B]/5 text-[#1B3A6B] font-semibold'
                  : 'border-slate-200 text-slate-500 hover:border-[#1B3A6B]/40'}`}>
              <span className="font-medium">{r.role}</span>
              <span className="hidden sm:inline text-xs opacity-70 ml-2">— {r.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Section : CTA Final ───────────────────────────────────────────
function CTASection() {
  const [ref, inView] = useInView()
  return (
    <section className="py-24 bg-gradient-to-br from-[#0d2044] via-[#1B3A6B] to-[#2d5a9e]
      relative overflow-hidden">

      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 60%), radial-gradient(circle at 80% 50%, #3b82f6 0%, transparent 60%)',
        }} />

      <div ref={ref}
        className={`relative max-w-3xl mx-auto px-6 text-center
          transition-all duration-700
          ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center
          justify-center mx-auto mb-6 border border-white/20">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
            <path d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h2 className="font-bold text-white mb-4"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 'clamp(2rem, 4vw, 3rem)',
          }}>
          Faites partie de notre communauté scolaire
        </h2>

        <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Créez votre compte et accédez dès aujourd’hui à l’espace
          numérique de l’école, en toute sécurité.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button variant="gold" size="xl" href="/register">
            Créer mon compte
            <ChevronRight size={20} />
          </Button>
          <Button variant="ghost" size="xl" href="/login"
            className="!text-white hover:!bg-white/10">
            J’ai déjà un compte
          </Button>
        </div>
      </div>
    </section>
  )
}

// ── Section : Footer ──────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-6">

        {/* Top */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12
          border-b border-slate-800">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#1B3A6B] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-bold text-white text-lg"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                EduGest
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              La plateforme de gestion académique pensée pour les écoles
              francophones d'Afrique centrale.
            </p>
            {/* Réseaux sociaux */}
            <div className="flex gap-3 mt-5">
              {[
                { name: 'Facebook', icon: '📘' },
                { name: 'Twitter',  icon: '🐦' },
                { name: 'LinkedIn', icon: '💼' },
              ].map(s => (
                <a key={s.name} href="#"
                  className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-[#1B3A6B]
                    flex items-center justify-center text-base transition-colors"
                  title={s.name}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Liens utiles */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm tracking-wider uppercase">
              Liens utiles
            </h4>
            <ul className="space-y-2">
              {['Notre école','Calendrier scolaire','Règlement intérieur','Inscription'].map(l => (
                <li key={l}>
                  <a href="#" className="text-sm hover:text-white transition-colors">{l}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm tracking-wider uppercase">
              Contact
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <MessageSquare size={14} className="text-amber-400 shrink-0" />
                contact@notre-ecole.cm
              </li>
              <li className="flex items-center gap-2.5">
                <Clock size={14} className="text-amber-400 shrink-0" />
                +237 6XX XXX XXX
              </li>
              <li className="flex items-center gap-2.5">
                <Globe size={14} className="text-amber-400 shrink-0" />
                Yaoundé, Cameroun
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between
          gap-4 pt-8 text-xs">
          <p>© {new Date().getFullYear()} EduGest. Tous droits réservés.</p>
          <div className="flex gap-6">
            {['Confidentialité','Conditions d\'utilisation','Mentions légales'].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Page principale : LandingPage ─────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* Fonts Google */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');

        * { font-family: 'DM Sans', system-ui, sans-serif; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        html { scroll-behavior: smooth; }
      `}</style>

      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <AdvantagesSection />
      <PreviewSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </>
  )
}