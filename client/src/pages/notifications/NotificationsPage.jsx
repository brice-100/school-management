import { useState, useEffect } from 'react'
import { Bell, Send, Trash2, CheckCheck, Users, User } from 'lucide-react'
import {
  getAllNotifications, getMyNotifications,
  sendNotification, markRead, markAllRead, deleteNotification,
} from '../../services/notificationService'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// ── Vue Admin ────────────────────────────────────────────────────
function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [parents,       setParents]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [sending,       setSending]       = useState(false)

  const [form, setForm] = useState({
    tous_parents:     false,
    destinataire_ids: [],
    sujet:            '',
    message:          '',
  })

  useEffect(() => {
    api.get('/parents').then(({ data }) => setParents(data.data || []))
    fetchNotifs()
  }, [])

  const fetchNotifs = async () => {
    setLoading(true)
    try {
      const { data } = await getAllNotifications()
      setNotifications(data.data || [])
    } catch { toast.error('Erreur chargement.') }
    finally { setLoading(false) }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!form.message.trim())
      return toast.error('Le message est requis.')
    if (!form.tous_parents && !form.destinataire_ids.length)
      return toast.error('Choisissez au moins un destinataire ou "Tous les parents".')

    setSending(true)
    try {
      const payload = {
        message:          form.message,
        sujet:            form.sujet || null,
        tous_parents:     form.tous_parents,
        destinataire_ids: form.tous_parents ? [] : form.destinataire_ids.map(Number),
      }
      const { data } = await sendNotification(payload)
      toast.success(data.message, { duration: 3000 })
      setForm({ tous_parents: false, destinataire_ids: [], sujet: '', message: '' })
      fetchNotifs()
    } catch (err) {
      toast.error(err.message || 'Erreur envoi.')
    } finally { setSending(false) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette notification ?')) return
    try {
      await deleteNotification(id)
      toast.success('Supprimée.')
      fetchNotifs()
    } catch { toast.error('Erreur suppression.') }
  }

  const toggleParent = (id) => {
    setForm(f => ({
      ...f,
      destinataire_ids: f.destinataire_ids.includes(id)
        ? f.destinataire_ids.filter(x => x !== id)
        : [...f.destinataire_ids, id],
    }))
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-gray-900">Notifications</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Envoyez des messages aux parents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Formulaire envoi */}
        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Send size={14} /> Envoyer un message
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Destinataires */}
            <div>
              <label className="form-label">Destinataires *</label>
              <label className="flex items-center gap-3 p-3 bg-primary-50 border
                border-primary-200 rounded-xl cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={form.tous_parents}
                  onChange={e => setForm(f => ({
                    ...f,
                    tous_parents: e.target.checked,
                    destinataire_ids: [],
                  }))}
                  className="w-4 h-4 rounded text-primary-500"
                />
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-primary-500" />
                  <span className="text-sm font-medium text-primary-700">
                    Envoyer à TOUS les parents ({parents.length})
                  </span>
                </div>
              </label>

              {!form.tous_parents && (
                <div className="border border-gray-200 rounded-xl max-h-40 overflow-y-auto">
                  {parents.length === 0 ? (
                    <p className="text-center text-gray-400 text-xs py-4">
                      Aucun parent actif
                    </p>
                  ) : (
                    parents.map(p => (
                      <label key={p.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50
                          cursor-pointer border-b border-gray-50 last:border-0">
                        <input
                          type="checkbox"
                          checked={form.destinataire_ids.includes(p.id)}
                          onChange={() => toggleParent(p.id)}
                          className="w-4 h-4 rounded text-primary-500"
                        />
                        <div className="w-7 h-7 rounded-full bg-purple-50 flex items-center
                          justify-center text-purple-600 text-xs font-semibold shrink-0">
                          {p.prenom?.[0]}{p.nom?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {p.prenom} {p.nom}
                          </p>
                          <p className="text-xs text-gray-400">{p.telephone}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              )}

              {!form.tous_parents && form.destinataire_ids.length > 0 && (
                <p className="text-xs text-primary-600 mt-1.5">
                  {form.destinataire_ids.length} parent(s) sélectionné(s)
                </p>
              )}
            </div>

            {/* Sujet */}
            <div>
              <label className="form-label">Sujet (optionnel)</label>
              <input
                value={form.sujet}
                onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))}
                placeholder="Ex: Réunion parents d'élèves"
                className="input-field"
              />
            </div>

            {/* Message */}
            <div>
              <label className="form-label">Message *</label>
              <textarea
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="Rédigez votre message ici..."
                rows={4}
                className="input-field resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {form.message.length} caractère(s)
              </p>
            </div>

            <button type="submit" disabled={sending}
              className="btn-primary w-full flex items-center justify-center gap-2">
              <Send size={15} />
              {sending ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
          </form>
        </div>

        {/* Historique */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Bell size={14} /> Historique ({notifications.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Bell size={32} className="text-gray-200 mb-3" />
              <p className="text-gray-400 text-sm">Aucune notification envoyée.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
              {notifications.map(n => (
                <div key={n.id}
                  className="px-5 py-4 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <User size={13} className="text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {n.dest_prenom} {n.dest_nom}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <p className="text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      <button onClick={() => handleDelete(n.id)}
                        className="opacity-0 group-hover:opacity-100 btn-icon
                          text-red-400 hover:bg-red-50 hover:text-red-600 transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  {n.sujet && (
                    <p className="text-xs font-semibold text-gray-700 mt-1">{n.sujet}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vue Parent ───────────────────────────────────────────────────
function ParentNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unread,        setUnread]        = useState(0)
  const [loading,       setLoading]       = useState(true)

  const fetchNotifs = async () => {
    setLoading(true)
    try {
      const { data } = await getMyNotifications()
      setNotifications(data.data   || [])
      setUnread(data.unread || 0)
    } catch { toast.error('Erreur chargement.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchNotifs() }, [])

  const handleMarkRead = async (id) => {
    try {
      await markRead(id)
      fetchNotifs()
    } catch { /* silencieux */ }
  }

  const handleMarkAll = async () => {
    try {
      await markAllRead()
      toast.success('Tout marqué comme lu.')
      fetchNotifs()
    } catch { toast.error('Erreur.') }
  }

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Notifications
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {unread > 0
              ? <span className="text-primary-600 font-medium">{unread} non lue(s)</span>
              : 'Tout est à jour'
            }
          </p>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAll}
            className="btn-secondary flex items-center gap-2 text-sm">
            <CheckCheck size={15} /> Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-3 w-1/3 rounded" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <Bell size={40} className="text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">
              Aucune notification pour le moment.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(n => (
              <div key={n.id}
                onClick={() => !n.lu && handleMarkRead(n.id)}
                className={`px-5 py-4 cursor-pointer transition-colors
                  ${n.lu
                    ? 'hover:bg-gray-50/50'
                    : 'bg-blue-50/40 hover:bg-blue-50/70 border-l-3 border-primary-400'
                  }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {!n.lu && (
                      <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1" />
                    )}
                    <div>
                      {n.sujet && (
                        <p className="text-sm font-semibold text-gray-800">{n.sujet}</p>
                      )}
                      <p className="text-sm text-gray-700 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">
                    {new Date(n.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {!n.lu && (
                  <p className="text-xs text-primary-500 mt-1.5">
                    Cliquez pour marquer comme lu
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Export — auto-sélection selon le rôle ────────────────────────
export default function NotificationsPage() {
  const { user } = useAuth()
  return user?.role === 'parent'
    ? <ParentNotifications />
    : <AdminNotifications />
}