import { useState } from 'react'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: '', newPassword: '', confirm: '',
  })
  const [show,    setShow]    = useState({ cur: false, new: false, conf: false })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k, v) => { setError(''); setForm(f => ({ ...f, [k]: v })) }
  const toggleShow = (k) => setShow(s => ({ ...s, [k]: !s[k] }))

  const validate = () => {
    if (!form.currentPassword) return 'Mot de passe actuel requis.'
    if (!form.newPassword || form.newPassword.length < 6)
      return 'Nouveau mot de passe trop court (minimum 6 caractères).'
    if (form.newPassword === form.currentPassword)
      return 'Le nouveau mot de passe doit être différent de l\'actuel.'
    if (form.newPassword !== form.confirm)
      return 'Les mots de passe ne correspondent pas.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    try {
      await api.post('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      setSuccess(true)
      toast.success('Mot de passe modifié avec succès !')
      setForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Mot de passe actuel incorrect.')
    } finally {
      setLoading(false)
    }
  }

  const PwdInput = ({ label, name, showKey, placeholder }) => (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative">
        <input
          type={show[showKey] ? 'text' : 'password'}
          value={form[name]}
          onChange={e => set(name, e.target.value)}
          placeholder={placeholder}
          className={`input-field pr-10 ${
            name === 'confirm' && form.confirm && form.confirm !== form.newPassword
              ? 'border-red-300' : ''
          }`}
        />
        <button type="button" onClick={() => toggleShow(showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show[showKey] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {name === 'confirm' && form.confirm && form.confirm !== form.newPassword && (
        <p className="error-msg">Les mots de passe ne correspondent pas</p>
      )}
    </div>
  )

  return (
    <div className="page-container max-w-lg">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
            <Lock size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-gray-900">
              Changer le mot de passe
            </h1>
            <p className="text-gray-500 text-sm">Sécurisez votre compte</p>
          </div>
        </div>
      </div>

      {success && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200
          rounded-xl p-4 mb-5">
          <CheckCircle size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-800 font-medium text-sm">Mot de passe modifié !</p>
            <p className="text-emerald-600 text-xs mt-0.5">
              Votre mot de passe a été mis à jour avec succès.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200
          text-red-700 text-sm px-4 py-3 rounded-xl mb-5">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <PwdInput label="Mot de passe actuel *" name="currentPassword"
          showKey="cur" placeholder="Votre mot de passe actuel" />

        <div className="border-t border-gray-100 pt-4 space-y-4">
          <PwdInput label="Nouveau mot de passe *" name="newPassword"
            showKey="new" placeholder="Minimum 6 caractères" />
          <PwdInput label="Confirmer le nouveau mot de passe *" name="confirm"
            showKey="conf" placeholder="Répétez le nouveau mot de passe" />
        </div>

        {/* Indicateur force mot de passe */}
        {form.newPassword.length > 0 && (
          <div>
            <div className="flex gap-1 mb-1">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  form.newPassword.length >= i * 3
                    ? i <= 2 ? 'bg-red-400' : i === 3 ? 'bg-amber-400' : 'bg-emerald-500'
                    : 'bg-gray-200'
                }`} />
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {form.newPassword.length < 6 ? 'Trop court'
                : form.newPassword.length < 9 ? 'Faible'
                : form.newPassword.length < 12 ? 'Moyen'
                : 'Fort'}
            </p>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Modification...
            </span>
          ) : 'Changer le mot de passe'}
        </button>
      </form>

      <div className="card p-4 mt-4 bg-blue-50/50 border-blue-100">
        <p className="text-xs text-blue-700 font-medium mb-1">💡 Conseils de sécurité</p>
        <ul className="text-xs text-blue-600 space-y-0.5">
          <li>• Utilisez au moins 8 caractères</li>
          <li>• Mélangez lettres, chiffres et symboles</li>
          <li>• Évitez les mots du dictionnaire</li>
        </ul>
      </div>
    </div>
  )
}