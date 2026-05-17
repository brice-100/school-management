import { useState, useEffect } from 'react'
import { Plus, X, Clock, Calendar } from 'lucide-react'
import {
  getPlanningByClasse, getPlanningFormData,
  createPlanning, deletePlanning, restorePlanning, getMyPlanning,
} from '../../services/planningService'
import { useAuth } from '../../context/AuthContext'
import { useYear } from '../../context/YearContext'
import toast       from 'react-hot-toast'

const JOURS  = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
const HEURES = [
  '07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30','18:00',
]
const PALETTE = [
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-orange-100 text-orange-800 border-orange-200',
]

export default function PlanningView() {
  const { user }  = useAuth()
  const { selectedYear } = useYear()
  const isAdmin   = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'

  const [planning,  setPlanning]  = useState([])
  const [classes,   setClasses]   = useState([])
  const [matieres,  setMatieres]  = useState([])
  const [teachers,  setTeachers]  = useState([])
  const [salles,    setSalles]    = useState([])
  const [classeId,  setClasseId]  = useState('')
  const [showForm,  setShowForm]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [formReady, setFormReady] = useState(false)
  const [showArchives, setShowArchives] = useState(false)

  // IMPORTANT : stocker les IDs comme strings pour les selects
  // mais les envoyer comme entiers à l'API
  const [form, setForm] = useState({
    classe_id:   '',
    matiere_id:  '',
    teacher_id:  '',
    salle_id:    '',
    jour:        'Lundi',
    heure_debut: '08:00',
    heure_fin:   '09:00',
  })

  // Charger classes + matières + enseignants
  useEffect(() => {
    if (!isAdmin) return
    getPlanningFormData()
      .then(({ data }) => {
        const d = data.data
        setClasses(d.classes   || [])
        setMatieres(d.matieres || [])
        setTeachers(d.teachers || [])
        setSalles(d.salles || [])
        setFormReady(true)
        console.log('Form data:', d) // debug
      })
      .catch(err => {
        console.error('Erreur form-data:', err)
        toast.error('Erreur chargement données formulaire.')
      })
  }, [isAdmin])

  const fetchPlanning = async () => {
    setLoading(true)
    try {
      const pAca = { 
        idAnnee: selectedYear?.idAnnee,
        archives: showArchives ? 1 : 0
      }
      if (isTeacher) {
        const { data } = await getMyPlanning(pAca)
        setPlanning(data.data || [])
      } else if (classeId) {
        const { data } = await getPlanningByClasse(classeId, pAca)
        setPlanning(data.data || [])
      } else {
        setPlanning([])
      }
    } catch (err) {
      console.error(err)
      toast.error('Erreur chargement planning.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlanning() }, [classeId, selectedYear, showArchives])
  useEffect(() => { if (isTeacher) fetchPlanning() }, [isTeacher, selectedYear, showArchives])

  const handleCreate = async (e) => {
    e.preventDefault()

    if (!form.classe_id)  return toast.error('Veuillez choisir une classe.')
    if (!form.matiere_id) return toast.error('Veuillez choisir une matière.')
    if (!form.teacher_id) return toast.error('Veuillez choisir un enseignant.')
    if (form.heure_debut >= form.heure_fin)
      return toast.error("L'heure de fin doit être après l'heure de début.")

    // Convertir explicitement en entiers avant envoi
    const payload = {
      classe_id:   parseInt(form.classe_id,  10),
      matiere_id:  parseInt(form.matiere_id, 10),
      teacher_id:  parseInt(form.teacher_id, 10),
      salle_id:    form.salle_id ? parseInt(form.salle_id, 10) : null,
      jour:        form.jour,
      heure_debut: form.heure_debut,
      heure_fin:   form.heure_fin,
      idAnnee:     selectedYear?.idAnnee
    };

    console.log('Payload envoyé:', payload) // debug

    try {
      await createPlanning(payload)
      toast.success('Créneau ajouté !')
      setShowForm(false)
      setClasseId(String(payload.classe_id))
      setForm(f => ({ ...f, matiere_id: '', teacher_id: '' }))
      fetchPlanning()
    } catch (err) {
      toast.error(err.message || 'Erreur création.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Archiver ce créneau ?')) return
    try {
      await deletePlanning(id)
      toast.success('Créneau archivé.')
      fetchPlanning()
    } catch { toast.error('Erreur archivage.') }
  }

  const handleRestore = async (id) => {
    if (!window.confirm('Restaurer ce créneau ?')) return
    try {
      await restorePlanning(id)
      toast.success('Créneau restauré.')
      fetchPlanning()
    } catch { toast.error('Erreur restauration.') }
  }

  const matiereColor = (nom) => {
    const idx = matieres.findIndex(m => m.nom === nom)
    return PALETTE[Math.max(0, idx) % PALETTE.length]
  }

  const creneauxDuJour = (jour) =>
    [...planning]
      .filter(p => p.jour === jour)
      .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))

  // Labels pour le résumé
  const selectedClasse  = classes.find(c => c.id === parseInt(form.classe_id))
  const selectedMatiere = matieres.find(m => m.id === parseInt(form.matiere_id))

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Planning</h1>
          <p className="text-gray-500 text-sm mt-0.5">Emploi du temps hebdomadaire</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(v => !v)} className="btn-primary">
            <Plus size={16} /> Ajouter un créneau
          </button>
        )}
      </div>

      {/* Sélecteur de classe */}
      {isAdmin && (
        <div className="flex gap-3 mb-5">
          <select
            value={classeId}
            onChange={e => setClasseId(e.target.value)}
            className="select-field w-52"
          >
            <option value="">— Choisir une classe —</option>
            {classes.map(c => (
              <option key={c.id} value={String(c.id)}>{c.nom}</option>
            ))}
          </select>
          <button onClick={() => setShowArchives(!showArchives)} 
            className={`btn-secondary text-xs ${showArchives ? 'bg-red-50 text-red-600 border-red-200' : ''}`}>
            {showArchives ? 'Créneaux supprimés' : 'Archives'}
          </button>
          {classeId && (
            <span className="flex items-center text-sm text-gray-400">
              {planning.length} créneau(x)
            </span>
          )}
        </div>
      )}

      {/* Formulaire ajout */}
      {showForm && isAdmin && (
        <form onSubmit={handleCreate} className="card p-5 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Nouveau créneau
          </h2>

          {!formReady ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Chargement des données...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                {/* Classe */}
                <div>
                  <label className="form-label">Classe *</label>
                  <select
                    value={form.classe_id}
                    onChange={e => setForm(f => ({ ...f, classe_id: e.target.value }))}
                    className="select-field"
                  >
                    <option value="">— Choisir —</option>
                    {classes.map(c => (
                      <option key={c.id} value={String(c.id)}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Matière — value = String(id), pas le nom */}
                <div>
                  <label className="form-label">
                    Matière *
                    {matieres.length === 0 && (
                      <span className="text-red-400 text-xs ml-1">(aucune)</span>
                    )}
                  </label>
                  <select
                    value={form.matiere_id}
                    onChange={e => setForm(f => ({ ...f, matiere_id: e.target.value }))}
                    className="select-field"
                    disabled={matieres.length === 0}
                  >
                    <option value="">— Choisir —</option>
                    {matieres.map(m => (
                      <option key={m.id} value={String(m.id)}>{m.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Enseignant — value = String(id) */}
                <div>
                  <label className="form-label">
                    Enseignant *
                    {teachers.length === 0 && (
                      <span className="text-red-400 text-xs ml-1">(aucun actif)</span>
                    )}
                  </label>
                  <select
                    value={form.teacher_id}
                    onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}
                    className="select-field"
                    disabled={teachers.length === 0}
                  >
                    <option value="">— Choisir —</option>
                    {teachers.map(t => (
                      <option key={t.id} value={String(t.id)}>
                        {t.prenom} {t.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Salle */}
                <div>
                  <label className="form-label">Salle</label>
                  <select
                    value={form.salle_id}
                    onChange={e => setForm(f => ({ ...f, salle_id: e.target.value }))}
                    className="select-field"
                  >
                    <option value="">— Choisir une salle —</option>
                    {salles.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Jour */}
                <div>
                  <label className="form-label">Jour *</label>
                  <select
                    value={form.jour}
                    onChange={e => setForm(f => ({ ...f, jour: e.target.value }))}
                    className="select-field"
                  >
                    {JOURS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>

                {/* Heure début */}
                <div>
                  <label className="form-label">Heure début *</label>
                  <select
                    value={form.heure_debut}
                    onChange={e => setForm(f => ({ ...f, heure_debut: e.target.value }))}
                    className="select-field"
                  >
                    {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                {/* Heure fin */}
                <div>
                  <label className="form-label">Heure fin *</label>
                  <select
                    value={form.heure_fin}
                    onChange={e => setForm(f => ({ ...f, heure_fin: e.target.value }))}
                    className="select-field"
                  >
                    {HEURES.filter(h => h > form.heure_debut).map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Résumé */}
              {form.classe_id && form.matiere_id && (
                <div className="mt-3 p-3 bg-blue-50 rounded-xl text-xs text-blue-700">
                  <strong>Résumé :</strong>{' '}
                  {selectedMatiere?.nom || '—'} — {form.jour}{' '}
                  de {form.heure_debut} à {form.heure_fin}{' '}
                  en {selectedClasse?.nom || '—'}
                </div>
              )}

              {matieres.length === 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  ⚠️ Aucune matière enregistrée. Ajoutez des matières dans{' '}
                  <strong>Classes → Matières</strong> avant de créer un planning.
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn-primary"
                  disabled={!form.classe_id || !form.matiere_id || !form.teacher_id}>
                  Ajouter
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="btn-secondary">
                  Annuler
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* Grille calendrier */}
      {(classeId || isTeacher) ? (
        loading ? (
          <div className="card p-10 text-center text-gray-400 text-sm">Chargement...</div>
        ) : (
          <div className="card overflow-x-auto">
            <div className="grid grid-cols-5 divide-x divide-gray-100 min-w-[700px]">
              {JOURS.map(jour => (
                <div key={jour} className="min-h-80">
                  <div className="bg-primary-500 text-white text-center py-3 text-sm font-semibold">
                    {jour}
                  </div>
                  <div className="p-2 space-y-2">
                    {creneauxDuJour(jour).length === 0 ? (
                      <p className="text-center text-gray-300 text-xs py-8">—</p>
                    ) : (
                      creneauxDuJour(jour).map(c => (
                        <div key={c.id}
                          className={`rounded-xl border p-2.5 relative group ${c.isDeleted ? 'border-red-300 bg-red-50 text-red-800' : matiereColor(c.matiere_nom)}`}>
                          <p className="font-semibold text-xs leading-tight mb-1">
                            {c.matiere_nom} {c.isDeleted && '(Archivé)'}
                          </p>
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            <span className="text-xs opacity-80">
                              {c.heure_debut?.slice(0,5)} – {c.heure_fin?.slice(0,5)}
                            </span>
                          </div>
                          {!isTeacher && (
                            <p className="text-xs opacity-60 mt-0.5 truncate">
                              {c.teacher_prenom} {c.teacher_nom}
                            </p>
                          )}
                          {c.salle_nom && (
                            <p className="text-[10px] font-bold mt-1 bg-white/20 px-1.5 py-0.5 rounded inline-block">
                              📍 {c.salle_nom}
                            </p>
                          )}
                          {isAdmin && (
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1">
                              {c.isDeleted ? (
                                <button onClick={() => handleRestore(c.id)}
                                  className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm"
                                  title="Restaurer">
                                  <Plus size={10} />
                                </button>
                              ) : (
                                <button onClick={() => handleDelete(c.id)}
                                  className="w-5 h-5 rounded-full bg-white/70 hover:bg-red-100 flex items-center justify-center transition-all">
                                  <X size={10} className="text-red-600" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="card p-14 text-center">
          <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {isAdmin
              ? 'Sélectionnez une classe pour afficher son planning.'
              : 'Aucun planning disponible.'}
          </p>
        </div>
      )}
    </div>
  )
}