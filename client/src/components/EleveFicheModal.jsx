import { useState, useEffect } from 'react'
import { 
  X, Eye, CreditCard, TrendingUp, AlertCircle, RefreshCw, Search, Download 
} from 'lucide-react'
import { getFicheEleve } from '../services/paymentService'
import toast from 'react-hot-toast'

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'

export default function EleveFicheModal({ matricule, onClose }) {
  const [fiche, setFiche] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('infos') // 'infos', 'paiements', 'notes', 'discipline'

  useEffect(() => {
    getFicheEleve(matricule)
      .then(({ data }) => setFiche(data.data || data))
      .catch(() => toast.error('Erreur chargement fiche élève.'))
      .finally(() => setLoading(false))
  }, [matricule])

  if (loading) return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-12 text-center">
        <RefreshCw size={30} className="text-primary-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Génération du dossier complet...</p>
      </div>
    </div>
  )

  const s = fiche?.student || {}
  const p = fiche?.parents?.[0] || {}

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary-50/30">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-primary-100 flex items-center justify-center overflow-hidden">
              {s.photoURL && s.photoURL !== 'INDEFINI' ? (
                <img src={`${import.meta.env.VITE_API_URL.replace('/api', '')}${s.photoURL}`} alt="" className="w-full h-full object-cover" />
              ) : <Search size={24} className="text-primary-200" />}
            </div>
            <div>
              <h3 className="font-display font-bold text-gray-900 text-lg uppercase">{s.nom} {s.prenom}</h3>
              <p className="text-xs text-primary-600 font-medium">Matricule : {matricule} • Classe : {s.classe_nom || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon bg-white shadow-sm"><X size={18} /></button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-gray-100 px-6 bg-white overflow-x-auto scrollbar-hide">
          {[
            { id: 'infos',      label: 'Informations', icon: Eye },
            { id: 'paiements',  label: 'Paiements',    icon: CreditCard },
            { id: 'notes',      label: 'Notes',        icon: TrendingUp },
            { id: 'discipline', label: 'Discipline',   icon: AlertCircle },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-4 border-b-2 transition-all whitespace-nowrap text-sm font-medium ${
                tab === t.id ? 'border-primary-500 text-primary-600 bg-primary-50/10' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          {tab === 'infos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card p-5 bg-white">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Élève</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Né(e) le</span>
                    <span className="font-medium text-gray-900">{s.dateNaissance ? new Date(s.dateNaissance).toLocaleDateString('fr-FR') : '—'} à {s.ville_nom || s.lieuNaissance}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Sexe</span>
                    <span className="font-medium text-gray-900">{s.sexe === 1 ? 'Garçon' : 'Fille'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Langue</span>
                    <span className="font-medium text-gray-900">{s.langue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Statut compte</span>
                    <span className={`badge ${s.actif ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {s.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="card p-5 bg-white">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Parent</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Nom complet</span>
                    <span className="font-medium text-gray-900">{p.prenom} {p.nom || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Mobile</span>
                    <span className="font-medium text-gray-900">{p.mobile || '—'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Fixe</span>
                    <span className="font-medium text-gray-900">{p.phone || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email/ID</span>
                    <span className="font-medium text-primary-600">{p.username || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'paiements' && (
            <div className="space-y-3">
              {fiche.paiements?.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic text-sm">Aucun historique de paiement.</div>
              ) : fiche.paiements?.map(pa => (
                <div key={pa.idPaie} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:shadow-sm transition-shadow">
                  <div>
                    <p className="font-bold text-gray-900">{fmt(pa.montant)}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-medium">
                      {pa.mode_nom} {pa.tranche_nom ? `• ${pa.tranche_nom}` : ''} • {new Date(pa.datePaie).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`badge border ${pa.valide ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                    {pa.valide ? 'Validé' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {tab === 'notes' && (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3 text-left">Matière / Épreuve</th>
                    <th className="px-5 py-3 text-center">Note</th>
                    <th className="px-5 py-3 text-left">Appréciation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {fiche.evaluations?.length === 0 ? (
                    <tr><td colSpan="3" className="py-10 text-center text-gray-400 italic">Aucune note enregistrée.</td></tr>
                  ) : fiche.evaluations?.map(ev => (
                    <tr key={ev.idEval}>
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{ev.cours_nom}</p>
                        <p className="text-[10px] text-gray-500">{ev.epreuve_nom} ({ev.session_nom})</p>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`font-bold text-base ${ev.note >= 10 ? 'text-emerald-600' : 'text-red-500'}`}>{ev.note}</span>
                        <span className="text-gray-400 text-xs">/20</span>
                      </td>
                      <td className="px-5 py-3 text-gray-600 italic">"{ev.appreciation || '—'}"</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'discipline' && (
            <div className="space-y-3">
              {fiche.discipline?.length === 0 ? (
                <div className="text-center py-10 text-gray-400 italic text-sm">Aucun rapport de discipline.</div>
              ) : fiche.discipline?.map(r => (
                <div key={r.idRap} className="bg-white p-4 rounded-xl border-l-4 border-red-400 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-bold text-gray-900">{r.libelle}</p>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">-{r.points} pts</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 italic">"{r.commentaire}"</p>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">Par {r.auteur_prenom} {r.auteur_nom} • {new Date(r.event_date).toLocaleDateString('fr-FR')}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white text-center">
          <p className="text-[10px] text-gray-400 italic">Dossier généré le {new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>
    </div>
  )
}
