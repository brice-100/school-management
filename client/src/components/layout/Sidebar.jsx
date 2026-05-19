import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useYear } from '../../context/YearContext'
import {
  LayoutDashboard, Users, GraduationCap, UserCheck,
  School, CreditCard, BookOpen, Calendar, FileText,
  DollarSign, ShieldCheck, LogOut, ChevronRight, Bell, MessageSquare, AlertTriangle, Book, ClipboardCheck, X
} from 'lucide-react'

const NAV_BY_ROLE = {
  admin: [
    { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/annees-academiques', icon: Calendar,    label: 'Années Académiques' },
    { to: '/users',          icon: ShieldCheck,     label: 'Comptes' },
    { to: '/students',       icon: Users,           label: 'Élèves' },
    { to: '/teachers',       icon: GraduationCap,   label: 'Enseignants' },
    { to: '/parents',        icon: UserCheck,       label: 'Parents' },
    { to: '/classes',        icon: School,          label: 'Classes & Matières' },
    { to: '/paiements',      icon: CreditCard,      label: 'Paiements' },
    { to: '/grades',         icon: BookOpen,        label: 'Notes' },
    { to: '/planning',       icon: Calendar,        label: 'Planning' },
    { to: '/bulletins',      icon: FileText,        label: 'Bulletins' },
    { to: '/evaluations',    icon: ClipboardCheck,  label: 'Évaluations' },
    { to: '/salaries',       icon: DollarSign,      label: 'Salaires' },
    { to: '/bibliotheque',   icon: Book,            label: 'Bibliothèque' },
    { to: '/rapports',       icon: AlertTriangle,   label: 'Discipline' },
    { to: '/messagerie',     icon: MessageSquare,   label: 'Messagerie' },
  ],
  teacher: [
    { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/teacher/eleves', icon: Users,           label: 'Mes élèves' },
    { to: '/teacher/absences', icon: AlertTriangle, label: 'Saisie Absences' },
    { to: '/teacher/devoirs', icon: BookOpen,        label: 'Publier Devoir' },
    { to: '/grades',         icon: BookOpen,        label: 'Mes notes' },
    { to: '/planning',       icon: Calendar,        label: 'Mon planning' },
    { to: '/evaluations',    icon: ClipboardCheck,  label: 'Évaluations' },
    { to: '/bulletins',      icon: FileText,        label: 'Bulletins' },
    { to: '/mon-salaire',    icon: DollarSign,      label: 'Mon salaire' },
    { to: '/teacher/messagerie', icon: MessageSquare, label: 'Messagerie Admin' },
  ],

  parent: [
    { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/mon-enfant',     icon: Users,           label: 'Mes enfants' },
    { to: '/parent/absences', icon: AlertTriangle, label: 'Suivi Absences' },
    { to: '/parent/emploi-du-temps', icon: Calendar, label: 'Emploi du Temps' },
    { to: '/parent/devoirs',  icon: Book,            label: 'Cahier de Textes' },
    { to: '/bulletins',      icon: FileText,        label: 'Bulletins' },
    { to: '/paiements',      icon: CreditCard,      label: 'Mes paiements' },
    { to: '/parent/messagerie', icon: MessageSquare, label: 'Messagerie Enseignants' },
  ],
}

const ROLE_LABEL = { admin: 'Administrateur', teacher: 'Enseignant', parent: 'Parent' }
const ROLE_DOT   = { admin: 'bg-yellow-400',  teacher: 'bg-emerald-400', parent: 'bg-blue-400' }

export default function Sidebar({ mobile, onClose }) {
  const { user, logout } = useAuth()
  const { annees, selectedYear, changeYear, loading } = useYear()
  const navigate         = useNavigate()
  const role             = user?.role || 'parent'
  const items            = NAV_BY_ROLE[role] || NAV_BY_ROLE.parent
  
  return (
    <aside className={`
      ${mobile ? 'flex h-full' : 'hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:h-screen'}
      w-60 bg-primary-500 flex-col z-30
    `}>

      {/* Logo */}
      <div className="px-6 py-5 border-b border-primary-400/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent-400 rounded-xl flex items-center justify-center">
            <School size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-display font-semibold text-sm leading-tight">
              ÉcoleManager
            </p>
            <p className="text-primary-300 text-xs">Gestion scolaire</p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="lg:hidden p-2 text-primary-200 hover:text-white transition-colors">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Selecteur d'Année Académique */}
      {!loading && annees && annees.length > 0 && (
        <div className="px-4 py-3 border-b border-primary-400/20">
          <label className="text-[10px] uppercase text-primary-300 font-bold mb-1 block">
            Année Académique
          </label>
          <select 
            value={selectedYear?.idAnnee || ''} 
            onChange={(e) => changeYear(e.target.value)}
            className="w-full bg-white/10 text-white text-xs border border-primary-400/30 rounded-lg px-2 py-1.5 focus:outline-none"
          >
            {annees.map(a => (
              <option key={a.idAnnee} value={a.idAnnee} className="text-gray-800">
                {a.libelle} {a.est_active === 1 ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Badge rôle */}
      <div className="px-4 py-2 border-b border-primary-400/20">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${ROLE_DOT[role]}`} />
          <span className="text-primary-200 text-xs">{ROLE_LABEL[role]}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
               transition-all duration-150
               ${isActive
                 ? 'bg-white/15 text-white'
                 : 'text-primary-200 hover:bg-white/10 hover:text-white'}`
            }>
            {({ isActive }) => (
              <>
                <Icon size={17} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="opacity-60" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profil + Déconnexion */}
      <div className="px-3 py-4 border-t border-primary-400/30">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 bg-accent-400 rounded-full flex items-center
            justify-center text-white text-xs font-semibold shrink-0">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-primary-300 text-xs">{ROLE_LABEL[role]}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
            text-primary-200 hover:bg-white/10 hover:text-white text-sm transition-all">
          <LogOut size={16} /> Déconnexion
        </button>
      </div>
    </aside>
  )
}