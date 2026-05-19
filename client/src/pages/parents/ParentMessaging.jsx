import { useState, useEffect } from 'react'
import {
  Mail, Send, Search, Plus, X, MessageSquare,
  User, Shield, Calendar, RefreshCw, CheckCheck, Check
} from 'lucide-react'
import { getMessagesParents, createMessageParent, repondreMessageParent, markMessageParentLu } from '../../services/messageParentService'
import { getTeachers } from '../../services/teacherService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
}) : ''

export default function ParentMessaging() {
  const { user } = useAuth()

  const [messages, setMessages] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMsg, setSelectedMsg] = useState(null)
  
  // Nouveau message
  const [showNewModal, setShowNewModal] = useState(false)
  const [newForm, setNewForm] = useState({
    destType: 'admin',
    idDest: '',
    objet: '',
    contenu: ''
  })

  // Réponse
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [msgRes, teachersRes] = await Promise.all([
        getMessagesParents(),
        getTeachers({ actif: 1 })
      ])
      const msgList = msgRes.data.data || []
      setMessages(msgList)
      setTeachers(teachersRes.data.data || teachersRes.data.enseignants || [])
      
      if (msgList.length > 0) {
        setSelectedMsg(msgList[0])
      }
    } catch {
      toast.error('Erreur lors du chargement des messages.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectMsg = async (msg) => {
    setSelectedMsg(msg)
    if (!msg.lu && msg.idExp !== user.id) {
      try {
        await markMessageParentLu(msg.idMsg)
        setMessages(prev => prev.map(m => m.idMsg === msg.idMsg ? { ...m, lu: 1 } : m))
      } catch {}
    }
  }

  const handleSendNew = async (e) => {
    e.preventDefault()
    if (!newForm.objet || !newForm.contenu) {
      return toast.error('L\'objet et le contenu sont obligatoires.')
    }

    try {
      const payload = {
        destType: newForm.destType,
        objet: newForm.objet,
        contenu: newForm.contenu,
        idDest: newForm.destType === 'teacher' ? parseInt(newForm.idDest) : null
      }

      const { data } = await createMessageParent(payload)
      toast.success('Message envoyé avec succès !')
      setShowNewModal(false)
      
      // Actualiser
      const msgRes = await getMessagesParents()
      const newList = msgRes.data.data || []
      setMessages(newList)
      
      // Sélectionner le nouveau message
      const sentMsg = newList.find(m => m.idMsg === data.data.idMsg) || newList[0]
      if (sentMsg) setSelectedMsg(sentMsg)

      setNewForm({
        destType: 'admin',
        idDest: '',
        objet: '',
        contenu: ''
      })
    } catch (err) {
      toast.error(err.message || 'Erreur d\'envoi.')
    }
  }

  const handleReplySubmit = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setSendingReply(true)
    try {
      await repondreMessageParent(selectedMsg.idMsg, replyText)
      toast.success('Réponse envoyée !')
      setReplyText('')
      
      // Recharger
      const msgRes = await getMessagesParents()
      const newList = msgRes.data.data || []
      setMessages(newList)
      
      const updated = newList.find(m => m.idMsg === selectedMsg.idMsg)
      if (updated) setSelectedMsg(updated)
    } catch {
      toast.error('Erreur lors de l\'envoi du message.')
    } finally {
      setSendingReply(false)
    }
  }

  return (
    <div className="page-container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200">
            <Mail className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Syne, sans-serif'}}>
              Messagerie Parents
            </h1>
            <p className="text-gray-500 text-sm">Discutez directement avec les enseignants ou l'administration.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={loadData} className="btn-icon bg-white border border-gray-100 hover:bg-gray-50">
            <RefreshCw size={16} />
          </button>
          <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-1.5 shadow-lg shadow-primary-200">
            <Plus size={16} /> Nouveau message
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="animate-spin text-primary-500" size={32} />
        </div>
      ) : messages.length === 0 ? (
        <div className="card py-16 text-center bg-white border border-gray-100">
          <MessageSquare size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Aucun message pour le moment.</p>
          <p className="text-gray-400 text-xs mt-1">Commencez une discussion en cliquant sur "Nouveau message".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
          {/* Discussion List */}
          <div className="lg:col-span-4 bg-white border border-gray-100 rounded-3xl p-4 flex flex-col h-full overflow-hidden shadow-sm">
            <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-3 px-1">Discussions</h3>
            
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {messages.map(m => {
                const isActive = selectedMsg?.idMsg === m.idMsg
                const isDestAdmin = m.destType === 'admin'
                
                return (
                  <button
                    key={m.idMsg}
                    onClick={() => handleSelectMsg(m)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex flex-col gap-1 ${
                      isActive
                        ? 'bg-primary-50/50 border-primary-100'
                        : 'bg-white border-gray-50 hover:bg-gray-50/30'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-bold text-gray-400">
                        {isDestAdmin ? 'Direction' : m.dest_nom || 'Enseignant'}
                      </span>
                      <span className="text-[10px] text-gray-400">{fmtDate(m.created_at)}</span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-800 line-clamp-1">
                      {m.objet}
                    </h4>

                    <p className="text-xs text-gray-400 line-clamp-1">
                      {m.contenu}
                    </p>

                    <div className="flex justify-between items-center mt-1">
                      <span className={`badge text-[9px] font-bold ${
                        isDestAdmin ? 'bg-indigo-50 text-indigo-700' : 'bg-teal-50 text-teal-700'
                      }`}>
                        {isDestAdmin ? 'Admin' : 'Prof'}
                      </span>

                      {!m.lu ? (
                        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                      ) : (
                        <CheckCheck size={12} className="text-gray-300" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conversation Area */}
          <div className="lg:col-span-8 bg-white border border-gray-100 rounded-3xl flex flex-col h-full overflow-hidden shadow-sm">
            {selectedMsg ? (
              <div className="flex flex-col h-full justify-between">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      selectedMsg.destType === 'admin'
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'bg-teal-50 text-teal-600'
                    }`}>
                      {selectedMsg.destType === 'admin' ? <Shield size={18} /> : <User size={18} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">{selectedMsg.objet}</h3>
                      <p className="text-xs text-gray-400">
                        Destinataire : <span className="font-bold">{selectedMsg.destType === 'admin' ? 'Administration' : selectedMsg.dest_nom || 'Enseignant'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/30">
                  {/* Parent First Message */}
                  <div className="flex flex-col items-end space-y-1 max-w-[80%] ml-auto">
                    <div className="bg-primary-500 text-white rounded-2xl rounded-tr-none px-4 py-3 text-sm shadow-sm">
                      <p className="font-semibold text-[10px] text-primary-100 mb-1">Moi (Parent)</p>
                      <p className="whitespace-pre-line">{selectedMsg.contenu}</p>
                    </div>
                    <span className="text-[10px] text-gray-400">{fmtDate(selectedMsg.created_at)}</span>
                  </div>

                  {/* Reply if present */}
                  {selectedMsg.reponse && (
                    <div className="flex flex-col items-start space-y-1 max-w-[80%]">
                      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm">
                        <p className="font-semibold text-[10px] text-teal-600 mb-1">
                          {selectedMsg.destType === 'admin' ? 'Administration (Réponse)' : `${selectedMsg.dest_nom} (Réponse)`}
                        </p>
                        <p className="whitespace-pre-line text-gray-800">{selectedMsg.reponse}</p>
                      </div>
                      <span className="text-[10px] text-gray-400">{fmtDate(selectedMsg.repondu_at)}</span>
                    </div>
                  )}
                </div>

                {/* Reply Box */}
                {!selectedMsg.reponse ? (
                  <form onSubmit={handleReplySubmit} className="p-4 border-t border-gray-50 flex gap-3 bg-white">
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="La réponse à votre message apparaîtra ici. Si vous voulez relancer la discussion..."
                      className="input-field flex-1"
                      disabled
                    />
                    <button
                      type="submit"
                      disabled
                      className="p-3 bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                ) : (
                  <div className="p-4 border-t border-gray-50 bg-gray-50/50 text-center text-xs text-gray-400">
                    Discussion close. Vous pouvez recréer un nouveau message si nécessaire.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <Mail size={40} />
                <p className="mt-2 text-sm">Sélectionnez une discussion</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Discussion Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-gray-900 text-lg">Nouveau message</h3>
              <button onClick={() => setShowNewModal(false)} className="btn-icon"><X size={16} /></button>
            </div>

            <form onSubmit={handleSendNew} className="space-y-4">
              <div>
                <label className="form-label font-semibold mb-1 block">Destinataire *</label>
                <select
                  value={newForm.destType}
                  onChange={e => setNewForm(f => ({ ...f, destType: e.target.value, idDest: e.target.value === 'teacher' ? (teachers[0]?.idPers?.toString() || '') : '' }))}
                  className="select-field w-full"
                >
                  <option value="admin">Administration / Direction</option>
                  <option value="teacher">Un Enseignant</option>
                </select>
              </div>

              {newForm.destType === 'teacher' && (
                <div>
                  <label className="form-label font-semibold mb-1 block">Sélectionner l'enseignant *</label>
                  <select
                    value={newForm.idDest}
                    onChange={e => setNewForm(f => ({ ...f, idDest: e.target.value }))}
                    className="select-field w-full"
                    required
                  >
                    {teachers.map(t => (
                      <option key={t.idPers} value={t.idPers}>
                        {t.prenom} {t.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="form-label font-semibold mb-1 block">Objet *</label>
                <input
                  value={newForm.objet}
                  onChange={e => setNewForm(f => ({ ...f, objet: e.target.value }))}
                  placeholder="Ex: Demande de rendez-vous / Suivi devoirs"
                  className="input-field w-full"
                  required
                />
              </div>

              <div>
                <label className="form-label font-semibold mb-1 block">Votre Message *</label>
                <textarea
                  value={newForm.contenu}
                  onChange={e => setNewForm(f => ({ ...f, contenu: e.target.value }))}
                  placeholder="Écrivez votre message en détail..."
                  rows={5}
                  className="input-field w-full resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  Envoyer le message
                </button>
                <button type="button" onClick={() => setShowNewModal(false)} className="btn-secondary">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
