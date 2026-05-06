import { useState, useEffect } from 'react'
import { 
  X, Eye, CreditCard, TrendingUp, User, RefreshCw, BookOpen, Calendar
} from 'lucide-react'
import { getTeacher } from '../services/teacherService'
import toast from 'react-hot-toast'

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'

export default function EnseignantFicheModal({ idEnseignant, onClose }) {
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('infos') // 'infos', 'cours', 'salaires'

  useEffect(() => {
    getTeacher(idEnseignant)
      .then(({ data }) => setTeacher(data.data || data))
      .catch(() => toast.error('Erreur chargement fiche enseignant.'))
      .finally(() => setLoading(false))
  }, [idEnseignant])

  if (loading) return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-12 text-center">
        <RefreshCw size={30} className="text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Chargement de la fiche individuelle...</p>
      </div>
    </div>
  )

  const t = teacher || {}
  const BASE = import.meta.env.VITE_API_URL.replace('/api', '')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-blue-100 flex items-center justify-center overflow-hidden">
              {t.photo ? (
                <img src={`${BASE}/${t.photo}`} alt="" className="w-full h-full object-cover" />
              ) : <User size={24} className="text-blue-200" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-900 text-lg uppercase">{t.prenom} {t.nom}</h3>
              <p className="text-xs text-blue-600 font-medium">ID : {t.alanyaID || t.idEnseignant} • Spécialité : {t.matiere_nom || 'Généraliste'}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon bg-white shadow-sm"><X size={18} /></button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white overflow-x-auto scrollbar-hide">
          {[
            { id: 'infos',    label: 'Profil',    icon: Eye },
            { id: 'cours',    label: 'Affectations', icon: BookOpen },
            { id: 'salaires', label: 'Rémunération', icon: CreditCard },
          ].map(tabItem => (
            <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
              className={`flex items-center gap-2 px-5 py-4 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${
                tab === tabItem.id ? 'border-blue-500 text-blue-600 bg-blue-50/10' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <tabItem.icon size={16} />
              {tabItem.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {tab === 'infos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-5 bg-white">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Identité</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Né(e) le</span>
                    <span className="font-medium text-gray-900">{t.dateNaissance ? new Date(t.dateNaissance).toLocaleDateString('fr-FR') : '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Lieu</span>
                    <span className="font-medium text-gray-900">{t.lieuNaissance || 'INDEFINI'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Compte</span>
                    <span className="font-medium text-blue-600">{t.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Depuis le</span>
                    <span className="font-medium text-gray-900">{new Date(t.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
              <div className="card p-5 bg-white">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Contact</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Mobile</span>
                    <span className="font-medium text-gray-900">{t.mobile || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">WhatsApp</span>
                    <span className="font-medium text-gray-900">{t.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut</span>
                    <span className={`badge ${t.actif ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {t.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'cours' && (
            <div className="space-y-4">
              <div className="card p-4 bg-white border-l-4 border-purple-400">
                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Classe Titulaire (Direction)</p>
                <p className="text-lg font-semibold text-gray-900">{t.classe_nom || 'Non assigné'}</p>
              </div>
              <div className="card p-4 bg-white border-l-4 border-blue-400">
                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Cours assignés</p>
                <p className="text-sm font-medium text-gray-900 leading-relaxed">
                  {t.matiere_nom || 'Aucun cours assigné'}
                </p>
              </div>
              <div className="card p-4 bg-white border-l-4 border-amber-400">
                <p className="text-xs text-gray-400 uppercase font-bold mb-2">Matière Principale</p>
                <p className="text-lg font-semibold text-gray-900">{t.matiere_nom || 'Non assigné'}</p>
              </div>
              <p className="text-[10px] text-gray-400 italic text-center mt-6">
                Les classes d'intervention sont déduites des cours assignés à cet enseignant.
              </p>
            </div>
          )}

          {tab === 'salaires' && (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">L'historique des salaires sera disponible ici prochainement.</p>
              <p className="text-[10px] text-gray-400 mt-2 italic">Consultez la section "Salaires" pour les paiements en cours.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white text-center">
          <p className="text-[10px] text-gray-400 italic">Dossier Enseignant généré le {new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>
    </div>
  )
}
