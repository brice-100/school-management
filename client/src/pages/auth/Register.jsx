import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  School, GraduationCap, Users,
  Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft,
} from 'lucide-react'
import { registerTeacher, registerParent } from '../../services/authServices'

// ── Sous-composants isolés — zéro conflit de portée ────────────────

function Logo() {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
        <School size={18} className="text-white" />
      </div>
      <p className="font-display font-semibold text-primary-500 text-lg">ÉcoleManager</p>
    </div>
  )
}

function Spinner() {
  return (
    <span className="flex items-center justify-center gap-2">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10"
          stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      Inscription en cours...
    </span>
  )
}

// Carte cliquable pour choisir un rôle
function RoleCard({ item, onSelect }) {
  const { key, icon: Icon, label, desc, color, bg } = item
  return (
    <button
      key={key}
      onClick={() => onSelect(key)}
      className="flex items-center gap-5 p-5 rounded-2xl border-2 transition-all
        duration-150 text-left hover:border-gray-300 hover:shadow-sm bg-white border-gray-100"
    >
      <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center shrink-0`}>
        <Icon size={28} className={color} />
      </div>
      <div>
        <p className="font-semibold text-gray-900 mb-0.5">{label}</p>
        <p className="text-gray-500 text-sm">{desc}</p>
      </div>
    </button>
  )
}

// Badge affiché au-dessus du formulaire une fois le rôle choisi
function RoleBadge({ item, onReset }) {
  const { icon: Icon, label, color, bg } = item
  return (
    <div className={`flex items-center gap-3 p-3 ${bg} rounded-xl mb-6`}>
      <Icon size={20} className={color} />
      <p className={`text-sm font-medium flex-1 ${color}`}>
        Inscription — {label}
      </p>
      <button
        onClick={onReset}
        className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1"
      >
        <ArrowLeft size={13} /> Changer
      </button>
    </div>
  )
}

// ── Données des rôles ──────────────────────────────────────────────

const ROLES = [
  {
    key:   'teacher',
    icon:  GraduationCap,
    label: 'Enseignant(e)',
    desc:  'Je donne des cours dans cet établissement',
    color: 'text-blue-600',
    bg:    'bg-blue-50',
  },
  {
    key:   'parent',
    icon:  Users,
    label: 'Parent / Tuteur',
    desc:  "J'ai un enfant inscrit dans cet établissement",
    color: 'text-emerald-600',
    bg:    'bg-emerald-50',
  },
]

// ── Composant principal ────────────────────────────────────────────

export default function Register() {
  const [role,    setRole]    = useState(null)
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  const [form, setForm] = useState({
    nom: '', prenom: '', email: '',
    telephone: '', mot_de_passe: '', confirm: '',
  })

  const handleChange = (e) => {
    setError('')
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const validate = () => {
    if (!form.prenom || !form.nom)
      return 'Prénom et nom requis.'
    if (role === 'teacher' && !form.email)
      return 'Email requis pour les enseignants.'
    if (!form.telephone)
      return 'Numéro de téléphone requis.'
    if (!form.mot_de_passe || form.mot_de_passe.length < 6)
      return 'Mot de passe trop court (minimum 6 caractères).'
    if (form.mot_de_passe !== form.confirm)
      return 'Les mots de passe ne correspondent pas.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) { setError(validationError); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('nom',          form.nom)
      fd.append('prenom',       form.prenom)
      fd.append('telephone',    form.telephone)
      fd.append('mot_de_passe', form.mot_de_passe)
      if (form.email) fd.append('email', form.email)

      if (role === 'teacher') await registerTeacher(fd)
      else                    await registerParent(fd)

      setSuccess(true)
    } catch (submitError) {
      setError(submitError.message || "Erreur lors de l'inscription.")
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find(r => r.key === role) ?? null

  // ── Écran succès ───────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-gray-900 mb-3">
            Inscription réussie !
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed mb-2">
            Votre compte a bien été créé. Un administrateur va examiner votre
            demande et activer votre accès.
          </p>
          <p className="text-gray-400 text-xs mb-8">
            Vous recevrez une confirmation dès que votre compte sera validé.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
            <p className="text-amber-800 text-sm font-medium mb-1">⏳ En attente de validation</p>
            <p className="text-amber-700 text-xs">
              Votre compte est actuellement en attente. Vous ne pourrez pas vous
              connecter avant la validation de l'administrateur.
            </p>
          </div>
          <Link to="/login" className="btn-primary w-full block text-center">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  // ── Étape 1 : choix du rôle ────────────────────────────────────
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          <Logo />
          <h1 className="font-display text-2xl font-semibold text-gray-900 text-center mb-2">
            Créer un compte
          </h1>
          <p className="text-gray-500 text-sm text-center mb-8">
            Qui êtes-vous dans cet établissement ?
          </p>

          <div className="grid grid-cols-1 gap-4 mb-8">
            {ROLES.map(item => (
              <RoleCard key={item.key} item={item} onSelect={setRole} />
            ))}
          </div>

          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary-500 font-medium hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Étape 2 : formulaire ───────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md">
        <Logo />

        <RoleBadge item={selectedRole} onReset={() => setRole(null)} />

        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-gray-900 mb-5">
            Vos informations
          </h2>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200
              text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Prénom *</label>
                <input name="prenom" value={form.prenom} onChange={handleChange}
                  placeholder="Marie" className="input-field" />
              </div>
              <div>
                <label className="form-label">Nom *</label>
                <input name="nom" value={form.nom} onChange={handleChange}
                  placeholder="Dupont" className="input-field" />
              </div>
            </div>

            <div>
              <label className="form-label">
                Email {role === 'teacher' ? '*' : '(optionnel)'}
              </label>
              <input name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="marie.dupont@email.com"
                className="input-field" />
            </div>

            <div>
              <label className="form-label">Téléphone *</label>
              <input name="telephone" value={form.telephone} onChange={handleChange}
                placeholder="6XX XXX XXX" className="input-field" />
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div>
                <label className="form-label">Mot de passe *</label>
                <div className="relative">
                  <input
                    name="mot_de_passe" value={form.mot_de_passe}
                    onChange={handleChange}
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Minimum 6 caractères"
                    className="input-field pr-10"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2
                      text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label">Confirmer le mot de passe *</label>
                <input
                  name="confirm" value={form.confirm} onChange={handleChange}
                  type="password" placeholder="Répétez le mot de passe"
                  className={`input-field ${
                    form.confirm && form.confirm !== form.mot_de_passe
                      ? 'border-red-300 focus:border-red-400' : ''
                  }`}
                />
                {form.confirm && form.confirm !== form.mot_de_passe && (
                  <p className="error-msg">Les mots de passe ne correspondent pas</p>
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-amber-800 text-xs leading-relaxed">
                ⚠️ Votre compte sera soumis à validation par l'administrateur avant activation.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? <Spinner /> : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary-500 font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}