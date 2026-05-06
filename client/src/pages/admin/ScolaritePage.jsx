import { useState, useEffect } from 'react'
import {
  Plus, Pencil, Trash2, X, Check, Settings,
  CreditCard, Layers, ToggleLeft, ToggleRight, ChevronRight,
} from 'lucide-react'
import {
  getScolarite, createScolarite, updateScolarite,
  getTranches, createTranche, updateTranche, deleteTranche,
  getModesPaiement, createModePaiement, toggleModePaiement,
} from '../../services/paymentService'
import { getCycles } from '../../services/classService'
import toast from 'react-hot-toast'

// ── Helpers ──────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'

// ── Section Scolarité par cycle ───────────────────────────────────
function ScolariteSection({ cycles }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [editId,  setEditId]  = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    inscription: '', pension: '', nbreTranche: 3,
    description: '', idCycle: '',
  })

  const fetch = () => {
    setLoading(true)
    getScolarite()
      .then(({ data }) => setItems(data.scolarite ? [data.scolarite] : data.data || []))
      .catch(() => toast.error('Erreur chargement scolarité.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleEdit = (item) => {
    setEditId(item.idScolarite)
    setForm({
      inscription: item.inscription, pension: item.pension,
      nbreTranche: item.nbreTranche, description: item.description || '',
      idCycle: item.idCycle,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.idCycle || !form.inscription || !form.pension)
      return toast.error('Cycle, inscription et pension sont requis.')
    try {
      if (editId) {
        await updateScolarite(editId, form)
        toast.success('Frais mis à jour !')
      } else {
        await createScolarite(form)
        toast.success('Frais créés !')
      }
      setShowForm(false)
      setEditId(null)
      setForm({ inscription: '', pension: '', nbreTranche: 3, description: '', idCycle: '' })
      fetch()
    } catch (err) {
      toast.error(err.message || 'Erreur.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-800">Frais de scolarité par cycle</h2>
          <p className="text-gray-400 text-xs mt-0.5">Inscription, pension et nombre de tranches</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ inscription:'',pension:'',nbreTranche:3,description:'',idCycle:'' }) }}
          className="btn-primary">
          <Plus size={15} /> Définir des frais
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-5 border-l-4 border-primary-400">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {editId ? 'Modifier les frais' : 'Nouveaux frais'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Cycle *</label>
              <select value={form.idCycle} onChange={e => set('idCycle', e.target.value)}
                className="select-field">
                <option value="">— Choisir —</option>
                {cycles.map(c => (
                  <option key={c.idCycle} value={c.idCycle}>{c.libelle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Frais d'inscription (FCFA) *</label>
              <input type="number" min="0" value={form.inscription}
                onChange={e => set('inscription', e.target.value)}
                placeholder="Ex: 25000" className="input-field" />
            </div>
            <div>
              <label className="form-label">Pension annuelle (FCFA) *</label>
              <input type="number" min="0" value={form.pension}
                onChange={e => set('pension', e.target.value)}
                placeholder="Ex: 150000" className="input-field" />
            </div>
            <div>
              <label className="form-label">Nombre de tranches</label>
              <select value={form.nbreTranche} onChange={e => set('nbreTranche', e.target.value)}
                className="select-field">
                {[1,2,3,4,6].map(n => (
                  <option key={n} value={n}>{n} tranche{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Notes sur ces frais..." className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">
              {editId ? 'Mettre à jour' : 'Créer'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
              className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <Layers size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucun frais défini.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Cycle', 'Inscription', 'Pension', 'Tranches', 'Actions'].map(h => (
                  <th key={h} className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map(item => (
                <tr key={item.idScolarite} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="badge bg-purple-50 text-purple-700">
                      {cycles.find(c => c.idCycle === item.idCycle)?.libelle || `Cycle #${item.idCycle}`}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">{fmt(item.inscription)}</td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-600">{fmt(item.pension)}</td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-blue-50 text-blue-700">
                      {item.nbreTranche} tranche{item.nbreTranche > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleEdit(item)} className="btn-icon">
                      <Pencil size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Section Tranches ──────────────────────────────────────────────
function TranchesSection({ cycles }) {
  const [scolarites,  setScolarites]  = useState([])
  const [tranches,    setTranches]    = useState([])
  const [selectedSco, setSelectedSco] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [editId,      setEditId]      = useState(null)
  const [showForm,    setShowForm]    = useState(false)
  const [form, setForm] = useState({
    libelle: '', montant: '', delai_mois: '01', delai_jour: '01',
  })

  useEffect(() => {
    getScolarite()
      .then(({ data }) => {
        const list = data.scolarite ? [data.scolarite] : data.data || []
        setScolarites(list)
        if (list.length > 0) setSelectedSco(String(list[0].idScolarite))
      })
  }, [])

  useEffect(() => {
    if (!selectedSco) return
    setLoading(true)
    getTranches({ idScolarite: selectedSco })
      .then(({ data }) => setTranches(data.tranches || data.data || []))
      .catch(() => toast.error('Erreur chargement tranches.'))
      .finally(() => setLoading(false))
  }, [selectedSco])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleEdit = (item) => {
    setEditId(item.idTranche)
    setForm({ libelle: item.libelle, montant: item.montant,
      delai_mois: item.delai_mois, delai_jour: item.delai_jour })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.libelle || !form.montant) return toast.error('Libellé et montant requis.')
    try {
      if (editId) {
        await updateTranche(editId, form)
        toast.success('Tranche mise à jour !')
      } else {
        await createTranche({ ...form, idScolarite: selectedSco })
        toast.success('Tranche créée !')
      }
      setShowForm(false); setEditId(null)
      setForm({ libelle: '', montant: '', delai_mois: '01', delai_jour: '01' })
      getTranches({ idScolarite: selectedSco })
        .then(({ data }) => setTranches(data.tranches || data.data || []))
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette tranche ?')) return
    try {
      await deleteTranche(id)
      toast.success('Tranche supprimée.')
      setTranches(t => t.filter(x => x.idTranche !== id))
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const MOIS = ['01','02','03','04','05','06','07','08','09','10','11','12']
  const JOURS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-800">Tranches de paiement</h2>
          <p className="text-gray-400 text-xs mt-0.5">Échéancier par scolarité</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ libelle:'',montant:'',delai_mois:'01',delai_jour:'01' }) }}
          disabled={!selectedSco}
          className="btn-primary disabled:opacity-50">
          <Plus size={15} /> Ajouter une tranche
        </button>
      </div>

      {/* Sélecteur scolarité */}
      {scolarites.length > 1 && (
        <div className="mb-4">
          <select value={selectedSco} onChange={e => setSelectedSco(e.target.value)}
            className="select-field w-64">
            {scolarites.map(s => (
              <option key={s.idScolarite} value={s.idScolarite}>
                {cycles.find(c => c.idCycle === s.idCycle)?.libelle || `Scolarité #${s.idScolarite}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {showForm && selectedSco && (
        <form onSubmit={handleSubmit} className="card p-5 mb-5 border-l-4 border-amber-400">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {editId ? 'Modifier la tranche' : 'Nouvelle tranche'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Libellé *</label>
              <input value={form.libelle} onChange={e => set('libelle', e.target.value)}
                placeholder="Ex: 1ère tranche" className="input-field" />
            </div>
            <div>
              <label className="form-label">Montant (FCFA) *</label>
              <input type="number" min="0" value={form.montant}
                onChange={e => set('montant', e.target.value)}
                placeholder="Ex: 50000" className="input-field" />
            </div>
            <div>
              <label className="form-label">Délai (Mois)</label>
              <select value={form.delai_mois} onChange={e => set('delai_mois', e.target.value)}
                className="select-field">
                {MOIS.map(m => <option key={m} value={m}>Mois {m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Délai (Jour)</label>
              <select value={form.delai_jour} onChange={e => set('delai_jour', e.target.value)}
                className="select-field">
                {JOURS.map(j => <option key={j} value={j}>Jour {j}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">
              {editId ? 'Mettre à jour' : 'Créer'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
              className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}
          </div>
        ) : tranches.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-400 text-sm">
              {selectedSco ? 'Aucune tranche définie.' : 'Sélectionnez une scolarité.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Libellé', 'Montant', 'Échéance', 'Actions'].map(h => (
                  <th key={h} className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tranches.map((t, i) => (
                <tr key={t.idTranche} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center
                        justify-center text-primary-600 text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <span className="font-medium text-gray-900">{t.libelle}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-600">{fmt(t.montant)}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    Mois {t.delai_mois}, Jour {t.delai_jour}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(t)} className="btn-icon">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(t.idTranche)}
                        className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Section Modes de paiement ─────────────────────────────────────
function ModesSection() {
  const [modes,    setModes]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form, setForm] = useState({ libelle: '', information: '' })

  const fetchModes = () => {
    setLoading(true)
    getModesPaiement()
      .then(({ data }) => setModes(data.modes || data.data || []))
      .catch(() => toast.error('Erreur chargement modes.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchModes() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.libelle) return toast.error('Le libellé est requis.')
    setSaving(true)
    try {
      await createModePaiement(form)
      toast.success('Mode créé !')
      setForm({ libelle: '', information: '' })
      setShowForm(false)
      fetchModes()
    } catch (err) {
      toast.error(err.message || 'Erreur.')
    } finally { setSaving(false) }
  }

  const handleToggle = async (m) => {
    try {
      await toggleModePaiement(m.idMode, { actif: m.actif === 1 ? 0 : 1 })
      toast.success(m.actif === 1 ? 'Mode désactivé.' : 'Mode activé !')
      fetchModes()
    } catch { toast.error('Erreur mise à jour.') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-800">Modes de paiement</h2>
          <p className="text-gray-400 text-xs mt-0.5">Mobile money, espèces, virement…</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          <Plus size={15} /> Ajouter un mode
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 mb-5 border-l-4 border-emerald-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Libellé *</label>
              <input value={form.libelle}
                onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
                placeholder="Ex: Mobile Money, Espèces..." className="input-field" />
            </div>
            <div>
              <label className="form-label">Informations</label>
              <input value={form.information}
                onChange={e => setForm(f => ({ ...f, information: e.target.value }))}
                placeholder="Ex: MTN MoMo — 237XXXXXXXXX" className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Création...' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
          </div>
        ) : modes.length === 0 ? (
          <div className="py-10 text-center">
            <CreditCard size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aucun mode de paiement.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {modes.map(m => (
              <div key={m.idMode}
                className={`flex items-center justify-between px-5 py-4 transition-colors
                  ${m.actif === 1 ? 'hover:bg-gray-50/50' : 'opacity-50 bg-gray-50/30'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                    ${m.actif === 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    <CreditCard size={15} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{m.libelle}</p>
                    {m.information && (
                      <p className="text-gray-400 text-xs">{m.information}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${m.actif === 1
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'}`}>
                    {m.actif === 1 ? 'Actif' : 'Inactif'}
                  </span>
                  <button onClick={() => handleToggle(m)}
                    className="btn-icon" title={m.actif === 1 ? 'Désactiver' : 'Activer'}>
                    {m.actif === 1
                      ? <ToggleRight size={20} className="text-emerald-500" />
                      : <ToggleLeft size={20} className="text-gray-400" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function ScolaritePage() {
  const [tab,    setTab]    = useState('scolarite')
  const [cycles, setCycles] = useState([])

  useEffect(() => {
    getCycles().then(({ data }) => setCycles(data.cycles || data.data || []))
      .catch(() => {})
  }, [])

  const TABS = [
    { key: 'scolarite', label: 'Frais de scolarité', icon: Layers },
    { key: 'tranches',  label: 'Tranches',           icon: ChevronRight },
    { key: 'modes',     label: 'Modes de paiement',  icon: CreditCard },
  ]

  return (
    <div className="page-container">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
            <Settings size={17} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-gray-900">Scolarité</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Configuration des frais, tranches et modes de paiement
            </p>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all ${tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'}`}>
              <Icon size={14} />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'scolarite' && <ScolariteSection cycles={cycles} />}
      {tab === 'tranches'  && <TranchesSection  cycles={cycles} />}
      {tab === 'modes'     && <ModesSection />}
    </div>
  )
}