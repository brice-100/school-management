import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Pencil, Trash2, BookOpen,
  FileText, Star,
} from 'lucide-react'
  getEvaluations, getEvaluationsClasse, createEvaluation,
  updateEvaluation, deleteEvaluation,
  getEpreuves, createEpreuve, updateEpreuve, deleteEpreuve,
  getNaturesEpreuve, getSessionsActives,
  createSession, updateSession, deleteSession, getTrimestres, createTrimestre, getSessions, updateTrimestre, deleteTrimestre,
} from '../../services/evaluationService'
import { getCours, getMesCours, getElevesParCours } from '../../services/coursService'
import { getStudents } from '../../services/studentService'

import { filterDeleted } from '../../services/deleteConfig'
import { getDisciplines } from '../../services/reportService'
import { useAuth } from '../../context/AuthContext'
import { useYear } from '../../context/YearContext'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────
const NOTE_COLOR = (n) => {
  if (n >= 16) return 'text-emerald-600 bg-emerald-50'
  if (n >= 12) return 'text-blue-600 bg-blue-50'
  if (n >= 10) return 'text-amber-600 bg-amber-50'
  return 'text-red-600 bg-red-50'
}

// ── Onglet : Saisie & liste des notes ─────────────────────────────
function NotesTab({ user, cours, sessions }) {
  const isAdmin   = user?.typeAdmin !== undefined
  const isTeacher = user?.typePersonne === 1

  const [evaluations, setEvaluations] = useState([])
  const [eleves,      setEleves]      = useState([])
  const [epreuves,    setEpreuves]    = useState([])
  const [disciplines, setDisciplines] = useState([])
  const [loading,     setLoading]     = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [editId,      setEditId]      = useState(null)
  const [filters, setFilters] = useState({
    idCours: '', idSession: '', matricule: '',
  })
  const [form, setForm] = useState({
    note: '', appreciation: '', matricule: '',
    idEpreuve: '', idCours: '', idSession: '', idDiscipline: '',
  })

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Charger les épreuves selon le cours sélectionné
  useEffect(() => {
    if (!filters.idCours) { setEpreuves([]); return }
    getEpreuves({ idPers: user?.idPers })
      .then(({ data }) => setEpreuves(filterDeleted(data.epreuves || data.data || [])))
      .catch(() => {})
    getDisciplines()
      .then(({ data }) => setDisciplines(data.disciplines || data.data || []))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.idCours])

  // Charger les élèves si cours sélectionné
  useEffect(() => {
    if (!filters.idCours) { setEleves([]); return }
    getElevesParCours({ idCours: filters.idCours })
      .then(({ data }) => setEleves(data.eleves || data.data || []))
      .catch(() => getStudents({}).then(({ data }) => setEleves(data.data || [])))
  }, [filters.idCours])

  // Charger les évaluations
  const fetchEvals = useCallback(async () => {
    if (!filters.idCours) return
    setLoading(true)
    try {
      const fn = (isTeacher || isAdmin) && !filters.matricule
        ? getEvaluationsClasse
        : getEvaluations
      const { data } = await fn(filters)
      setEvaluations(filterDeleted(data.evaluations || data.data || []))
    } catch { toast.error('Erreur chargement notes.') }
    finally { setLoading(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.idCours])

  useEffect(() => { fetchEvals() }, [fetchEvals, filters.idCours, filters.idSession, filters.matricule])

  // Submit note
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.note || !form.matricule || !form.idCours)
      return toast.error('Note, élève et cours sont requis.')
    try {
      if (editId) {
        await updateEvaluation(editId, {
          note: form.note,
          appreciation: form.appreciation,
          // La discipline peut modifier la note selon les règles métier du backend
          ...(form.idDiscipline && { idDiscipline: form.idDiscipline }),
        })
        toast.success('Note mise à jour !')
      } else {
        await createEvaluation(form)
        toast.success('Note saisie !')
      }
      setShowForm(false); setEditId(null)
      setForm({ note:'', appreciation:'', matricule:'', idEpreuve:'', idCours:'', idSession:'', idDiscipline:'' })
      fetchEvals()
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const handleEdit = (ev) => {
    setEditId(ev.idEval)
    setForm({ note: ev.note, appreciation: ev.appreciation || '',
      matricule: ev.matricule, idEpreuve: ev.idEpreuve,
      idCours: ev.idCours, idSession: ev.idSession, idDiscipline: '' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette note ?')) return
    try {
      await deleteEvaluation(id)
      toast.success('Note supprimée.')
      fetchEvals()
    } catch { toast.error('Erreur suppression.') }
  }

  return (
    <div className="space-y-5">
      {/* Filtres */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Filtres
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Cours *</label>
            <select value={filters.idCours} onChange={e => setF('idCours', e.target.value)}
              className="select-field">
              <option value="">— Sélectionner un cours —</option>
              {cours.map(c => (
                <option key={c.idCours} value={c.idCours}>{c.libelle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Session</label>
            <select value={filters.idSession} onChange={e => setF('idSession', e.target.value)}
              className="select-field">
              <option value="">Toutes les sessions</option>
              {sessions.map(s => (
                <option key={s.idSession} value={s.idSession}>
                  {s.libelle}{s.date_passage ? ` — ${new Date(s.date_passage).toLocaleDateString('fr-FR')}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Élève (optionnel)</label>
            <select value={filters.matricule} onChange={e => setF('matricule', e.target.value)}
              className="select-field">
              <option value="">Toute la classe</option>
              {eleves.map(el => (
                <option key={el.matricule} value={el.matricule}>
                  {el.prenom} {el.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bouton saisir */}
      {(isTeacher || isAdmin) && filters.idCours && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{evaluations.length} note(s)</p>
          <button onClick={() => {
            setShowForm(v => !v); setEditId(null)
            setForm({ note:'', appreciation:'', matricule:'',
              idEpreuve:'', idCours: filters.idCours, idSession: filters.idSession })
          }} className="btn-primary">
            <Plus size={15} /> Saisir une note
          </button>
        </div>
      )}

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 border-l-4 border-primary-400">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {editId ? 'Modifier la note' : 'Nouvelle note'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {!editId && (
              <>
                <div>
                  <label className="form-label">Élève *</label>
                  <select value={form.matricule} onChange={e => set('matricule', e.target.value)}
                    className="select-field">
                    <option value="">— Choisir —</option>
                    {eleves.map(el => (
                      <option key={el.matricule} value={el.matricule}>
                        {el.prenom} {el.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Épreuve *</label>
                  <select value={form.idEpreuve} onChange={e => set('idEpreuve', e.target.value)}
                    className="select-field">
                    <option value="">— Choisir —</option>
                    {epreuves.map(ep => (
                      <option key={ep.idEpreuve} value={ep.idEpreuve}>{ep.libelle}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Session *</label>
                  <select value={form.idSession} onChange={e => set('idSession', e.target.value)}
                    className="select-field">
                    <option value="">— Choisir —</option>
                    {sessions.map(s => (
                      <option key={s.idSession} value={s.idSession}>
                        {s.libelle}{s.date_passage ? ` — ${new Date(s.date_passage).toLocaleDateString('fr-FR')}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="form-label">Note /20 *</label>
              <input type="number" min="0" max="20" step="0.5"
                value={form.note} onChange={e => set('note', e.target.value)}
                placeholder="Ex: 14.5" className="input-field" />
            </div>
            {editId && disciplines.length > 0 && (
              <div>
                <label className="form-label">Discipline associée</label>
                <select value={form.idDiscipline}
                  onChange={e => set('idDiscipline', e.target.value)}
                  className="select-field">
                  <option value="">— Aucune —</option>
                  {disciplines.map(d => (
                    <option key={d.ID} value={d.ID}>
                      {d.libelle} ({d.points > 0 ? '-' : ''}{d.points} pts)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-amber-600 mt-1">
                  Une discipline peut affecter la note selon les règles définies
                </p>
              </div>
            )}
            <div className={editId ? 'sm:col-span-2' : 'sm:col-span-2 md:col-span-2'}>
              <label className="form-label">Appréciation</label>
              <input value={form.appreciation} onChange={e => set('appreciation', e.target.value)}
                placeholder="Ex: Bon travail, peut mieux faire..." className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">
              {editId ? 'Mettre à jour' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
              className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      {/* Table notes */}
      {!filters.idCours ? (
        <div className="card py-14 text-center">
          <BookOpen size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Sélectionnez un cours pour voir les notes.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-4 flex-1 rounded" />
                  <div className="skeleton h-4 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : evaluations.length === 0 ? (
            <div className="py-12 text-center">
              <Star size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Aucune note pour ces filtres.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Élève', 'Cours', 'Épreuve', 'Note /20', 'Appréciation', 'Actions'].map(h => (
                    <th key={h} className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {evaluations.map(ev => (
                  <tr key={ev.idEval} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">
                        {ev.student_prenom || ev.student_nom ? `${ev.student_prenom || ''} ${ev.student_nom || ''}`.trim() : 'Élève inconnu'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{ev.libelleCours || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="badge bg-gray-100 text-gray-600">
                        {ev.libelleEpreuve || ev.libelleNature || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center justify-center w-12 h-8
                        rounded-lg text-sm font-bold ${NOTE_COLOR(ev.note)}`}>
                        {Number(ev.note).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs max-w-xs truncate">
                      {ev.appreciation || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {(isTeacher || isAdmin) && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEdit(ev)} className="btn-icon">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(ev.idEval)}
                            className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ── Onglet : Épreuves ─────────────────────────────────────────────
function EpreuvesTab({ user, natures }) {
  const [epreuves,  setEpreuves]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showForm,  setShowForm]  = useState(false)
  const [editId,    setEditId]    = useState(null)
  const [file,      setFile]      = useState(null)
  const [form, setForm] = useState({ libelle: '', auteur: '', idNature: '' })

  const fetch = useCallback(() => {
    setLoading(true)
    getEpreuves({ idPers: user?.idPers })
      .then(({ data }) => setEpreuves(filterDeleted(data.epreuves || data.data || [])))
      .catch(() => toast.error('Erreur chargement épreuves.'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.libelle || !form.idNature) return toast.error('Libellé et type requis.')
    
    const formData = new FormData()
    formData.append('libelle', form.libelle)
    formData.append('auteur', form.auteur)
    formData.append('idNature', form.idNature)
    if (file) formData.append('document', file)

    try {
      if (editId) {
        await updateEpreuve(editId, formData)
        toast.success('Épreuve mise à jour !')
      } else {
        await createEpreuve(formData)
        toast.success('Épreuve publiée !')
      }
      setShowForm(false)
      setEditId(null)
      setForm({ libelle: '', auteur: '', idNature: '' })
      setFile(null)
      fetch()
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const handleEdit = (ep) => {
    setEditId(ep.idEpreuve)
    setForm({ libelle: ep.libelle, auteur: ep.auteur || '', idNature: ep.idNature || '' })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette épreuve ?')) return
    try {
      await deleteEpreuve(id)
      toast.success('Épreuve supprimée !')
      fetch()
    } catch { toast.error('Erreur suppression.') }
  }

  const getDocUrl = (url) => {
    if (!url || url === 'INDEFINI') return null
    if (url.startsWith('http')) return url
    return `${import.meta.env.VITE_API_URL.replace('/api', '')}${url}`
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{epreuves.length} épreuve(s)</p>
        <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm({ libelle: '', auteur: '', idNature: '' }) }} className="btn-primary">
          <Plus size={15} /> Publier une épreuve
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 border-l-4 border-amber-400">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {editId ? 'Modifier l\'épreuve' : 'Nouvelle épreuve'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Libellé *</label>
              <input value={form.libelle}
                onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
                placeholder="Ex: Contrôle de maths T1" className="input-field" />
            </div>
            <div>
              <label className="form-label">Type d'épreuve</label>
              <select value={form.idNature}
                onChange={e => setForm(f => ({ ...f, idNature: e.target.value }))}
                className="select-field">
                <option value="">— Choisir —</option>
                {natures.map(n => (
                  <option key={n.idNature} value={n.idNature}>{n.libelle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Auteur</label>
              <input value={form.auteur}
                onChange={e => setForm(f => ({ ...f, auteur: e.target.value }))}
                placeholder="Nom de l'auteur" className="input-field" />
            </div>
            <div>
              <label className="form-label">Fichier (Optionnel)</label>
              <input type="file" 
                onChange={e => setFile(e.target.files[0])}
                className="input-field p-1" />
              <p className="text-[10px] text-gray-400 mt-1">PDF, Word, Images (Max 20MB)</p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">{editId ? 'Mettre à jour' : 'Publier'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}
          </div>
        ) : epreuves.length === 0 ? (
          <div className="py-12 text-center">
            <FileText size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aucune épreuve publiée.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Épreuve', 'Type', 'Auteur', 'Document', 'Actions'].map(h => (
                  <th key={h} className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {epreuves.map(ep => (
                <tr key={ep.idEpreuve} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-gray-900">{ep.libelle}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="badge bg-blue-50 text-blue-700">
                      {ep.libelleNature || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{ep.auteur || '—'}</td>
                  <td className="px-5 py-3.5">
                    {getDocUrl(ep.urlDoc) ? (
                      <a href={getDocUrl(ep.urlDoc)} target="_blank" rel="noreferrer"
                        className="text-primary-500 text-xs hover:underline flex items-center gap-1">
                        <FileText size={12} /> Voir / Télécharger
                      </a>
                    ) : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(ep)} className="btn-icon">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(ep.idEpreuve)}
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

// ── Onglet : Sessions & Trimestres ────────────────────────────────
function SessionsTab({ sessions, setSessions, trimestres, setTrimestres, selectedYear }) {
  const [showForm, setShowForm] = useState(false)
  const [editIdSession, setEditIdSession] = useState(null)
  const [form, setForm] = useState({
    libelle: '', description: '', idTrimestre: '', date_passage: '',
  })

  const [showFormTrim, setShowFormTrim] = useState(false)
  const [editIdTrim, setEditIdTrim] = useState(null)
  const [formTrim, setFormTrim] = useState({
    libelle: '', periode: ''
  })

  // SESSIONS
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.libelle || !form.idTrimestre) return toast.error('Libellé et trimestre requis.')
    try {
      if (editIdSession) {
        await updateSession(editIdSession, form)
        toast.success('Session modifiée !')
      } else {
        await createSession(form)
        toast.success('Session créée !')
      }
      setShowForm(false)
      setEditIdSession(null)
      setForm({ libelle: '', description: '', idTrimestre: '', date_passage: '' })
      const { data } = await getSessionsActives()
      setSessions(data.sessions || data.data || [])
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const handleEditSession = (s) => {
    setEditIdSession(s.idSession)
    setForm({ libelle: s.libelle, description: s.description || '', idTrimestre: s.idTrimestre || '', date_passage: s.date_passage ? s.date_passage.split('T')[0] : '' })
    setShowForm(true)
  }

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Supprimer cette session ?')) return
    try {
      await deleteSession(id)
      toast.success('Session supprimée !')
      const { data } = await getSessionsActives()
      setSessions(data.sessions || data.data || [])
    } catch { toast.error('Erreur suppression.') }
  }

  // TRIMESTRES
  const handleSubmitTrim = async (e) => {
    e.preventDefault()
    if (!formTrim.libelle) return toast.error('Libellé requis.')
    try {
      const payload = { ...formTrim, idAca: selectedYear?.idAnnee }
      if (editIdTrim) {
        await updateTrimestre(editIdTrim, payload)
        toast.success('Trimestre modifié !')
      } else {
        await createTrimestre(payload)
        toast.success('Trimestre créé !')
      }
      setShowFormTrim(false)
      setEditIdTrim(null)
      setFormTrim({ libelle: '', periode: '' })
      const { data } = await getTrimestres({ idAca: selectedYear?.idAnnee })
      setTrimestres(data.trimestres || data.data || [])
    } catch (err) { toast.error(err.message || 'Erreur.') }
  }

  const handleEditTrim = (t) => {
    setEditIdTrim(t.idTrimes)
    setFormTrim({ libelle: t.libelle, periode: t.periode || '' })
    setShowFormTrim(true)
  }

  const handleDeleteTrim = async (id) => {
    if (!window.confirm('Supprimer ce trimestre ?')) return
    try {
      await deleteTrimestre(id)
      toast.success('Trimestre supprimé !')
      const { data } = await getTrimestres({ idAca: selectedYear?.idAnnee })
      setTrimestres(data.trimestres || data.data || [])
    } catch { toast.error('Erreur suppression.') }
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : null

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{sessions.length} session(s) | {trimestres.length} trimestre(s)</p>
        <div className="flex gap-2">
          <button onClick={() => { setShowFormTrim(v => !v); setEditIdTrim(null); setFormTrim({ libelle: '', periode: '' }) }} className="btn-secondary">
            <Plus size={15} /> Trimestre
          </button>
          <button onClick={() => { setShowForm(v => !v); setEditIdSession(null); setForm({ libelle: '', description: '', idTrimestre: '', date_passage: '' }) }} className="btn-primary">
            <Plus size={15} /> Session
          </button>
        </div>
      </div>

      {showFormTrim && (
        <form onSubmit={handleSubmitTrim} className="card p-5 border-l-4 border-indigo-400">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {editIdTrim ? 'Modifier le trimestre' : 'Nouveau trimestre'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Libellé *</label>
              <input value={formTrim.libelle}
                onChange={e => setFormTrim(f => ({ ...f, libelle: e.target.value }))}
                placeholder="Ex: Trimestre 1" className="input-field" />
            </div>
            <div>
              <label className="form-label">Période (optionnel)</label>
              <input value={formTrim.periode}
                onChange={e => setFormTrim(f => ({ ...f, periode: e.target.value }))}
                placeholder="Ex: Sep - Dec" className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">{editIdTrim ? 'Mettre à jour' : 'Créer'}</button>
            <button type="button" onClick={() => { setShowFormTrim(false); setEditIdTrim(null) }} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 border-l-4 border-emerald-400">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {editIdSession ? 'Modifier la session' : 'Nouvelle session'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Libellé *</label>
              <input value={form.libelle}
                onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
                placeholder="Ex: Session 1 — Janvier" className="input-field" />
            </div>
            <div>
              <label className="form-label">Trimestre *</label>
              <select value={form.idTrimestre}
                onChange={e => setForm(f => ({ ...f, idTrimestre: e.target.value }))}
                className="select-field">
                <option value="">— Choisir —</option>
                {trimestres.map(t => (
                  <option key={t.idTrimes} value={t.idTrimes}>{t.libelle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Date de passage</label>
              <input
                type="date"
                value={form.date_passage}
                onChange={e => setForm(f => ({ ...f, date_passage: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description optionnelle" className="input-field" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary">{editIdSession ? 'Mettre à jour' : 'Créer'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditIdSession(null) }} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Trimestres */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Trimestres
          </h3>
          {trimestres.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Aucun trimestre.</p>
          ) : (
            <div className="space-y-2">
              {trimestres.map((t, i) => (
                <div key={t.idTrimes}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center
                      justify-center text-primary-600 text-xs font-bold shrink-0">
                      T{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{t.libelle}</p>
                      <p className="text-xs text-gray-400">{t.periode}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditTrim(t)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeleteTrim(t.idTrimes)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions */}
        <div className="card p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Sessions actives
          </h3>
          {sessions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Aucune session.</p>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.idSession}
                  className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.libelle}</p>
                      {s.description && (
                        <p className="text-xs text-gray-400 truncate">{s.description}</p>
                      )}
                      {s.date_passage && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-xs text-primary-600 font-medium">
                            📅 Passage : {fmtDate(s.date_passage)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => handleEditSession(s)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDeleteSession(s.idSession)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function EvaluationPage() {
  const { user } = useAuth()
  const { selectedYear } = useYear()
  const [tab,        setTab]        = useState('notes')
  const [cours,      setCours]      = useState([])
  const [sessions,   setSessions]   = useState([])
  const [trimestres, setTrimestres] = useState([])
  const [natures,    setNatures]    = useState([])

  useEffect(() => {
    const isTeacher = user?.typePersonne === 1;
    Promise.all([
      isTeacher ? getMesCours() : getCours({}),
      getSessionsActives(),
      getNaturesEpreuve(),
    ]).then(([c, s, n]) => {
      setCours(filterDeleted(c.data.cours    || c.data.data    || []))
      setSessions(s.data.sessions || s.data.data || [])
      setNatures(n.data.natures   || n.data.data  || [])
    }).catch(() => toast.error('Erreur chargement données.'))

    // Trimestres (nécessite idAca)
    getTrimestres({ idAca: selectedYear?.idAnnee })
      .then(({ data }) => setTrimestres(data.trimestres || data.data || []))
      .catch(() => {})
  }, [selectedYear])

  const TABS = [
    { key: 'notes',    label: 'Notes',              icon: Star },
    { key: 'epreuves', label: 'Épreuves',           icon: FileText },
    { key: 'sessions', label: 'Sessions & Trimestres', icon: BookOpen },
  ]

  return (
    <div className="page-container">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-gray-900">
          Évaluations & Notes
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Gestion des notes, épreuves et sessions d'évaluation
        </p>
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

      {tab === 'notes' && (
        <NotesTab user={user} cours={cours} sessions={sessions} natures={natures} />
      )}
      {tab === 'epreuves' && (
        <EpreuvesTab user={user} natures={natures} />
      )}
      {tab === 'sessions' && (
        <SessionsTab
          sessions={sessions} setSessions={setSessions}
          trimestres={trimestres} setTrimestres={setTrimestres}
          selectedYear={selectedYear}
        />
      )}
    </div>
  )
}