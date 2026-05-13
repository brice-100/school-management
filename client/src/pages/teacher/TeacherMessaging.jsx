import { useState, useEffect } from 'react'
import { Send, MessageSquare, User, AlertCircle, CheckCircle, Clock, Trash2, Reply } from 'lucide-react'
import { getInternalMessages, sendInternalMessage, deleteInternalMessage } from '../../services/messageService'
import { getTeacherStudents } from '../../services/teacherService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function TeacherMessaging() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    objet: '',
    contenu: '',
    type_sujet: 'autre',
    matricule_eleve: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [msgRes, studentRes] = await Promise.all([
        getInternalMessages(),
        getTeacherStudents(user.id)
      ])
      setMessages(msgRes.data.data || [])
      setStudents(studentRes.data.data || [])
    } catch (err) {
      toast.error('Erreur lors du chargement des données.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.objet || !formData.contenu) return toast.error('Veuillez remplir tous les champs obligatoires.')

    try {
      await sendInternalMessage(formData)
      toast.success('Message envoyé à l\'administration.')
      setFormData({ objet: '', contenu: '', type_sujet: 'autre', matricule_eleve: '' })
      setShowForm(false)
      loadData()
    } catch (err) {
      toast.error('Erreur lors de l\'envoi.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce message ?')) return
    try {
      await deleteInternalMessage(id)
      toast.success('Message supprimé.')
      loadData()
    } catch (err) {
      toast.error('Erreur lors de la suppression.')
    }
  }

  const getStatusIcon = (msg) => {
    if (msg.reponse) return <CheckCircle size={16} className="text-emerald-500" />
    if (msg.lu) return <Clock size={16} className="text-blue-500" />
    return <AlertCircle size={16} className="text-amber-500" />
  }

  const getStatusText = (msg) => {
    if (msg.reponse) return 'Répondu'
    if (msg.lu) return 'Lu par l\'admin'
    return 'En attente'
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-primary-500" />
            Messagerie Administration
          </h1>
          <p className="text-gray-500 text-sm">Communiquez avec la direction pour des remarques ou la discipline.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-md shadow-primary-100"
        >
          <Send size={18} />
          {showForm ? 'Annuler' : 'Nouveau message'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objet *</label>
                <input
                  type="text"
                  value={formData.objet}
                  onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="Ex: Problème de discipline en 3ème A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de sujet</label>
                <select
                  value={formData.type_sujet}
                  onChange={(e) => setFormData({ ...formData, type_sujet: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                >
                  <option value="autre">Autre</option>
                  <option value="eleve">Remarque sur un élève</option>
                  <option value="discipline">Discipline</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Élève concerné (optionnel)</label>
              <select
                value={formData.matricule_eleve}
                onChange={(e) => setFormData({ ...formData, matricule_eleve: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              >
                <option value="">-- Aucun --</option>
                {students.map(s => (
                  <option key={s.matricule} value={s.matricule}>
                    {s.prenom} {s.nom} ({s.classe_nom})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={formData.contenu}
                onChange={(e) => setFormData({ ...formData, contenu: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                placeholder="Décrivez votre remarque ou situation..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 font-medium"
              >
                Envoyer le message
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="text-gray-300" />
            </div>
            <p className="text-gray-400">Aucun message envoyé pour le moment.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.idMessage} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-primary-200 transition-all">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center text-primary-600">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{msg.objet}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="bg-gray-100 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">{msg.type_sujet}</span>
                        <span>•</span>
                        <span>{new Date(msg.created_at).toLocaleDateString()} à {new Date(msg.created_at).toLocaleTimeString([], { hour: '2h', minute: '2h' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                      {getStatusIcon(msg)}
                      <span className="text-xs font-medium text-gray-600">{getStatusText(msg)}</span>
                    </div>
                    <button 
                      onClick={() => handleDelete(msg.idMessage)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {msg.eleve_nom && (
                  <div className="mb-3 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs rounded-lg inline-flex items-center gap-2">
                    <User size={12} />
                    Élève : <span className="font-bold">{msg.eleve_prenom} {msg.eleve_nom}</span>
                  </div>
                )}

                <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.contenu}
                </p>

                {msg.reponse && (
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                        <Reply size={16} className="rotate-180" />
                      </div>
                      <div className="flex-1 bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-emerald-700">Réponse de l'administration</span>
                          <span className="text-[10px] text-emerald-600">{new Date(msg.repondu_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-emerald-800 italic">"{msg.reponse}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
