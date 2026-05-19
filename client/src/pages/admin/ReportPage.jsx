import { useState, useEffect } from 'react'
import {
  Plus, Search, Pencil, Trash2, X,
  AlertTriangle, FileText, Shield, RefreshCw,
} from 'lucide-react'
import {
  getRapports, createRapport, updateRapport,
  getJustificatifs, createJustificatif, validerJustificatif,
  getDisciplines,
} from '../../services/reportService'
import { getStudents } from '../../services/studentService'
import { getAnneesAcademiques } from '../../services/paymentService'
import { useAuth } from '../../context/AuthContext'
import { useYear } from '../../context/YearContext'
import toast from 'react-hot-toast'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

// ── Modal justificatifs ───────────────────────────────────────────
function JustificatifsModal({ rapport, onClose, isParent }) {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ commentaire: '', urlDoc: '' })

  useEffect(() => {
    getJustificatifs({ idRapport: rapport.idRap })
      .then(({ data }) => setItems(data.justificatifs || data.data || []))
      .catch(() => toast.error('Erreur chargement.'))
      .finally(() => setLoading(false))
  }, [rapport.idRap])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.commentaire) return toast.error('Commentaire requis.')
    try {
      await createJustificatif({ ...form, idRapport: rapport.idRap })
      toast.success('Justificatif soumis !')
      setShowForm(false)
      setForm({ commentaire: '', urlDoc: '' })
      const { data } = await getJustificatifs({ idRapport: rapport.idRap })
      setItems(data.justificatifs || data.data || [])
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-gray-900">Justificatifs</h3>
            <p className="text-gray-400 text-xs">{rapport.libelle}</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-center">
            <FileText size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aucun justificatif.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {items.map(j => (
              <div key={j.ID} className="bg-gray-50 rounded-xl p-3 flex flex-col justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-700">{j.commentaire}</p>
                  {j.urlDoc && (
                    <a href={j.urlDoc} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary-500 hover:underline mt-1">
                      Voir le document
                    </a>
                  )}
                </div>
                <div className="flex justify-between items-center border-t border-gray-100/50 pt-2 mt-1">
                  <p className="text-xs text-gray-400">
                    {j.idDirecteur ? '✅ Validé' : '⏳ En attente'}
                  </p>
                  {!j.idDirecteur && !isParent && (
                    <button
                      onClick={async () => {
                        try {
                          await validerJustificatif(j.ID)
                          toast.success('Justificatif validé et statut mis à jour !')
                          const { data } = await getJustificatifs({ idRapport: rapport.idRap })
                          setItems(data.justificatifs || data.data || [])
                        } catch {
                          toast.error('Erreur lors de la validation.')
                        }
                      }}
                      className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg transition-all"
                    >
                      Valider l'absence
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {isParent && (
          <>
            {!showForm ? (
              <button onClick={() => setShowForm(true)} className="btn-primary w-full">
                <Plus size={14} /> Soumettre un justificatif
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <label className="form-label">Commentaire *</label>
                  <textarea value={form.commentaire}
                    onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                    placeholder="Expliquez l'absence..." rows={3}
                    className="input-field resize-none" />
                </div>
                <div>
                  <label className="form-label">URL document</label>
                  <input value={form.urlDoc}
                    onChange={e => setForm(f => ({ ...f, urlDoc: e.target.value }))}
                    placeholder="Lien vers le justificatif..." className="input-field" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1">Soumettre</button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="btn-secondary">Annuler</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function ReportsPage() {
  const { user } = useAuth()
  const { selectedYear } = useYear()
  const isAdmin   = user?.typeAdmin !== undefined
  const isTeacher = user?.typePersonne === 1
  const isParent  = user?.typePersonne === 4

  const [rapports,    setRapports]    = useState([])
  const [students,    setStudents]    = useState([])
  const [disciplines, setDisciplines] = useState([])
  const [annees,      setAnnees]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [editId,      setEditId]      = useState(null)
  const [selectedRap, setSelectedRap] = useState(null)
  const [search,      setSearch]      = useState('')
  const [filters,     setFilters]     = useState({ matricule: '', idAca: selectedYear?.idAnnee || '' })

  const [form, setForm] = useState({
    libelle: '', points: '', matricule: '', idAca: '',
    event_date: new Date().toISOString().split('T')[0],
    commentaire: '', idDiscipline: '',
  })

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  useEffect(() => {
    Promise.all([
      getStudents({}),
      getDisciplines(),
      getAnneesAcademiques(),
    ]).then(([s, d, a]) => {
      setStudents(s.data.data || [])
      setDisciplines(d.data.disciplines || d.data.data || [])
      setAnnees(a.data.annees || a.data.data || [])
    })
  }, [])

  // Synchroniser idAca quand l'année change globalement
  useEffect(() => {
    if (selectedYear?.idAnnee) {
      setFilters(f => ({ ...f, idAca: selectedYear.idAnnee }))
    }
  }, [selectedYear])

  const fetchRapports = async () => {
    setLoading(true)
    try {
      const { data } = await getRapports(filters)
      setRapports(data.rapports || data.data || [])
    } catch { toast.error('Erreur chargement rapports.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const t = setTimeout(fetchRapports, 300)
    return () => clearTimeout(t)
  }, [filters])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.libelle || !form.matricule || !form.idAca)
      return toast.error('Libellé, élève et année requis.')
    try {
      if (editId) {
        await updateRapport(editId, { libelle: form.libelle, commentaire: form.commentaire })
        toast.success('Rapport mis à jour !')
      } else {
        await createRapport(form)
        toast.success('Rapport créé !')
      }
      setShowForm(false); setEditId(null)
      setForm({ libelle:'', points:'', matricule:'', idAca:'',
        event_date: new Date().toISOString().split('T')[0], commentaire:'', idDiscipline:'' })
      fetchRapports()
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const handleEdit = (r) => {
    setEditId(r.idRap)
    setForm({ libelle: r.libelle, points: r.points, matricule: r.matricule,
      idAca: r.idAca, event_date: r.event_date?.split('T')[0] || '',
      commentaire: r.commentaire || '', idDiscipline: '' })
    setShowForm(true)
  }

  const handleCancelAbsence = async (r) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette absence et réinitialiser les points de malus à 0 ?')) return
    try {
      await updateRapport(r.idRap, {
        libelle: r.libelle,
        points: 0,
        status: 'Annulé',
        commentaire: r.commentaire || ''
      })
      toast.success('Absence annulée et points de malus remis à 0 !')
      fetchRapports()
    } catch {
      toast.error('Erreur lors de l\'annulation de l\'absence.')
    }
  }

  const rapportsFiltres = search
    ? rapports.filter(r =>
        r.nomEleve?.toLowerCase().includes(search.toLowerCase()) ||
        r.libelle?.toLowerCase().includes(search.toLowerCase())
      )
    : rapports

  return (
    <div className="page-container">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Rapports & Discipline
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {rapports.length} rapport(s) enregistré(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchRapports} className="btn-icon"><RefreshCw size={16} /></button>
          {(isAdmin || isTeacher) && (
            <button onClick={() => { setShowForm(v => !v); setEditId(null) }}
              className="btn-primary">
              <Plus size={16} /> Nouveau rapport
            </button>
          )}
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (isAdmin || isTeacher) && (
        <form onSubmit={handleSubmit} className="card p-5 mb-5 border-l-4 border-red-400">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {editId ? 'Modifier le rapport' : 'Nouveau rapport d\'absence / discipline'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Libellé *</label>
              <input value={form.libelle} onChange={e => set('libelle', e.target.value)}
                placeholder="Ex: Absence non justifiée" className="input-field" />
            </div>
            {!editId && (
              <>
                <div>
                  <label className="form-label">Élève *</label>
                  <select value={form.matricule} onChange={e => set('matricule', e.target.value)}
                    className="select-field">
                    <option value="">— Choisir —</option>
                    {students.map(s => (
                      <option key={s.matricule} value={s.matricule}>
                        {s.prenom} {s.nom}
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
                  <label className="form-label">Type discipline</label>
                  <select value={form.idDiscipline} onChange={e => set('idDiscipline', e.target.value)}
                    className="select-field">
                    <option value="">— Aucun —</option>
                    {disciplines.map(d => (
                      <option key={d.ID} value={d.ID}>
                        {d.libelle} ({d.points} pts)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Points</label>
                  <input type="number" min="0" value={form.points}
                    onChange={e => set('points', e.target.value)}
                    placeholder="Ex: 5" className="input-field" />
                </div>
                <div>
                  <label className="form-label">Date de l'événement</label>
                  <input type="date" value={form.event_date}
                    onChange={e => set('event_date', e.target.value)}
                    className="input-field" />
                </div>
              </>
            )}
            <div className={editId ? 'sm:col-span-2' : 'md:col-span-3'}>
              <label className="form-label">Commentaire</label>
              <textarea value={form.commentaire} onChange={e => set('commentaire', e.target.value)}
                placeholder="Détails sur le rapport..." rows={2}
                className="input-field resize-none" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">
              {editId ? 'Mettre à jour' : 'Créer'}
            </button>
            <button type="button"
              onClick={() => { setShowForm(false); setEditId(null) }}
              className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Rechercher un élève, libellé..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-9" />
        </div>
        <select value={filters.idAca} onChange={e => setF('idAca', e.target.value)}
          className="select-field w-48">
          <option value="">Toutes les années</option>
          {annees.map(a => (
            <option key={a.idAnnee} value={a.idAnnee}>{a.libelle}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton w-9 h-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : rapportsFiltres.length === 0 ? (
          <div className="py-14 text-center">
            <Shield size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucun rapport enregistré.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Élève', 'Rapport', 'Points', 'Date', 'Justifié', 'Actions'].map(h => (
                  <th key={h} className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rapportsFiltres.map(r => (
                <tr key={r.idRap} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center
                        justify-center text-red-500 shrink-0">
                        <AlertTriangle size={13} />
                      </div>
                      <p className="font-medium text-gray-900">
                        {r.nomEleve || `Mat. ${r.matricule}`}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-gray-700">{r.libelle}</p>
                    {r.commentaire && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                        {r.commentaire}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-red-50 text-red-600">
                      -{r.points} pts
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">
                    {fmtDate(r.event_date)}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.status === 'Annulé' ? (
                      <span className="badge bg-gray-100 text-gray-400 border border-gray-200">Annulé (0 pts)</span>
                    ) : r.justifie || r.status === 'Validé' ? (
                      <span className="badge bg-emerald-50 text-emerald-700">✓ Oui</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-500">Non</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedRap(r)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50
                          hover:bg-blue-100 text-blue-700 text-xs font-medium
                          rounded-lg transition-colors">
                        <FileText size={12} /> Justif.
                      </button>
                      {isAdmin && r.status === 'Validé' && (
                        <button
                          onClick={() => handleCancelAbsence(r)}
                          className="flex items-center gap-1 px-2 py-1 bg-rose-50
                            hover:bg-rose-100 text-rose-700 text-xs font-semibold
                            rounded-lg transition-colors"
                          title="Annuler l'absence et les points"
                        >
                          Annuler
                        </button>
                      )}
                      {(isAdmin || isTeacher) && r.status !== 'Annulé' && (
                        <button onClick={() => handleEdit(r)} className="btn-icon">
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal justificatifs */}
      {selectedRap && (
        <JustificatifsModal
          rapport={selectedRap}
          isParent={isParent}
          onClose={() => setSelectedRap(null)}
        />
      )}
    </div>
  )
}