import { useState, useEffect } from 'react'
import { Plus, Calendar, CheckCircle, RefreshCw, Trash2, Check } from 'lucide-react'
import { 
  getAnneesAcademiques, getAnneeActive, createAnneeAcademique, 
  deleteAnneeAcademique, setActiveAnnee 
} from '../../services/paymentService'
import toast from 'react-hot-toast'
import { useYear } from '../../context/YearContext'

export default function AcademicYearPage() {
  const [annees,  setAnnees]  = useState([])
  const [activeId,setActiveId]= useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm,setShowForm]= useState(false)
  const [saving,  setSaving]  = useState(false)
  const [form, setForm] = useState({ libelle: '', periode: '' })
  const { refreshYears, changeYear } = useYear()

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [list, act] = await Promise.all([getAnneesAcademiques(), getAnneeActive()])
      setAnnees(list.data.annees || list.data.data || [])
      const a = act.data
      setActiveId(a?.idAnnee ?? a?.data?.idAnnee ?? null)
    } catch { toast.error('Erreur chargement.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.libelle || !form.periode) return toast.error('Libellé et période requis.')
    setSaving(true)
    try {
      await createAnneeAcademique(form)
      toast.success('Année créée !')
      setShowForm(false); setForm({ libelle: '', periode: '' })
      refreshYears() // Synchronisation globale
      fetchAll()
    } catch (err) { toast.error(err.message || 'Erreur.') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, libelle) => {
    if (!window.confirm(`Supprimer DÉFINITIVEMENT l'année ${libelle} ?\nAttention : Cela peut échouer si des données (notes, paiements) y sont liées.`)) return
    try {
      await deleteAnneeAcademique(id)
      toast.success('Année supprimée.')
      fetchAll()
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur lors de la suppression.') }
  }

  const handleSetActive = async (id) => {
    try {
      await setActiveAnnee(id)
      toast.success('Année activée !')
      changeYear(id) // Basculer globalement sur cette année
    } catch { toast.error('Erreur lors de l\'activation.') }
  }

  return (
    <div className="page-container max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Années académiques</h1>
          <p className="text-gray-500 text-sm mt-0.5">{annees.length} année(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="btn-icon"><RefreshCw size={16}/></button>
          <button onClick={() => setShowForm(v => !v)} className="btn-primary">
            <Plus size={16}/> Nouvelle année
          </button>
        </div>
      </div>

      {activeId && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-5">
          <CheckCircle size={16} className="text-emerald-600 shrink-0"/>
          <p className="text-emerald-700 text-sm font-medium">
            En cours : {annees.find(a => a.idAnnee === activeId)?.libelle ?? `#${activeId}`}
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-5 border-l-4 border-primary-400">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Nouvelle année</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Libellé *</label>
              <input value={form.libelle} onChange={e => setForm(f => ({...f, libelle: e.target.value}))}
                placeholder="Ex: 2025-2026" className="input-field"/>
            </div>
            <div>
              <label className="form-label">Période *</label>
              <input value={form.periode} onChange={e => setForm(f => ({...f, periode: e.target.value}))}
                placeholder="Ex: Sept 2025 — Juin 2026" className="input-field"/>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Création...' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl"/>)}
          </div>
        ) : annees.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar size={32} className="text-gray-200 mx-auto mb-3"/>
            <p className="text-gray-400 text-sm">Aucune année académique.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {annees.map((a, i) => {
              const isActif = a.idAnnee === activeId
              return (
                <div key={a.idAnnee}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50
                    transition-colors ${isActif ? 'bg-emerald-50/30' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center
                    text-sm font-bold shrink-0
                    ${isActif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {annees.length - i}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{a.libelle}</p>
                      {isActif && (
                        <span className="badge bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs">
                          ✓ En cours
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">{a.periode}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <p className="text-gray-400 text-[10px] hidden sm:block mr-2">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString('fr-FR') : '—'}
                    </p>
                    {!isActif && (
                      <button onClick={() => handleSetActive(a.idAnnee)}
                        className="btn-icon text-emerald-500 hover:bg-emerald-50" title="Définir comme active">
                        <Check size={16}/>
                      </button>
                    )}
                    <button onClick={() => handleDelete(a.idAnnee, a.libelle)}
                      className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600" title="Supprimer">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}