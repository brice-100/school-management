import { useState, useEffect } from 'react'
import { Plus, CheckCircle, Zap, Search } from 'lucide-react'
import {
  getSalaries, getSalaryRecap, createSalary, genererMois, payerSalaire
} from '../../services/salaryService'
import { getTeachers } from '../../services/teacherService'
import toast           from 'react-hot-toast'

const MOIS_LABELS = {
  '01':'Janvier','02':'Février','03':'Mars','04':'Avril',
  '05':'Mai','06':'Juin','07':'Juillet','08':'Août',
  '09':'Septembre','10':'Octobre','11':'Novembre','12':'Décembre'
}
const MOIS_OPTIONS = Object.entries(MOIS_LABELS)
const ANNEES = [String(new Date().getFullYear()), '2025', '2024', '2023']

function RecapCard({ label, value, color = 'text-gray-900' }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-bold font-display ${color}`}>{value}</p>
    </div>
  )
}

export default function SalaryList() {
  const [salaries,  setSalaries]  = useState([])
  const [teachers,  setTeachers]  = useState([])
  const [recap,     setRecap]     = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [showGen,   setShowGen]   = useState(false)

  const now = new Date()
  const [filters, setFilters] = useState({
    annee:  String(now.getFullYear()),
    statut: '',
  })
  const [filterMois, setFilterMois] = useState(
    String(now.getMonth() + 1).padStart(2, '0')
  )

  const [form, setForm] = useState({
    teacher_id: '', montant: '', mois: '01', annee: String(now.getFullYear())
  })
  const [genForm, setGenForm] = useState({
    mois: String(now.getMonth() + 1).padStart(2, '0'),
    annee: String(now.getFullYear()),
    montant_defaut: ''
  })

  useEffect(() => {
    getTeachers().then(({ data }) => setTeachers(data.enseignants || data.data || []))
  }, [])

  const fetchSalaries = async () => {
    setLoading(true)
    try {
      const [sal, rec] = await Promise.all([
        getSalaries({ ...filters }),
        getSalaryRecap({ mois: filterMois, annee: filters.annee })
      ])
      setSalaries(sal.data.data)
      setRecap(rec.data.data)
    } catch { toast.error('Erreur chargement.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchSalaries() }, [filters, filterMois])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.teacher_id || !form.montant || !form.mois || !form.annee)
      return toast.error('Tous les champs sont requis.')
    try {
      await createSalary(form)
      toast.success('Fiche créée !')
      setShowForm(false)
      fetchSalaries()
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const handleGenerer = async (e) => {
    e.preventDefault()
    if (!genForm.montant_defaut) return toast.error('Montant requis.')
    try {
      const { data } = await genererMois(genForm)
      toast.success(data.message)
      setShowGen(false)
      fetchSalaries()
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const handlePayer = async (id, name) => {
    if (!window.confirm(`Confirmer le paiement pour ${name} ?`)) return
    try {
      await payerSalaire(id)
      toast.success('Salaire marqué comme payé !')
      fetchSalaries()
    } catch { toast.error('Erreur.') }
  }

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR') + ' FCFA'

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Salaires</h1>
          <p className="text-gray-500 text-sm mt-0.5">Suivi des paiements enseignants</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGen(!showGen)} className="btn-secondary flex items-center gap-2">
            <Zap size={15} /> Générer le mois
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      {/* Recap stats */}
      {recap && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <RecapCard label="Total fiches"    value={recap.total_fiches}         />
          <RecapCard label="Total montant"   value={fmt(recap.total_montant)}   />
          <RecapCard label="Total payé"      value={fmt(recap.total_paye)}      color="text-emerald-600" />
          <RecapCard label="Reste à payer"   value={fmt(recap.total_restant)}   color="text-red-500" />
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={filterMois} onChange={e => setFilterMois(e.target.value)}
          className="select-field w-40">
          {MOIS_OPTIONS.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select value={filters.annee}
          onChange={e => setFilters(f => ({ ...f, annee: e.target.value }))}
          className="select-field w-32">
          {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filters.statut}
          onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))}
          className="select-field w-40">
          <option value="">Tous les statuts</option>
          <option value="paye">Payés</option>
          <option value="non_paye">Non payés</option>
        </select>
      </div>

      {/* Formulaire génération en masse */}
      {showGen && (
        <form onSubmit={handleGenerer} className="card p-5 mb-5 border-l-4 border-amber-400">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Zap size={15} className="text-amber-500" />
            Générer les fiches pour tous les enseignants actifs
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Mois *</label>
              <select value={genForm.mois}
                onChange={e => setGenForm(f => ({ ...f, mois: e.target.value }))}
                className="select-field">
                {MOIS_OPTIONS.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Année *</label>
              <select value={genForm.annee}
                onChange={e => setGenForm(f => ({ ...f, annee: e.target.value }))}
                className="select-field">
                {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Montant par défaut (FCFA) *</label>
              <input type="number" value={genForm.montant_defaut}
                onChange={e => setGenForm(f => ({ ...f, montant_defaut: e.target.value }))}
                placeholder="Ex: 150000" className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">Générer</button>
            <button type="button" onClick={() => setShowGen(false)}
              className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {/* Formulaire fiche individuelle */}
      {showForm && (
        <form onSubmit={handleCreate} className="card p-5 mb-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Nouvelle fiche individuelle
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="form-label">Enseignant *</label>
              <select value={form.teacher_id}
                onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                className="select-field">
                <option value="">— Choisir —</option>
                {teachers.map(t => (
                  <option key={t.idEnseignant || t.id} value={t.idEnseignant || t.id}>
                    {t.prenom} {t.nom}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Montant (FCFA) *</label>
              <input type="number" value={form.montant}
                onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                placeholder="150000" className="input-field" />
            </div>
            <div>
              <label className="form-label">Mois *</label>
              <select value={form.mois}
                onChange={e => setForm(f => ({ ...f, mois: e.target.value }))}
                className="select-field">
                {MOIS_OPTIONS.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Année *</label>
              <select value={form.annee}
                onChange={e => setForm(f => ({ ...f, annee: e.target.value }))}
                className="select-field">
                {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">Créer</button>
            <button type="button" onClick={() => setShowForm(false)}
              className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {/* Table salaires */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        ) : salaries.length === 0 ? (
          <div className="py-14 text-center">
            <CheckCircle size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune fiche pour ces filtres.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Enseignant','Mois','Montant','Statut','Date paiement','Action'].map(h => (
                  <th key={h}
                    className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salaries.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center
                        justify-center text-blue-600 text-xs font-semibold shrink-0">
                        {s.teacher_prenom?.[0]}{s.teacher_nom?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {s.teacher_prenom} {s.teacher_nom}
                        </p>
                        <p className="text-gray-400 text-xs">{s.teacher_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">
                    {MOIS_LABELS[s.mois]} {s.annee}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-gray-900">
                    {Number(s.montant).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-5 py-3.5">
                    {s.statut === 'paye'
                      ? <span className="badge bg-emerald-50 text-emerald-700">✓ Payé</span>
                      : <span className="badge bg-red-50 text-red-600">Non payé</span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    {s.date_paiement
                      ? new Date(s.date_paiement).toLocaleDateString('fr-FR')
                      : '—'
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    {s.statut === 'non_paye' && (
                      <button
                        onClick={() => handlePayer(s.id, `${s.teacher_prenom} ${s.teacher_nom}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50
                          hover:bg-emerald-100 text-emerald-700 text-xs font-medium
                          rounded-lg transition-colors">
                        <CheckCircle size={13} /> Marquer payé
                      </button>
                    )}
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