import { useState, useEffect, useRef } from 'react'
import { Plus, Check, CheckSquare, Trash2, RefreshCw } from 'lucide-react'
import {
  getGrades, createGrade, updateGrade, validerGrades,
  deleteGrade, restoreGrade, destroyGrade, getGradeFormData,
} from '../../services/gradeService'
import { getClasses }  from '../../services/classService'
import { getMatieres } from '../../services/matiereService'
import { getStudents } from '../../services/studentService'
import { filterDeleted } from '../../services/deleteConfig'
import { useAuth }     from '../../context/AuthContext'
import { useYear }     from '../../context/YearContext'
import toast           from 'react-hot-toast'

const TRIMESTRES = [1, 2, 3]

export default function GradeList() {
  const { user }  = useAuth()
  const { selectedYear } = useYear()
  const isAdmin   = user?.role === 'admin'
  const isTeacher = user?.role === 'teacher'

  const [grades,   setGrades]   = useState([])
  const [classes,  setClasses]  = useState([])
  const [matieres, setMatieres] = useState([])
  const [students, setStudents] = useState([])
  const [epreuves, setEpreuves] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [showArchives, setShowArchives] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)

  const [filters, setFilters] = useState({
    classe_id: '', matiere_id: '', trimestre: '1',
  })
  const [form, setForm] = useState({
    student_id: '', matiere_id: '', valeur: '',
    trimestre: '1', commentaire: '',
    idEpreuve: '', idSession: '',
  })
  // Classe choisie dans le formulaire de saisie (filtre logique enseignant)
  const [selectedFormClass, setSelectedFormClass] = useState('')

  // ── Charger les données selon le rôle ──────────────────────────
  useEffect(() => {
    if (isTeacher) {
      setFormLoading(true)
      getGradeFormData()
        .then(({ data }) => {
          const d = data.data
          setStudents(d.students || [])
          setMatieres(d.matieres || [])
          setEpreuves(d.epreuves || [])
          setSessions(d.sessions || [])
          console.log('[GradeFormData]', d) // debug
        })
        .catch(err => {
          console.error('[GradeFormData ERROR]', err)
          // Fallback : charger tous les élèves et matières
          Promise.all([
            getStudents({}),
            getMatieres(),
          ]).then(([s, m]) => {
            setStudents(s.data.data || [])
            setMatieres(m.data.data || [])
          })
        })
        .finally(() => setFormLoading(false))
    }

    if (isAdmin) {
      Promise.all([getClasses(), getMatieres()])
        .then(([c, m]) => {
          setClasses(c.data.data  || [])
          setMatieres(m.data.data || [])
        })
        .catch(() => toast.error('Erreur chargement filtres.'))
    }
  }, [isTeacher, isAdmin])

  // ── Charger les notes ──────────────────────────────────────────
  const fetchGrades = async () => {
    setLoading(true)
    try {
      const params = {
        ...filters,
        // Envoyer idAnnee (entier) — le backend le résout aussi depuis annee_scolaire si besoin
        idAnnee: selectedYear?.idAnnee || '',
        annee_scolaire: selectedYear?.libelle || '',
        archives: showArchives ? 1 : 0,
      }
      const { data } = await getGrades(params)
      setGrades(data.data || [])
    } catch (err) {
      console.error('[Grades ERROR]', err)
      toast.error('Erreur chargement notes.')
    } finally {
      setLoading(false)
    }
  }

  // Recharger quand les filtres, l'année ou le mode archives changent
  useEffect(() => { fetchGrades() }, [filters, showArchives, selectedYear])

  // Auto-refresh toutes les 30s pour l'admin (voir les nouvelles notes des enseignants)
  const refreshIntervalRef = useRef(null)
  useEffect(() => {
    if (isAdmin) {
      refreshIntervalRef.current = setInterval(() => {
        fetchGrades()
      }, 30000)
    }
    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filters, showArchives, selectedYear])

  // Grouper les notes par classe
  const groupedGrades = grades.reduce((acc, g) => {
    const cName = g.classe_nom || 'Non assigné';
    if (!acc[cName]) acc[cName] = [];
    acc[cName].push(g);
    return acc;
  }, {});

  const classOrder = [
    'Toute petite section', 'Petite section', 'Moyenne section', 'Grande section',
    'SIL', 'CP', 'CE1', 'CE2', 'CM1', 'CM2',
    '6eme', '5eme', '4eme', '3eme', '2nde', '1ere', 'Terminale'
  ];

  const getSortIndex = (className) => {
    if (!className) return 999;
    const name = className.toLowerCase().trim();
    const index = classOrder.findIndex(c => name.includes(c.toLowerCase()));
    return index === -1 ? 999 : index;
  };

  const sortedClassNames = Object.keys(groupedGrades).sort((a, b) => {
    const idxA = getSortIndex(a);
    const idxB = getSortIndex(b);
    if (idxA !== idxB) return idxA - idxB;
    return a.localeCompare(b);
  });

  // ── Saisir une note ────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.student_id) return toast.error('Sélectionnez un élève.')
    if (!form.matiere_id) return toast.error('Sélectionnez une matière.')
    if (!form.valeur)     return toast.error('Saisissez une note.')
    const v = parseFloat(form.valeur)
    if (isNaN(v) || v < 0 || v > 20)
      return toast.error('La note doit être entre 0 et 20.')

    try {
      const payload = {
        student_id:    form.student_id,
        matiere_id:    parseInt(form.matiere_id, 10),
        valeur:        v,
        trimestre:     parseInt(form.trimestre, 10),
        commentaire:   form.commentaire || null,
        idAnnee:       selectedYear?.idAnnee || null,
        annee_scolaire: selectedYear?.libelle || null,
        idEpreuve:     form.idEpreuve ? parseInt(form.idEpreuve, 10) : undefined,
        idSession:     form.idSession ? parseInt(form.idSession, 10) : undefined,
      }

      if (editingId) {
        await updateGrade(editingId, payload)
        toast.success('Note modifiée !')
      } else {
        await createGrade(payload)
        toast.success('Note enregistrée !')
      }

      setShowForm(false)
      setEditingId(null)
      setSelectedFormClass('')
      setForm({ student_id: '', matiere_id: '', valeur: '', trimestre: '1', commentaire: '', idEpreuve: '', idSession: '' })
      fetchGrades()
    } catch (err) {
      toast.error(err.message || 'Erreur enregistrement.')
    }
  }

  const handleEdit = (g) => {
    setEditingId(g.id)
    // Retrouver la classe de l'élève depuis la liste des élèves chargés
    const studentEntry = students.find(s => String(s.matricule || s.id) === String(g.matricule || ''))
    if (studentEntry?.idClasse) setSelectedFormClass(String(studentEntry.idClasse))
    setForm({
      student_id:  String(g.matricule || ''),
      matiere_id:  String(g.idCours || ''),
      valeur:      String(g.valeur),
      trimestre:   String(filters.trimestre),
      commentaire: g.commentaire || '',
      idEpreuve:   '',
      idSession:   '',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Valider (admin) ────────────────────────────────────────────
  const handleValider = async () => {
    if (!selected.length) return toast.error('Sélectionnez des notes à valider.')
    try {
      await validerGrades(selected)
      toast.success(`${selected.length} note(s) validée(s) !`)
      setSelected([])
      fetchGrades()
    } catch { toast.error('Erreur validation.') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Archiver cette note ?')) return
    try {
      await deleteGrade(id)
      toast.success('Note archivée.')
      fetchGrades()
    } catch { toast.error('Erreur archivage.') }
  }

  const handleRestore = async (id) => {
    if (!window.confirm('Restaurer cette note ?')) return
    try {
      await restoreGrade(id)
      toast.success('Note restaurée.')
      fetchGrades()
    } catch { toast.error('Erreur restauration.') }
  }

  const handleDestroy = async (id) => {
    if (!window.confirm('Supprimer DÉFINITIVEMENT cette note ? Cette action est irréversible.')) return
    try {
      await destroyGrade(id)
      toast.success('Note supprimée définitivement.')
      fetchGrades()
    } catch { toast.error('Erreur suppression.') }
  }

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const noteColor = (val) => {
    const v = parseFloat(val)
    if (v >= 16) return 'text-emerald-600 font-bold'
    if (v >= 10) return 'text-blue-600 font-semibold'
    return 'text-red-500 font-semibold'
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Notes</h1>
          <p className="text-gray-500 text-sm mt-0.5 flex items-center gap-2">
            {grades.length} note(s) — {selectedYear?.libelle || '...'}
            {isTeacher && (
              <span className="badge bg-blue-50 text-blue-700">Mes notes</span>
            )}
            {isAdmin && (
              <span className="badge bg-amber-50 text-amber-700">Vue admin</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && selected.length > 0 && (
            <button onClick={handleValider}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600
                hover:bg-emerald-700 text-white text-sm font-medium rounded-xl">
              <CheckSquare size={16} /> Valider ({selected.length})
            </button>
          )}
          {isAdmin && (
            <button onClick={fetchGrades}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200
                hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl"
              title="Actualiser les notes">
              <RefreshCw size={15} /> Actualiser
            </button>
          )}
          {isTeacher && (
            <button
              onClick={() => {
                setShowForm(v => !v)
                if (showForm) {
                  // Fermeture : reset complet
                  setSelectedFormClass('')
                  setForm({ student_id: '', matiere_id: '', valeur: '', trimestre: '1', commentaire: '', idEpreuve: '', idSession: '' })
                  setEditingId(null)
                }
              }}
              className="btn-primary">
              <Plus size={16} /> {showForm ? 'Fermer' : 'Saisir une note'}
            </button>
          )}
          <button onClick={() => setShowArchives(!showArchives)} className="btn-secondary">
            {showArchives ? 'Notes Actives' : 'Archives'}
          </button>
        </div>
      </div>

      {/* Filtres admin */}
      {isAdmin && (
        <div className="flex flex-wrap gap-3 mb-5">
          <select value={filters.matiere_id}
            onChange={e => setFilters(f => ({ ...f, matiere_id: e.target.value }))}
            className="select-field w-44">
            <option value="">Toutes les matières</option>
            {matieres.map(m => <option key={m.idCours} value={m.idCours}>{m.libelle}</option>)}
          </select>
          <select value={filters.trimestre}
            onChange={e => setFilters(f => ({ ...f, trimestre: e.target.value }))}
            className="select-field w-40">
            {TRIMESTRES.map(t => (
              <option key={t} value={t}>Trimestre {t}</option>
            ))}
          </select>
        </div>
      )}

      {/* Filtre trimestre enseignant */}
      {isTeacher && (
        <div className="flex gap-3 mb-5">
          <select value={filters.trimestre}
            onChange={e => setFilters(f => ({ ...f, trimestre: e.target.value }))}
            className="select-field w-40">
            {TRIMESTRES.map(t => (
              <option key={t} value={t}>Trimestre {t}</option>
            ))}
          </select>
        </div>
      )}

      {/* Formulaire saisie enseignant */}
      {showForm && isTeacher && (
        <form onSubmit={handleCreate} className="card p-5 mb-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            {editingId ? 'Modifier la note' : 'Saisir une note'}
          </h2>

          {(() => {
            // Extraire les classes uniques depuis la liste des élèves
            const classeMap = new Map();
            students.forEach(s => {
              if (s.idClasse && !classeMap.has(s.idClasse)) {
                classeMap.set(s.idClasse, s.classe_nom || `Classe ${s.idClasse}`);
              }
            });
            const classesDisponibles = [...classeMap.entries()].map(([id, nom]) => ({ id, nom }));

            // Filtrer les élèves selon la classe sélectionnée
            const studentsFiltered = selectedFormClass
              ? students.filter(s => String(s.idClasse) === String(selectedFormClass))
              : students;

            // Filtrer les matières selon la classe sélectionnée (via form ou via l'élève sélectionné)
            const currentClassId = selectedFormClass || 
              (classesDisponibles.length === 1 ? classesDisponibles[0].id : null) ||
              students.find(s => String(s.id || s.matricule) === String(form.student_id))?.idClasse;
              
            const rawFilteredMatieres = currentClassId
              ? matieres.filter(m => String(m.idClasse) === String(currentClassId))
              : matieres;

            // Dédupliquer par nom (sans tenir compte de la casse) pour éviter d'afficher 3x "Mathématiques"
            const filteredMatieres = [];
            const seenMatiereNames = new Set();
            rawFilteredMatieres.forEach(m => {
              // Récupérer le nom pur avant la parenthèse (ex: "Mathématiques" dans "Mathématiques (CE2)")
              const rawName = m.libelle || m.nom || '';
              const baseName = rawName.split('(')[0].trim().toLowerCase();
              if (!seenMatiereNames.has(baseName)) {
                seenMatiereNames.add(baseName);
                filteredMatieres.push(m);
              }
            });

            return formLoading ? (
              <p className="text-gray-400 text-sm">Chargement des données...</p>
            ) : (
            <>
              {/* Message si pas de données */}
              {students.length === 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-700 text-xs">
                    ⚠️ Aucun élève trouvé. Vérifiez que des élèves sont assignés à vos classes.
                  </p>
                </div>
              )}
              {matieres.length === 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-700 text-xs">
                    ⚠️ Aucune matière trouvée. Demandez à l'administrateur d'en ajouter.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                {/* ÉTAPE 1 : Choisir la classe (obligatoire si plusieurs classes) */}
                {classesDisponibles.length > 1 && (
                  <div className="col-span-2 md:col-span-3">
                    <label className="form-label">
                      Classe * ({classesDisponibles.length} disponibles)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {classesDisponibles.map(cl => (
                        <button
                          key={cl.id}
                          type="button"
                          onClick={() => {
                            setSelectedFormClass(String(cl.id));
                            setForm(f => ({ ...f, student_id: '', matiere_id: '' }));
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                            String(selectedFormClass) === String(cl.id)
                              ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-600'
                          }`}
                        >
                          {cl.nom}
                        </button>
                      ))}
                    </div>
                    {!selectedFormClass && (
                      <p className="text-xs text-amber-600 mt-1">⚠️ Sélectionnez d'abord une classe pour filtrer les élèves et les matières.</p>
                    )}
                  </div>
                )}

                {/* ÉTAPE 2 : Choisir l'élève */}
                <div>
                  <label className="form-label">
                    Élève * ({studentsFiltered.length} disponibles)
                  </label>
                  <select
                    value={form.student_id}
                    onChange={e => setForm(f => ({ ...f, student_id: e.target.value }))}
                    className="select-field"
                    disabled={classesDisponibles.length > 1 && !selectedFormClass}
                  >
                    <option value="">— Choisir —</option>
                    {studentsFiltered.map(s => (
                      <option key={s.matricule || s.id} value={String(s.matricule || s.id)}>
                        {s.prenom} {s.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ÉTAPE 3 : Choisir la matière (filtrée par classe) */}
                <div>
                  <label className="form-label">
                    Matière * ({filteredMatieres.length} disponibles)
                  </label>
                  <select
                    value={form.matiere_id}
                    onChange={e => setForm(f => ({ ...f, matiere_id: e.target.value }))}
                    className="select-field"
                    disabled={classesDisponibles.length > 1 && !selectedFormClass}
                  >
                    <option value="">— Choisir —</option>
                    {filteredMatieres.map(m => {
                      // Nettoyer le nom pour l'affichage (enlever la parenthèse de la classe si présente)
                      const displayName = (m.libelle || m.nom || '').split('(')[0].trim();
                      return (
                        <option key={m.idCours || m.id} value={String(m.idCours || m.id)}>{displayName}</option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="form-label">Note (0–20) *</label>
                  <input
                    type="number" min="0" max="20" step="0.25"
                    value={form.valeur}
                    onChange={e => setForm(f => ({ ...f, valeur: e.target.value }))}
                    placeholder="Ex: 14.5"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="form-label">Trimestre</label>
                  <select
                    value={form.trimestre}
                    onChange={e => setForm(f => ({ ...f, trimestre: e.target.value }))}
                    className="select-field"
                  >
                    {TRIMESTRES.map(t => (
                      <option key={t} value={t}>Trimestre {t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs">Épreuve / Devoir (Optionnel)</label>
                  <select
                    value={form.idEpreuve}
                    onChange={e => setForm(f => ({ ...f, idEpreuve: e.target.value }))}
                    className="select-field"
                  >
                    <option value="">— Standard / Général —</option>
                    {epreuves.map(e => (
                      <option key={e.id} value={String(e.id)}>{e.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label text-xs">Session spécifique (Optionnel)</label>
                  <select
                    value={form.idSession}
                    onChange={e => setForm(f => ({ ...f, idSession: e.target.value }))}
                    className="select-field"
                  >
                    <option value="">— Par défaut —</option>
                    {sessions.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Commentaire (optionnel)</label>
                  <input
                    value={form.commentaire}
                    onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                    placeholder="Appréciation..."
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="submit" className="btn-primary">
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setSelectedFormClass('')
                    setForm({ student_id: '', matiere_id: '', valeur: '', trimestre: '1', commentaire: '', idEpreuve: '', idSession: '' })
                  }}
                  className="btn-secondary">
                  Annuler
                </button>
              </div>
            </>
            );
          })()}
        </form>
      )}

      {/* Tableau des notes */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : grades.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-gray-400 text-sm">
              {isTeacher
                ? 'Aucune note pour ce trimestre. Cliquez sur "Saisir une note".'
                : 'Aucune note pour ces filtres.'}
            </p>
          </div>
        ) : !selectedClass ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
            {sortedClassNames.map((cName) => (
              <div 
                key={cName} 
                onClick={() => setSelectedClass(cName)}
                className="card p-6 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all flex flex-col items-center justify-center text-center bg-white group"
              >
                <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                  {cName.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-1">{cName}</h3>
                <p className="text-gray-500 text-sm font-medium mb-3">
                  {groupedGrades[cName].length} note(s)
                </p>
                <div className="text-primary-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  Voir les notes <span>→</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-1">
            <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100 bg-gray-50/50">
              <button onClick={() => setSelectedClass(null)} className="btn-secondary text-xs py-1.5 px-3">
                ← Retour aux classes
              </button>
              <h2 className="font-semibold text-gray-800 text-base">Classe : {selectedClass}</h2>
              <span className="ml-auto text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                {groupedGrades[selectedClass]?.length || 0} note(s)
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {isAdmin && (
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox"
                          onChange={e => setSelected(
                            e.target.checked
                              ? (groupedGrades[selectedClass] || []).filter(g => g.statut === 'brouillon').map(g => g.id)
                              : []
                          )}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                      </th>
                    )}
                    <th className="text-left font-medium text-gray-500 px-4 py-3">Élève</th>
                    <th className="text-left font-medium text-gray-500 px-4 py-3">Matière</th>
                    <th className="text-left font-medium text-gray-500 px-4 py-3">Classe</th>
                    <th className="text-center font-medium text-gray-500 px-4 py-3">Note</th>
                    <th className="text-left font-medium text-gray-500 px-4 py-3">Statut</th>
                    {isAdmin  && <th className="text-left font-medium text-gray-500 px-4 py-3">Enseignant</th>}
                    {isTeacher && <th className="text-right font-medium text-gray-500 px-4 py-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(groupedGrades[selectedClass] || []).map(g => (
                    <tr key={g.id}
                      className={`hover:bg-gray-50/50 transition-colors
                        ${selected.includes(g.id) ? 'bg-blue-50/40' : ''}`}>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          {g.statut === 'brouillon' && (
                            <input type="checkbox"
                              checked={selected.includes(g.id)}
                              onChange={() => toggleSelect(g.id)}
                              className="w-4 h-4 rounded border-gray-300 text-primary-500"
                            />
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {g.student_prenom} {g.student_nom}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{g.matiere_nom}</td>
                      <td className="px-4 py-3">
                        <span className="badge bg-blue-50 text-blue-700">
                          {g.classe_nom || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-lg ${noteColor(g.valeur)}`}>
                          {parseFloat(g.valeur).toFixed(2)}
                        </span>
                        <span className="text-gray-400 text-xs">/20</span>
                      </td>
                      <td className="px-4 py-3">
                        {g.statut === 'valide'
                          ? <span className="badge bg-emerald-50 text-emerald-700">
                              <Check size={11} className="mr-1" />Validée
                            </span>
                          : <span className="badge bg-amber-50 text-amber-700">Brouillon</span>
                        }
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {g.teacher_prenom} {g.teacher_nom}
                        </td>
                      )}
                      {isTeacher && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {showArchives ? (
                              <>
                                <button onClick={() => handleRestore(g.id)}
                                  className="btn-secondary text-xs py-1 px-3">
                                  Restaurer
                                </button>
                                <button onClick={() => handleDestroy(g.id)}
                                  className="btn-secondary text-xs py-1 px-3 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                                  Supprimer
                                </button>
                              </>
                            ) : (
                              <>
                                {g.statut === 'brouillon' && (
                                  <button onClick={() => handleEdit(g)}
                                    className="btn-icon text-indigo-400 hover:bg-indigo-50 hover:text-indigo-600"
                                    title="Modifier">
                                    <Plus size={14} className="rotate-45" />
                                  </button>
                                )}
                                <button onClick={() => handleDelete(g.id)}
                                  className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600"
                                  title="Archiver">
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}