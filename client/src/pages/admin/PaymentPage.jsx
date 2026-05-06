import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, X, CheckCircle, Clock, CreditCard,
  Eye, RefreshCw, AlertCircle,
  TrendingUp, Wallet, ArrowUpRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  getPaiements,
  getPaiementsRecents,
  getPaiementsParent,
  getPaiementSummary,
  getPaiement,
  createPaiement,
  initierPaiement,
  validerPaiement,
  getModesPaiement,
  getAnneesAcademiques,
  getTranches,
} from '../../services/paymentService'
import { getStudents, toggleActif } from '../../services/studentService'

import { filterDeleted } from '../../services/deleteConfig'
import { useAuth } from '../../context/AuthContext'
import { useYear } from '../../context/YearContext'
import toast from 'react-hot-toast'
import EleveFicheModal from '../../components/EleveFicheModal'

// ── Helpers ───────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'

const STATUT_STYLE = {
  1: { label: 'Validé',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  0: { label: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200'     },
}

// ── Carte statistique ─────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      {loading
        ? <div className="skeleton h-7 w-28 rounded mb-1" />
        : <p className="font-display text-2xl font-bold text-gray-900">{value}</p>
      }
      <p className="text-gray-500 text-sm mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Modal détail paiement ─────────────────────────────────────────
function PaiementDetailModal({ idPaie, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPaiement(idPaie)
      .then(({ data }) => setDetail(data.data ?? data))
      .catch(() => toast.error('Erreur chargement détail.'))
      .finally(() => setLoading(false))
  }, [idPaie])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-gray-900">Détail du paiement</h3>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-4 rounded w-full" />
            ))}
          </div>
        ) : !detail ? (
          <p className="text-gray-400 text-sm text-center py-6">Aucun détail trouvé.</p>
        ) : (
          <div className="space-y-3 text-sm">
            {[
              { label: 'Matricule élève', value: detail.matricule },
              { label: 'Montant',         value: fmt(detail.montant) },
              { label: 'Mode',            value: detail.libelleMode || '—' },
              { label: 'Date paiement',   value: detail.datePaie ? new Date(detail.datePaie).toLocaleDateString('fr-FR') : '—' },
              { label: 'Opération ID',    value: detail.operation_ID || '—' },
              { label: 'Commentaire',     value: detail.comentaire || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-4 py-2 border-b border-gray-50 last:border-0">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900 text-right">{value}</span>
              </div>
            ))}
            <div className="flex justify-between gap-4 py-2">
              <span className={`badge border ${(STATUT_STYLE[detail.valide] ?? STATUT_STYLE[0]).cls}`}>
                {(STATUT_STYLE[detail.valide] ?? STATUT_STYLE[0]).label}
              </span>
            </div>
          </div>
        )}
        <button onClick={onClose} className="btn-secondary w-full mt-5">Fermer</button>
      </div>
    </div>
  )
}



// ── Formulaire nouveau paiement (admin) ───────────────────────────
function NouveauPaiementForm({ modes, annees, onSuccess, onCancel }) {
  const [students, setStudents] = useState([])
  const [tranches, setTranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    matricule: '', idAca: '', montant: '', idMode: '', idTranche: '',
    operation_ID: '', datePaie: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    getStudents({}).then(({ data }) => setStudents(filterDeleted(data.data || [])))
    getTranches().then(({ data }) => setTranches(data.data || []))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.matricule || !form.idAca || !form.montant || !form.idMode)
      return toast.error('Tous les champs marqués * sont requis.')
    setLoading(true)
    try {
      await createPaiement(form)
      toast.success('Paiement enregistré !')
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Erreur enregistrement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 mb-5 border-l-4 border-primary-400">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Enregistrer un paiement
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Élève (matricule) *</label>
          <select value={form.matricule} onChange={e => set('matricule', e.target.value)}
            className="select-field">
            <option value="">— Choisir —</option>
            {students.map(s => (
              <option key={s.matricule} value={s.matricule}>
                {s.prenom} {s.nom} — {s.matricule}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Année académique *</label>
          <select value={form.idAca} onChange={e => set('idAca', e.target.value)}
            className="select-field">
            <option value="">— Choisir —</option>
            {annees.map(a => (
              <option key={a.idAnnee} value={a.idAnnee}>{a.libelle}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Mode de paiement *</label>
          <select value={form.idMode} onChange={e => set('idMode', e.target.value)}
            className="select-field">
            <option value="">— Choisir —</option>
            {modes.map(m => (
              <option key={m.idMode} value={m.idMode}>{m.libelle}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Tranche (Optionnel)</label>
          <select value={form.idTranche} onChange={e => set('idTranche', e.target.value)}
            className="select-field">
            <option value="">— Choisir la tranche —</option>
            {tranches.map(t => (
              <option key={t.idTranche} value={t.idTranche}>{t.libelle}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Montant (FCFA) *</label>
          <input type="number" min="0" value={form.montant}
            onChange={e => set('montant', e.target.value)}
            placeholder="Ex: 75000" className="input-field" />
        </div>
        <div>
          <label className="form-label">Référence / Opération ID</label>
          <input value={form.operation_ID} onChange={e => set('operation_ID', e.target.value)}
            placeholder="Ex: TXN-2025-001" className="input-field" />
        </div>
        <div>
          <label className="form-label">Date de paiement</label>
          <input type="date" value={form.datePaie}
            onChange={e => set('datePaie', e.target.value)}
            className="input-field" />
        </div>
      </div>
      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
      </div>
    </form>
  )
}

// ── Formulaire initier paiement (parent) ──────────────────────────
function InitierPaiementForm({ modes, annees, onSuccess, onCancel }) {
  const [students, setStudents] = useState([])
  const [tranches, setTranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [instructions, setInstructions] = useState(null)
  
  const [form, setForm] = useState({ 
    matricule: '', idMode: '', idAca: '', idTranche: '', 
    type_paiement: 'cash', phone_paiement: '', montant: '' 
  })

  useEffect(() => {
    getStudents({}).then(({ data }) => setStudents(filterDeleted(data.data || [])))
    getTranches().then(({ data }) => setTranches(data.data || []))
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.matricule || !form.idMode || !form.idAca || !form.montant)
      return toast.error('Matricule, mode, année et montant sont requis.')
    
    setLoading(true)
    try {
      const res = await initierPaiement(form)
      if (res.data.instructions) {
        setInstructions(res.data.instructions)
        toast.success('Demande enregistrée ! Veuillez suivre les instructions de virement.')
      } else {
        toast.success('Demande de paiement envoyée ! L\'administrateur la validera.')
        onSuccess()
      }
    } catch (err) {
      toast.error(err.message || 'Erreur.')
    } finally {
      setLoading(false)
    }
  }

  if (instructions) {
    return (
      <div className="card p-6 mb-5 border-l-4 border-amber-500 bg-amber-50/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <RefreshCw size={20} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">Instructions de Paiement</h3>
            <p className="text-xs text-amber-700">{instructions.type}</p>
          </div>
        </div>
        
        <div className="space-y-3 mb-6 bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Bénéficiaire</span>
            <span className="font-semibold text-gray-900">{instructions.nom}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Numéro de virement</span>
            <span className="font-mono font-bold text-gray-900">{instructions.numero}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Référence à inclure</span>
            <span className="font-mono bg-amber-100 px-2 py-0.5 rounded text-amber-800 font-bold">
              {instructions.reference}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Montant</span>
            <span className="font-bold text-emerald-600">{fmt(form.montant)}</span>
          </div>
        </div>

        <p className="text-xs text-amber-800 leading-relaxed mb-5 italic">
          {instructions.message}
        </p>

        <button onClick={onSuccess} className="btn-primary w-full shadow-lg shadow-amber-200">
          J'ai effectué le virement
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 mb-5 border-l-4 border-blue-400">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 font-medium">
          Initier un paiement pour votre enfant. Les virements Mobile/Orange Money sont traités sous 24h.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Élève *</label>
          <select value={form.matricule} onChange={e => set('matricule', e.target.value)}
            className="select-field">
            <option value="">— Choisir l'enfant —</option>
            {students.map(s => (
              <option key={s.matricule} value={s.matricule}>
                {s.prenom} {s.nom} ({s.matricule})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Type de règlement *</label>
          <select value={form.type_paiement} onChange={e => set('type_paiement', e.target.value)}
            className="select-field">
            <option value="cash">Paiement Cash (Espèces)</option>
            <option value="mobile_money">MTN Mobile Money</option>
            <option value="orange_money">Orange Money</option>
          </select>
        </div>
        <div>
          <label className="form-label">Tranche (Optionnel)</label>
          <select value={form.idTranche} onChange={e => set('idTranche', e.target.value)}
            className="select-field">
            <option value="">— Choisir la tranche —</option>
            {tranches.map(t => (
              <option key={t.idTranche} value={t.idTranche}>{t.libelle}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Année académique *</label>
          <select value={form.idAca} onChange={e => set('idAca', e.target.value)}
            className="select-field">
            <option value="">— Choisir —</option>
            {annees.map(a => (
              <option key={a.idAnnee} value={a.idAnnee}>{a.libelle}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Montant à payer (FCFA) *</label>
          <input type="number" value={form.montant} onChange={e => set('montant', e.target.value)}
            placeholder="Ex: 50000" className="input-field" />
        </div>
        {form.type_paiement !== 'cash' && (
          <div>
            <label className="form-label">Votre numéro de téléphone</label>
            <input value={form.phone_paiement} onChange={e => set('phone_paiement', e.target.value)}
              placeholder="Ex: 6XXXXXXXX" className="input-field" />
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-4">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Traitement...' : 'Confirmer le paiement'}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Annuler</button>
      </div>
    </form>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function PaymentPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const { selectedYear } = useYear()
  const isAdmin   = user?.role === 'admin' || user?.typeAdmin !== undefined
  const isParent = user?.typePersonne === 4 || user?.role === 'parent'

  const [paiements,    setPaiements]    = useState([])
  const [recents,      setRecents]      = useState([])
  const [summary,      setSummary]      = useState(null)
  const [modes,        setModes]        = useState([])
  const [annees,       setAnnees]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [detailId,     setDetailId]     = useState(null)
  const [validModal,   setValidModal]   = useState(null)  // { idPaie, nom }
  const [ficheMatricule, setFicheMatricule] = useState(null)

  const [filters, setFilters] = useState({
    matricule: '', statut: '', idAca: selectedYear?.idAnnee || '',
  })
  const [search, setSearch] = useState('')

  // ── Chargement initial ────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getModesPaiement({ actif: 1 }),
      getAnneesAcademiques(),
    ]).then(([m, a]) => {
      setModes(m.data.modes || m.data.data || [])
      setAnnees(a.data.annees || a.data.data || [])
    }).catch(() => toast.error('Erreur chargement données.'))
  }, [])

  // Synchroniser idAca quand l'année change globalement
  useEffect(() => {
    if (selectedYear?.idAnnee) {
      setFilters(f => ({ ...f, idAca: selectedYear.idAnnee }))
    }
  }, [selectedYear])

  // ── Fetch paiements ───────────────────────────────────────────
  const fetchPaiements = useCallback(async () => {
    setLoading(true)
    try {
      if (isParent) {
        // Parent voit ses propres paiements + résumé
        const [{ data: listData }, { data: summaryData }] = await Promise.all([
          getPaiementsParent({ ...filters }),
          getPaiementSummary({ idAca: filters.idAca })
        ])
        setPaiements(listData.paiements || listData.data || [])
        setSummary(summaryData.data)
      } else {
        const [list, rec] = await Promise.all([
          getPaiements({ ...filters }),
          getPaiementsRecents({ limit: 5 }),
        ])
        setPaiements(filterDeleted(list.data.paiements || list.data.data || []))
        setRecents(rec.data.paiements || rec.data.data || [])
      }
    } catch { toast.error('Erreur chargement paiements.') }
    finally { setLoading(false) }
  }, [filters, isParent])

  useEffect(() => {
    const t = setTimeout(fetchPaiements, 300)
    return () => clearTimeout(t)
  }, [filters, fetchPaiements])

  // ── Valider un paiement (admin) — ouvre modal modeReglement ──
  const handleValider = (idPaie, nom, matricule) => {
    setValidModal({ idPaie, nom, matricule })
  }

  const confirmValider = async (modeReglement) => {
    if (!validModal) return
    const { idPaie, nom, matricule } = validModal
    try {
      await validerPaiement(idPaie, { modeReglement })
      toast.success(
        `Paiement de ${nom} validé — ${modeReglement === 'virement' ? 'Virement' : 'Cash'} !`,
        { duration: 4000 }
      )
      setValidModal(null)
      fetchPaiements()
    } catch { toast.error('Erreur validation.') }
  }

  // ── Activer directement l'élève depuis la liste paiements ─────
  const handleActiverEleve = async (matricule, nomEleve) => {
    if (!window.confirm(`Activer l'élève ${nomEleve} dans le système ?`)) return
    try {
      await toggleActif(matricule, 1)
      toast.success(`Élève ${nomEleve} activé avec succès !`)
      fetchPaiements()
    } catch { toast.error("Erreur lors de l'activation.") }
  }

  // ── Statistiques locales ──────────────────────────────────────
  const totalMontant  = paiements.reduce((s, p) => s + parseFloat(p.montant || 0), 0)
  const totalValides  = paiements.filter(p => p.valide === 1).length
  const totalAttente  = paiements.filter(p => p.valide === 0).length

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const paiementsFiltres = search
    ? paiements.filter(p =>
        `${p.nomEleve} ${p.matricule}`.toLowerCase().includes(search.toLowerCase())
      )
    : paiements

  return (
    <div className="page-container">

      {/* ── En-tête ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Paiements</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isParent ? 'Historique de vos paiements' : `${paiements.length} paiement(s) enregistré(s)`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPaiements}
            className="btn-icon" title="Actualiser">
            <RefreshCw size={16} />
          </button>
          {(isAdmin || isParent) && (
            <button onClick={() => setShowForm(v => !v)} className="btn-primary">
              <Plus size={16} />
              {isAdmin ? 'Nouveau paiement' : 'Initier un paiement'}
            </button>
          )}
        </div>
      </div>

      {/* ── Stats (admin ou parent summary) ───────────────────── */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard loading={loading} label="Total encaissé"
            value={fmt(totalMontant)} icon={Wallet} color="bg-emerald-500" />
          <StatCard loading={loading} label="Paiements validés"
            value={totalValides} icon={CheckCircle} color="bg-primary-500" />
          <StatCard loading={loading} label="En attente"
            value={totalAttente} icon={Clock} color="bg-amber-500"
            sub={totalAttente > 0 ? 'À valider' : 'Tout est à jour'} />
          <StatCard loading={loading} label="Ce mois"
            value={recents.length} icon={TrendingUp} color="bg-blue-500"
            sub="Derniers paiements" />
        </div>
      )}

      {isParent && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard loading={loading} label="Total Scolarité"
            value={fmt(summary.totalDue)} icon={CreditCard} color="bg-indigo-500" />
          <StatCard loading={loading} label="Déjà payé"
            value={fmt(summary.totalPaid)} icon={CheckCircle} color="bg-emerald-500" />
          <StatCard loading={loading} label="Reste à payer"
            value={fmt(summary.remaining)} icon={Wallet} 
            color={summary.remaining > 0 ? 'bg-rose-500' : 'bg-emerald-500'}
            sub={summary.remaining > 0 ? 'Solde à régler' : 'Scolarité soldée'} />
        </div>
      )}

      {/* ── Formulaire ───────────────────────────────────────── */}
      {showForm && isAdmin && (
        <NouveauPaiementForm
          modes={modes} annees={annees}
          onSuccess={() => { setShowForm(false); fetchPaiements() }}
          onCancel={() => setShowForm(false)}
        />
      )}
      {showForm && isParent && (
        <InitierPaiementForm
          modes={modes} annees={annees}
          onSuccess={() => { setShowForm(false); fetchPaiements() }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ── Filtres ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Rechercher élève, matricule..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" />
        </div>
        {isAdmin && (
          <>
            <select value={filters.statut}
              onChange={e => setFilter('statut', e.target.value)}
              className="select-field w-44">
              <option value="">Tous les statuts</option>
              <option value="1">Validés</option>
              <option value="0">En attente</option>
            </select>
            <select value={filters.idAca}
              onChange={e => setFilter('idAca', e.target.value)}
              className="select-field w-48">
              <option value="">Toutes les années</option>
              {annees.map(a => (
                <option key={a.idAnnee} value={a.idAnnee}>{a.libelle}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* ── Récents (admin — sidebar rapide) ─────────────────── */}
      {isAdmin && recents.length > 0 && (
        <div className="card p-4 mb-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight size={14} className="text-primary-500" />
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Derniers paiements
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {recents.map(r => (
              <div key={r.idPaie}
                className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-xs">
                <span className="font-medium text-gray-700">{r.nomEleve || r.matricule}</span>
                <span className="text-emerald-600 font-semibold">{fmt(r.montant)}</span>
                <span className={`badge border text-xs py-0 ${(STATUT_STYLE[r.valide] ?? STATUT_STYLE[0]).cls}`}>
                  {(STATUT_STYLE[r.valide] ?? STATUT_STYLE[0]).label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/5 rounded" />
                </div>
                <div className="skeleton h-7 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : paiementsFiltres.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <CreditCard size={36} className="text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Aucun paiement trouvé.</p>
            {!showForm && (
              <button onClick={() => setShowForm(true)}
                className="btn-primary mt-4">
                <Plus size={15} />
                {isAdmin ? 'Enregistrer un paiement' : 'Initier un paiement'}
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Élève', 'Montant', 'Mode', 'Date', 'Référence', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paiementsFiltres.map(p => {
                const st = STATUT_STYLE[p.valide] ?? STATUT_STYLE[0]
                return (
                  <tr key={p.idPaie} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center
                          justify-center text-primary-600 text-xs font-semibold shrink-0">
                          {(p.nomEleve || '?')[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{p.nomEleve || '—'}</p>
                          <p className="text-gray-400 text-xs">Mat. {p.matricule}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-gray-900">
                        {Number(p.montant || 0).toLocaleString('fr-FR')}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">FCFA</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{p.libelleMode || '—'}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {p.datePaie ? new Date(p.datePaie).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs font-mono">
                      {p.operation_ID !== 'INDEFINI' ? p.operation_ID : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`badge border ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setDetailId(p.idPaie)}
                          className="btn-icon" title="Voir détail">
                          <Eye size={14} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setFicheMatricule(p.matricule)}
                            className="btn-icon bg-blue-50 text-blue-600 hover:bg-blue-100"
                            title="Dossier complet">
                            <Plus size={14} />
                          </button>
                        )}
                        {isAdmin && p.valide === 0 && (
                          <button
                            onClick={() => handleValider(p.idPaie, p.nomEleve || p.matricule, p.matricule)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50
                              hover:bg-emerald-100 text-emerald-700 text-xs font-medium
                              rounded-lg transition-colors">
                            <CheckCircle size={12} /> Valider
                          </button>
                        )}
                        {isAdmin && p.valide === 1 && p.matricule && (
                          <button
                            onClick={() => handleActiverEleve(p.matricule, p.nomEleve)}
                            title="Activer l'élève"
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50
                              hover:bg-blue-100 text-blue-700 text-xs font-medium
                              rounded-lg transition-colors">
                            🎓 Activer élève
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Validation Amélioré */}
      {validModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="font-display font-bold text-gray-900 text-lg mb-1">Valider le paiement</h3>
            <p className="text-gray-500 text-sm mb-6">Confirmez la réception des fonds pour <b>{validModal.nom}</b></p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => confirmValider('cash')}
                className="flex flex-col items-center gap-2 p-3 border border-gray-100 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-all">
                <Wallet size={20} className="text-primary-500" />
                <span className="text-xs font-semibold">Espèces (Cash)</span>
              </button>
              <button onClick={() => confirmValider('virement')}
                className="flex flex-col items-center gap-2 p-3 border border-gray-100 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                <RefreshCw size={20} className="text-emerald-500" />
                <span className="text-xs font-semibold">Virement Mobile</span>
              </button>
            </div>
            
            <button onClick={() => setValidModal(null)} className="text-gray-400 text-sm hover:underline">Annuler</button>
          </div>
        </div>
      )}

      {/* ── Modal détail ─────────────────────────────────────── */}
      {detailId && (
        <PaiementDetailModal
          idPaie={detailId}
          onClose={() => setDetailId(null)}
        />
      )}

      {ficheMatricule && <EleveFicheModal matricule={ficheMatricule} onClose={() => setFicheMatricule(null)} />}
    </div>
  )
}