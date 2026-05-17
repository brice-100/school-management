import { useState, useEffect } from 'react'
import { Wallet, Clock, CheckCircle, AlertCircle, TrendingUp, ArrowDownCircle, RefreshCw } from 'lucide-react'
import { getSalaireHistorique, getSalaireStatut, demanderDecaissement } from '../../services/salaryService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'

const STATUT_CONFIG = {
  disponible: { label:'Disponible', cls:'bg-emerald-50 text-emerald-700 border-emerald-200', icon:CheckCircle, iconCls:'text-emerald-500', desc:"Votre salaire est disponible. Vous pouvez faire une demande de décaissement." },
  'en attente': { label:'En attente', cls:'bg-amber-50 text-amber-700 border-amber-200',       icon:Clock,        iconCls:'text-amber-500',   desc:"Votre demande est en cours de traitement par l'administration." },
  'payé':      { label:'Versé',      cls:'bg-blue-50 text-blue-700 border-blue-200',           icon:Wallet,       iconCls:'text-blue-500',    desc:"Votre salaire a été versé ce mois-ci." },
}

const STATUT_ROW = {
  'payé':      { label:'Versé',      cls:'bg-blue-50 text-blue-700'     },
  disponible: { label:'Disponible', cls:'bg-emerald-50 text-emerald-700'},
  'en attente': { label:'En attente', cls:'bg-amber-50 text-amber-700'   },
}

export default function SalaryTeacherPage() {
  const { user }  = useAuth()
  const [historique, setHistorique] = useState([])
  const [statut,     setStatut]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [loadStat,   setLoadStat]   = useState(true)
  const [requesting, setRequesting] = useState(false)

  const fetchHistorique = async () => {
    setLoading(true)
    try {
      const { data } = await getSalaireHistorique()
      setHistorique(data.salaires || data.data || [])
    } catch { toast.error('Erreur chargement historique.') }
    finally { setLoading(false) }
  }

  const fetchStatut = async () => {
    setLoadStat(true)
    try {
      const { data } = await getSalaireStatut()
      setStatut(data.salaire || data)
    } catch { toast.error('Erreur chargement statut.') }
    finally { setLoadStat(false) }
  }

  useEffect(() => { fetchHistorique(); fetchStatut() }, [])

  const handleDecaissement = async () => {
    if (!window.confirm('Confirmer la demande de décaissement ?')) return
    setRequesting(true)
    try {
      await demanderDecaissement({ idEnseignant: user?.idEnseignant || user?.idPers })
      toast.success('Demande envoyée ! En attente de validation.')
      fetchStatut()
    } catch (err) { toast.error(err.message || 'Erreur.') }
    finally { setRequesting(false) }
  }

  const totalVerse  = historique.filter(s => s.statut === 'payé').reduce((a, s) => a + parseFloat(s.points || 0), 0)
  const dernierVerse= historique.find(s => s.statut === 'payé')

  // ── Carte statut ────────────────────────────────────────────
  const StatutCard = () => {
    if (loadStat) return (
      <div className="card p-6 mb-6">
        <div className="flex gap-4">
          <div className="skeleton w-12 h-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-8 w-40 rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        </div>
      </div>
    )

    if (!statut) return (
      <div className="card p-5 mb-6 border-l-4 border-gray-200">
        <div className="flex items-center gap-3">
          <AlertCircle size={18} className="text-gray-400 shrink-0" />
          <p className="text-gray-500 text-sm">Aucune fiche de salaire pour ce mois. Contactez l'administration.</p>
        </div>
      </div>
    )

    const cfg  = STATUT_CONFIG[statut.statut] ?? STATUT_CONFIG['en attente']
    const Icon = cfg.icon
    const borderCls = cfg.cls.split(' ').find(c => c.startsWith('border')) || 'border-gray-200'

    return (
      <div className={`card p-6 mb-6 border ${borderCls}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
            ${statut.statut === 'payé' ? 'bg-blue-100' : statut.statut === 'disponible' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <Icon size={22} className={cfg.iconCls} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-display font-semibold text-gray-900">Salaire — mois en cours</h3>
              <span className={`badge border text-xs ${cfg.cls}`}>{cfg.label}</span>
            </div>
            <p className="font-display text-3xl font-bold text-gray-900 mb-1">{fmt(statut.montant)}</p>
            <p className="text-sm text-gray-500 mb-4">{cfg.desc}</p>

            {statut.statut === 'disponible' && (
              <button onClick={handleDecaissement} disabled={requesting}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600
                  hover:bg-emerald-700 text-white text-sm font-medium rounded-xl
                  transition-colors disabled:opacity-50">
                <ArrowDownCircle size={16} />
                {requesting ? 'Envoi...' : 'Demander le décaissement'}
              </button>
            )}
            {statut.statut === 'en attente' && (
              <div className="flex items-center gap-2 text-amber-600 text-sm">
                <Clock size={15} className="animate-pulse" />
                En attente de validation par l'administration
              </div>
            )}
            {statut.statut === 'payé' && (
              <div className="flex items-center gap-2 text-blue-600 text-sm">
                <CheckCircle size={15} /> Salaire versé avec succès
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Mes salaires</h1>
          <p className="text-gray-500 text-sm mt-0.5">Suivi de vos rémunérations</p>
        </div>
        <button onClick={() => { fetchHistorique(); fetchStatut() }} className="btn-icon">
          <RefreshCw size={16} />
        </button>
      </div>

      <StatutCard />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label:'Total perçu',        value: fmt(totalVerse), color:'text-emerald-600' },
          { label:'Fiches enregistrées',value: historique.length },
          { label:'Dernier versement',  value: dernierVerse ? fmt(dernierVerse.points) : '—',
            sub: dernierVerse ? new Date(dernierVerse.event_date).toLocaleDateString('fr-FR') : '', color:'text-blue-600' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="card p-4">
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className={`font-display text-xl font-bold ${color ?? 'text-gray-900'}`}>{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Historique */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">Historique</h2>
        <span className="text-xs text-gray-400">{historique.length} fiche(s)</span>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/5 rounded" />
                </div>
                <div className="skeleton h-6 w-24 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        ) : historique.length === 0 ? (
          <div className="py-14 text-center">
            <TrendingUp size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune fiche enregistrée.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Libellé','Montant','Date','Statut','Commentaire'].map(h => (
                  <th key={h} className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {historique.map(s => {
                const st = STATUT_ROW[s.statut] ?? STATUT_ROW['en attente']
                return (
                  <tr key={s.idRap} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                          ${s.statut==='payé'?'bg-blue-50':s.statut==='disponible'?'bg-emerald-50':'bg-amber-50'}`}>
                          <Wallet size={15} className={s.statut==='payé'?'text-blue-500':s.statut==='disponible'?'text-emerald-500':'text-amber-500'} />
                        </div>
                        <p className="font-medium text-gray-900">{s.libelle}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">{fmt(s.points)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {s.event_date ? new Date(s.event_date).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs max-w-xs truncate">
                      {s.commentaire || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}