import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Send, Search, Plus, X, Check,
  MessageSquare, Bell, Users, RefreshCw,
  Inbox, Mail, MailOpen, GraduationCap, Trash2
} from 'lucide-react'
import {
  getMessages, getAllMessages, getMessagesRecents,
  getMessagesRecus, getUnreadCount,
  sendMessage, replyMessage, sendMessageMasse,
  validerMessage, lireMessage,
  getInternalMessages, replyInternalMessage,
  markInternalAsLu, deleteInternalMessage
} from '../../services/messageService'
import { getMessagesParents, repondreMessageParent, markMessageParentLu, createMessageParent } from '../../services/messageParentService'
import { getParents } from '../../services/parentService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return '—'
  const date = new Date(d)
  const now  = new Date()
  const diff = now - date
  if (diff < 60000)  return 'À l\'instant'
  if (diff < 3600000) return `Il y a ${Math.floor(diff/60000)} min`
  if (diff < 86400000) return `Il y a ${Math.floor(diff/3600000)} h`
  return date.toLocaleDateString('fr-FR')
}

const TYPE_LABEL = {
  0: { label: 'Individuel',       cls: 'bg-blue-50 text-blue-700' },
  1: { label: 'Tous les parents', cls: 'bg-purple-50 text-purple-700' },
  2: { label: 'Paiement',         cls: 'bg-amber-50 text-amber-700' },
}

// ── Bulle de message Parent ──────────────────────────────────────
function MessageBubble({ msg, onValider, onLire, onReply, isAdmin }) {
  const t = TYPE_LABEL[msg.type_message] ?? TYPE_LABEL[0]
  const isRead = Boolean(msg.valider)

  return (
    <div
      className={`card p-4 hover:shadow-sm transition-all cursor-pointer
        ${!isRead ? 'border-l-4 border-primary-400' : 'border-l-4 border-transparent'}`}
      onClick={() => !isRead && onLire && onLire(msg.idMessages)}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs
          font-semibold shrink-0 ${isRead ? 'bg-gray-100 text-gray-500' : 'bg-primary-100 text-primary-600'}`}>
          {!isRead ? <Mail size={15} /> : <MailOpen size={15} />}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className={`text-sm font-semibold ${!isRead ? 'text-gray-900' : 'text-gray-600'}`}>
              {msg.objet}
            </p>
            <span className={`badge text-xs ${t.cls}`}>{t.label}</span>
            {!isRead && (
              <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
            )}
          </div>
          <p className="text-gray-500 text-xs line-clamp-2 mb-2">{msg.information}</p>
          <p className="text-gray-400 text-xs">{fmtDate(msg.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isAdmin && !msg.valider && (
            <button
              onClick={e => { e.stopPropagation(); onValider(msg.idMessages) }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50
                hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition-colors"
            >
              <Check size={12} /> Valider
            </button>
          )}
          {onReply && (
            <button
              onClick={e => { e.stopPropagation(); onReply(msg) }}
              className="btn-icon" title="Répondre"
            >
              <Send size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Bulle de message Enseignant (Interne) ─────────────────────────
function TeacherMessageBubble({ msg, onReply, onLu, onDelete }) {
  const isRead = Boolean(msg.lu)

  return (
    <div
      className={`card p-4 hover:shadow-sm transition-all
        ${!isRead ? 'border-l-4 border-emerald-500 bg-emerald-50/5' : 'border-l-4 border-transparent'}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs
          font-semibold shrink-0 ${isRead ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-600'}`}>
          {!isRead ? <Mail size={15} /> : <MailOpen size={15} />}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className={`text-sm font-semibold ${!isRead ? 'text-gray-900' : 'text-gray-600'}`}>
              {msg.objet}
            </p>
            <span className="badge text-[10px] bg-emerald-50 text-emerald-700">Enseignant</span>
            <span className="badge text-[10px] bg-gray-50 text-gray-600 capitalize">Sujet: {msg.type_sujet}</span>
            {!isRead && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            )}
          </div>
          
          <p className="text-gray-500 text-xs mb-1">
            Expéditeur : <span className="font-semibold text-gray-700">{msg.exp_prenom} {msg.exp_nom}</span>
          </p>

          {msg.eleve_nom && (
            <p className="text-xs font-semibold text-primary-600 mb-2">
              📍 Élève concerné : {msg.eleve_prenom} {msg.eleve_nom}
            </p>
          )}

          <p className="text-gray-600 text-sm whitespace-pre-wrap mt-1.5">{msg.contenu}</p>

          {msg.reponse && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Votre réponse :</p>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{msg.reponse}</p>
              {msg.repondu_at && (
                <p className="text-[10px] text-gray-400 mt-1">{fmtDate(msg.repondu_at)}</p>
              )}
            </div>
          )}

          <p className="text-gray-400 text-[10px] mt-2">{fmtDate(msg.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isRead && onLu && (
            <button
              onClick={() => onLu(msg.idMessage)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50
                hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
            >
              Marquer lu
            </button>
          )}
          {!msg.reponse && onReply && (
            <button
              onClick={() => onReply(msg)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50
                hover:bg-emerald-100 text-emerald-700 text-xs font-medium rounded-lg transition-colors"
            >
              <Send size={12} /> Répondre
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(msg.idMessage)}
              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500 transition-colors"
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Formulaire nouveau message ────────────────────────────────────
function NouveauMessageForm({ parents, onSuccess, onCancel, isAdmin, isTeacher }) {
  const [loading, setLoading] = useState(false)
  const [masse, setMasse] = useState(false)
  const [form, setForm] = useState({
    objet: '', information: '', type_message: 0,
    idParent: '', AnneeAcade: '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.objet || !form.information) return toast.error('Objet et message requis.')
    setLoading(true)
    try {
      if (masse) {
        await sendMessageMasse({ objet: form.objet, information: form.information, type_message: form.type_message })
        toast.success('Message envoyé à tous les parents !')
      } else if (isTeacher) {
        await sendMessage({ ...form, idParent: 0, type_message: 0 })
        toast.success('Message envoyé à l\'administration !')
      } else {
        if (!form.idParent) return toast.error('Destinataire requis.')
        await createMessageParent({ destType: 'parent', idParent: parseInt(form.idParent), objet: form.objet, contenu: form.information })
        toast.success('Message envoyé au parent !')
      }
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Erreur envoi.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-gray-900">Nouveau message</h3>
          <button onClick={onCancel} className="btn-icon"><X size={16} /></button>
        </div>

        {isAdmin && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMasse(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all
                ${!masse ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Mail size={14} className="inline mr-1.5" /> Individuel
            </button>
            <button
              onClick={() => setMasse(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all
                ${masse ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <Users size={14} className="inline mr-1.5" /> Tous les parents
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!masse && !isTeacher && (
            <div>
              <label className="form-label font-medium mb-1 block">Parent destinataire *</label>
              <select value={form.idParent} onChange={e => set('idParent', e.target.value)}
                className="input-field">
                <option value="">Sélectionnez un parent...</option>
                {parents.map(p => (
                  <option key={p.idParent} value={p.idParent}>
                    {p.nom} {p.prenom}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label font-medium mb-1 block">Objet *</label>
              <input value={form.objet} onChange={e => set('objet', e.target.value)}
                placeholder="Ex: Problème d'assiduité" className="input-field" />
            </div>
            {!isTeacher && (
              <div>
                <label className="form-label font-medium mb-1 block">Type de message</label>
                <select value={form.type_message} onChange={e => set('type_message', e.target.value)}
                  className="input-field">
                  <option value={0}>Individuel</option>
                  <option value={1}>Tous les parents</option>
                  <option value={2}>Paiement</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="form-label font-medium mb-1 block">Message *</label>
            <textarea value={form.information} onChange={e => set('information', e.target.value)}
              placeholder="Rédigez votre message ici..."
              rows={4} className="input-field resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Envoi...' : (
                <><Send size={14} /> {masse ? `Envoyer à tous` : 'Envoyer'}</>
              )}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Formulaire réponse Parent ─────────────────────────────────────
function ReplyForm({ original, onSuccess, onCancel }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return toast.error('Message vide.')
    setLoading(true)
    try {
      await replyMessage({
        idMessageOriginal: original.idMessages,
        information: text,
        idParent: original.idParent,
        objet: `Re: ${original.objet}`,
        type_message: original.type_message || 0,
      })
      toast.success('Réponse envoyée !')
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Erreur.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-gray-900">Répondre</h3>
          <button onClick={onCancel} className="btn-icon"><X size={16} /></button>
        </div>

        {/* Message original */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-400 mb-1">Message original</p>
          <p className="text-sm font-medium text-gray-700">{original.objet}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{original.information}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="form-label font-medium mb-1 block">Votre réponse *</label>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Rédigez votre réponse..."
              rows={4} className="input-field resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Envoi...' : <><Send size={14} /> Envoyer</>}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Formulaire réponse Enseignant ─────────────────────────────────
function ReplyInternalForm({ original, onSuccess, onCancel }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return toast.error('Message vide.')
    setLoading(true)
    try {
      await replyInternalMessage(original.idMessage, text)
      toast.success('Réponse envoyée à l\'enseignant !')
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Erreur.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-gray-900">Répondre à l'enseignant</h3>
          <button onClick={onCancel} className="btn-icon"><X size={16} /></button>
        </div>

        {/* Message original */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-400 mb-1">Message de {original.exp_prenom} {original.exp_nom}</p>
          <p className="text-sm font-medium text-gray-700">{original.objet}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{original.contenu}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="form-label font-medium mb-1 block">Votre réponse *</label>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Rédigez votre réponse..."
              rows={4} className="input-field resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Envoi...' : <><Send size={14} /> Envoyer</>}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Bulle de message Parent (Nouveau Système) ─────────────────────
function ParentMessageBubble({ msg, onReply, onLu }) {
  const isRead = Boolean(msg.reponse) || Boolean(msg.lu); 

  return (
    <div
      className={`card p-4 hover:shadow-sm transition-all
        ${!isRead ? 'border-l-4 border-primary-500 bg-primary-50/5' : 'border-l-4 border-transparent'}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs
          font-semibold shrink-0 ${isRead ? 'bg-gray-100 text-gray-500' : 'bg-primary-100 text-primary-600'}`}>
          {!isRead ? <Mail size={15} /> : <MailOpen size={15} />}
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className={`text-sm font-semibold ${!isRead ? 'text-gray-900' : 'text-gray-600'}`}>
              {msg.objet}
            </p>
            <span className="badge text-[10px] bg-primary-50 text-primary-700">Parent</span>
            {!isRead && (
              <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
            )}
          </div>
          
          <p className="text-gray-500 text-xs mb-1">
            De : <span className="font-semibold text-gray-700">{msg.parent_nom || msg.exp_nom}</span>
          </p>

          <p className="text-gray-600 text-sm whitespace-pre-wrap mt-1.5">{msg.contenu}</p>

          {msg.reponse && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 mt-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Votre réponse :</p>
              <p className="text-xs text-gray-700 whitespace-pre-wrap">{msg.reponse}</p>
              {msg.repondu_at && (
                <p className="text-[10px] text-gray-400 mt-1">{fmtDate(msg.repondu_at)}</p>
              )}
            </div>
          )}

          <p className="text-gray-400 text-[10px] mt-2">{fmtDate(msg.created_at)}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isRead && onLu && (
            <button
              onClick={() => onLu(msg.idMsg)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50
                hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
            >
              Marquer lu
            </button>
          )}
          {!msg.reponse && onReply && (
            <button
              onClick={() => onReply(msg)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-primary-50
                hover:bg-primary-100 text-primary-700 text-xs font-medium rounded-lg transition-colors"
            >
              <Send size={12} /> Répondre
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Formulaire réponse Parent (Nouveau Système) ───────────────────
function ReplyParentForm({ original, onSuccess, onCancel }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return toast.error('Message vide.')
    setLoading(true)
    try {
      await repondreMessageParent(original.idMsg, text)
      toast.success('Réponse envoyée !')
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Erreur.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-gray-900">Répondre</h3>
          <button onClick={onCancel} className="btn-icon"><X size={16} /></button>
        </div>

        {/* Message original */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-gray-400 mb-1">Message de {original.parent_nom || original.exp_nom}</p>
          <p className="text-sm font-medium text-gray-700">{original.objet}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{original.contenu}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="form-label font-medium mb-1 block">Votre réponse *</label>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Rédigez votre réponse..."
              rows={4} className="input-field resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Envoi...' : <><Send size={14} /> Envoyer</>}
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function MessagingPage() {
  const { user } = useAuth()
  const isAdmin   = user?.typeAdmin !== undefined
  const isParent  = user?.typePersonne === 4
  const isTeacher = user?.typePersonne === 1

  const [messages,      setMessages]      = useState([])
  const [unread,        setUnread]        = useState(0)
  const [parents,       setParents]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [replyTo,       setReplyTo]       = useState(null)
  const [replyToTeacher,setReplyToTeacher]= useState(null)
  const [filterVal,     setFilterVal]     = useState('')
  const [search,        setSearch]        = useState('')
  const [tab,           setTab]           = useState(isAdmin ? 'all' : 'inbox')
  const [activeSegment, setActiveSegment] = useState('parents') // 'parents' or 'teachers' (only for Admin)
  const intervalRef = useRef(null)

  // ── Fetch messages ─────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    setLoading(true)
    try {
      let data
      if (isAdmin) {
        if (activeSegment === 'parents') {
          const res = await getMessagesParents()
          data = res.data.data || []
          if (filterVal === '0') {
            data = data.filter(m => !m.reponse)
          }
        } else {
          const res = await getInternalMessages()
          data = res.data.data || []
        }
      } else if (isParent) {
        const res = await getMessages({ idParent: user?.idParent })
        data = res.data.messages || res.data.data || []
      } else if (isTeacher) {
        const res = await getMessagesRecus({ idPers: user?.idPers })
        data = res.data.messages || res.data.data || []
      } else {
        const res = await getMessagesRecents({ limit: 20 })
        data = res.data.messages || res.data.data || []
      }
      setMessages(data)
    } catch { toast.error('Erreur chargement messages.') }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSegment, filterVal])

  // Compteur non lus (parents)
  const fetchUnread = useCallback(async () => {
    if (!isParent) return
    try {
      const { data } = await getUnreadCount({ idParent: user?.idParent })
      setUnread(data.count || 0)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchMessages()
    fetchUnread()
    intervalRef.current = setInterval(() => {
      fetchMessages()
      fetchUnread()
    }, 30000)
    return () => clearInterval(intervalRef.current)
  }, [filterVal, tab, activeSegment, fetchMessages, fetchUnread])

  // Charger les parents pour le formulaire admin
  useEffect(() => {
    if (isAdmin) {
      getParents({}).then(({ data }) => setParents(data.parents || data.data || []))
        .catch(() => {})
    }
  }, [isAdmin])

  // ── Actions Parent ─────────────────────────────────────────────
  const handleValider = async (id) => {
    try {
      await validerMessage(id)
      toast.success('Message validé !')
      fetchMessages()
    } catch { toast.error('Erreur validation.') }
  }

  const handleLire = async (id) => {
    try {
      await lireMessage(id)
      fetchUnread()
      setMessages(msgs => msgs.map(m =>
        m.idMessages === id ? { ...m, valider: 1 } : m
      ))
    } catch {}
  }

  // ── Actions Enseignant ─────────────────────────────────────────
  const handleMarkTeacherAsLu = async (id) => {
    try {
      await markInternalAsLu(id)
      toast.success('Remarque marquée comme lue.')
      fetchMessages()
    } catch { toast.error('Erreur.') }
  }

  const handleDeleteTeacherMsg = async (id) => {
    if (!window.confirm('Supprimer définitivement ce message de l\'enseignant ?')) return
    try {
      await deleteInternalMessage(id)
      toast.success('Message supprimé !')
      fetchMessages()
    } catch { toast.error('Erreur lors de la suppression.') }
  }

  // ── Filtrage local ────────────────────────────────────────────
  const msgFiltres = search
    ? messages.filter(m => {
        const obj = (m.objet || '').toLowerCase()
        const info = (m.information || m.contenu || '').toLowerCase()
        const q = search.toLowerCase()
        return obj.includes(q) || info.includes(q)
      })
    : messages

  const TABS_ADMIN = [
    { key: 'all',     label: 'Tous',       icon: Inbox },
    { key: 'attente', label: 'En attente', icon: Bell  },
  ]

  return (
    <div className="page-container">

      {/* ── En-tête ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Messagerie
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {unread > 0
              ? <span className="text-primary-600 font-medium">{unread} message{unread > 1 ? 's' : ''} non lu{unread > 1 ? 's' : ''}</span>
              : `${messages.length} message(s)`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchMessages} className="btn-icon" title="Actualiser">
            <RefreshCw size={16} />
          </button>
          {(isAdmin || isTeacher) && (
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={16} /> Nouveau message
            </button>
          )}
        </div>
      </div>

      {/* ── Segments de messagerie Admin (Parents vs Enseignants) ── */}
      {isAdmin && (
        <div className="flex gap-2 mb-6 border-b border-gray-100 pb-4">
          <button
            onClick={() => { setActiveSegment('parents'); setFilterVal('') }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${activeSegment === 'parents'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-100'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Users size={16} />
            Messages Parents (Destinataires)
          </button>
          <button
            onClick={() => { setActiveSegment('teachers'); setFilterVal('') }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${activeSegment === 'teachers'
                ? 'bg-primary-500 text-white shadow-md shadow-primary-100'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <GraduationCap size={16} />
            Messages Enseignants (Reçus)
          </button>
        </div>
      )}

      {/* ── Onglets admin pour les Parents ────────────────────── */}
      {isAdmin && activeSegment === 'parents' && (
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
          {TABS_ADMIN.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => {
                  setTab(t.key)
                  setFilterVal(t.key === 'attente' ? '0' : '')
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                  font-medium transition-all ${tab === t.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'}`}>
                <Icon size={14} />
                {t.label}
                {t.key === 'attente' && messages.filter(m => m.reponse == null && m.destType === 'admin').length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs
                    flex items-center justify-center font-bold">
                    {messages.filter(m => m.reponse == null && m.destType === 'admin').length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* ── Barre de recherche ────────────────────────────────── */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Rechercher dans les messages..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input-field pl-9" />
      </div>

      {/* ── Liste messages ───────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 flex items-start gap-3">
              <div className="skeleton w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-1/3 rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : msgFiltres.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center card">
          <MessageSquare size={36} className="text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">
            {search ? 'Aucun message ne correspond à votre recherche.' : 'Aucun message pour l\'instant.'}
          </p>
          {!search && (isAdmin || isTeacher) && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
              <Plus size={15} /> Écrire un message
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {msgFiltres.map(msg => (
            activeSegment === 'teachers' && isAdmin ? (
              <TeacherMessageBubble
                key={msg.idMessage}
                msg={msg}
                onLu={handleMarkTeacherAsLu}
                onReply={setReplyToTeacher}
                onDelete={handleDeleteTeacherMsg}
              />
            ) : isAdmin && activeSegment === 'parents' ? (
              <ParentMessageBubble
                key={msg.idMsg}
                msg={msg}
                onLu={async (id) => { await markMessageParentLu(id); fetchMessages(); }}
                onReply={setReplyTo}
              />
            ) : (
              <MessageBubble
                key={msg.idMessages}
                msg={msg}
                isAdmin={isAdmin}
                onValider={handleValider}
                onLire={handleLire}
                onReply={isAdmin || isTeacher ? setReplyTo : null}
              />
            )
          ))}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────── */}
      {showForm && (
        <NouveauMessageForm
          parents={parents}
          isAdmin={isAdmin}
          isTeacher={isTeacher}
          onSuccess={() => { setShowForm(false); fetchMessages() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {replyTo && (
        isAdmin && activeSegment === 'parents' ? (
          <ReplyParentForm
            original={replyTo}
            onSuccess={() => { setReplyTo(null); fetchMessages() }}
            onCancel={() => setReplyTo(null)}
          />
        ) : (
          <ReplyForm
            original={replyTo}
            onSuccess={() => { setReplyTo(null); fetchMessages() }}
            onCancel={() => setReplyTo(null)}
          />
        )
      )}

      {replyToTeacher && (
        <ReplyInternalForm
          original={replyToTeacher}
          onSuccess={() => { setReplyToTeacher(null); fetchMessages() }}
          onCancel={() => setReplyToTeacher(null)}
        />
      )}
    </div>
  )
}