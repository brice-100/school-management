import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X, Clock, Calendar, RefreshCw } from 'lucide-react'
import {
  getEmploiDuTemps, getEmploiDuTempsEnseignant,
  createCreneau, updateCreneau, deleteCreneau,
  getJoursSemaine,
} from '../../services/planningService'
import { getClasses } from '../../services/classService'
import { getCours }   from '../../services/coursService'
import { useAuth }    from '../../context/AuthContext'
import { useYear }    from '../../context/YearContext'
import toast          from 'react-hot-toast'

// ── Constantes ────────────────────────────────────────────────────
const JOURS_DEFAULT = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']
const HEURES = [
  '07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00',
]
const PALETTE = [
  { bg:'bg-blue-100',   border:'border-blue-300',   text:'text-blue-800'   },
  { bg:'bg-emerald-100',border:'border-emerald-300', text:'text-emerald-800'},
  { bg:'bg-purple-100', border:'border-purple-300',  text:'text-purple-800' },
  { bg:'bg-amber-100',  border:'border-amber-300',   text:'text-amber-800'  },
  { bg:'bg-rose-100',   border:'border-rose-300',    text:'text-rose-800'   },
  { bg:'bg-cyan-100',   border:'border-cyan-300',    text:'text-cyan-800'   },
  { bg:'bg-indigo-100', border:'border-indigo-300',  text:'text-indigo-800' },
  { bg:'bg-orange-100', border:'border-orange-300',  text:'text-orange-800' },
]

// ── Modale créneau ────────────────────────────────────────────────
function CreneauModal({ prefill, jours, cours, classes, onSave, onClose }) {
  const isEdit = Boolean(prefill?.idTemps)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    jour:     prefill?.jour     || jours[0] || 'Lundi',
    heure:    prefill?.heure    || '08:00',
    idClasse: prefill?.idClasse ? String(prefill.idClasse) : '',
    idCours:  prefill?.idCours  ? String(prefill.idCours)  : '',
  })
  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.jour || !form.heure || !form.idClasse || !form.idCours)
      return toast.error('Tous les champs sont requis.')
    setLoading(true)
    try {
      isEdit
        ? await updateCreneau(prefill.idTemps, { ...form, idAnnee: selectedYear?.idAnnee })
        : await createCreneau({ ...form, idAnnee: selectedYear?.idAnnee })
      toast.success(isEdit ? 'Créneau mis à jour !' : 'Créneau ajouté !')
      onSave()
    } catch (err) { toast.error(err.message || 'Erreur.') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-semibold text-gray-900">
            {isEdit ? 'Modifier le créneau' : 'Ajouter un créneau'}
          </h3>
          <button onClick={onClose} className="btn-icon"><X size={16}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Jour *</label>
              <select value={form.jour} onChange={e => set('jour', e.target.value)}
                className="select-field">
                {jours.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Heure *</label>
              <select value={form.heure} onChange={e => set('heure', e.target.value)}
                className="select-field">
                {HEURES.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Classe *</label>
            <select value={form.idClasse} onChange={e => set('idClasse', e.target.value)}
              className="select-field">
              <option value="">— Choisir —</option>
              {classes.map(c => (
                <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Cours *</label>
            <select value={form.idCours} onChange={e => set('idCours', e.target.value)}
              className="select-field">
              <option value="">— Choisir —</option>
              {cours.map(c => (
                <option key={c.idCours} value={c.idCours}>{c.libelle}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Ajouter'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Grille visuelle ───────────────────────────────────────────────
function GrilleHoraire({ creneaux, jours, canEdit, onEdit, onDelete, onAdd }) {
  // Couleur par idCours
  const coursIds = [...new Set(creneaux.map(c => c.idCours))]
  const colorMap = Object.fromEntries(coursIds.map((id, i) => [id, i]))

  // Index jour__heure → créneaux[]
  const index = {}
  creneaux.forEach(c => {
    const k = `${c.jour}__${c.heure}`
    if (!index[k]) index[k] = []
    index[k].push(c)
  })

  // Garder seulement les heures qui ont au moins un créneau,
  // ou les heures de 7h à 17h si aucun créneau
  const heuresUtilisees = HEURES.filter(h => jours.some(j => index[`${j}__${h}`]))
  const heuresAff = heuresUtilisees.length > 0 ? heuresUtilisees : HEURES.slice(2, 12)

  return (
    <div className="card overflow-auto">
      <table className="w-full border-collapse text-xs min-w-[600px]">
        <thead>
          <tr>
            <th className="w-14 px-2 py-3 text-gray-400 font-medium border-b border-r
              border-gray-100 bg-gray-50 sticky left-0 z-20 text-right">
              ⏱
            </th>
            {jours.map(j => (
              <th key={j} className="px-2 py-3 text-center font-semibold text-gray-700
                border-b border-r border-gray-100 bg-gray-50 last:border-r-0 min-w-[110px]">
                {j}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heuresAff.map((heure, hi) => (
            <tr key={heure} className={hi % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
              <td className="px-2 py-1.5 text-right text-gray-400 font-mono border-r
                border-b border-gray-100 bg-white sticky left-0 z-10 whitespace-nowrap">
                {heure}
              </td>
              {jours.map(jour => {
                const cells = index[`${jour}__${heure}`] || []
                return (
                  <td key={jour}
                    className="px-1 py-1 border-r border-b border-gray-100 last:border-r-0
                      align-top"
                    onClick={() => canEdit && cells.length === 0 && onAdd(jour, heure)}
                  >
                    {cells.length > 0 ? (
                      <div className="space-y-0.5">
                        {cells.map(c => {
                          const col = PALETTE[colorMap[c.idCours] % PALETTE.length]
                          return (
                            <div key={c.idTemps}
                              className={`group relative rounded border px-2 py-1
                                ${col.bg} ${col.border} ${col.text}`}>
                              <p className="font-semibold truncate leading-snug">
                                {c.libelleCours || 'Cours'}
                              </p>
                              {c.libelleSalle && (
                                <p className="opacity-60 truncate">{c.libelleSalle}</p>
                              )}
                              {canEdit && (
                                <div className="absolute top-0.5 right-0.5 hidden
                                  group-hover:flex gap-0.5">
                                  <button onClick={e => { e.stopPropagation(); onEdit(c) }}
                                    className="w-4 h-4 rounded bg-white/70 hover:bg-white
                                      flex items-center justify-center">
                                    <Pencil size={9} className="text-gray-600"/>
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); onDelete(c.idTemps, c.libelleCours) }}
                                    className="w-4 h-4 rounded bg-white/70 hover:bg-red-100
                                      flex items-center justify-center">
                                    <X size={9} className="text-red-500"/>
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      canEdit && (
                        <div className="h-7 rounded border-2 border-dashed
                          border-transparent hover:border-primary-200
                          hover:bg-primary-50/40 transition-all cursor-pointer
                          flex items-center justify-center opacity-0 hover:opacity-100">
                          <Plus size={11} className="text-primary-300"/>
                        </div>
                      )
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {creneaux.length === 0 && (
        <div className="py-12 text-center border-t border-gray-100">
          <Clock size={32} className="text-gray-200 mx-auto mb-3"/>
          <p className="text-gray-400 text-sm">Aucun créneau. Cliquez sur une cellule pour en ajouter.</p>
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function EmploiDuTemps() {
  const { user }  = useAuth()
  const { selectedYear } = useYear()
  const isAdmin   = user?.typeAdmin !== undefined
  const isTeacher = user?.typePersonne === 1
  const canEdit   = isAdmin

  const [creneaux, setCreneaux] = useState([])
  const [jours,    setJours]    = useState(JOURS_DEFAULT)
  const [classes,  setClasses]  = useState([])
  const [cours,    setCours]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState(null)  // null | prefillObj
  const [filterIdClasse, setFilterIdClasse] = useState('')
  const [filterJour,     setFilterJour]     = useState('')

  // ── Init données statiques ────────────────────────────────────
  useEffect(() => {
    Promise.all([getClasses({}), getCours({}), getJoursSemaine()])
      .then(([cl, co, jo]) => {
        setClasses(cl.data.classes || cl.data.data || [])
        setCours(co.data.cours || co.data.data || [])
        const jData = jo.data.jours || jo.data.data
        if (jData?.length) setJours(jData.map(j => j.libelle || j))
      }).catch(() => {})
  }, [])

  // ── Fetch créneaux ────────────────────────────────────────────
  const fetch = async () => {
    setLoading(true)
    try {
      const fn  = isTeacher ? getEmploiDuTempsEnseignant : getEmploiDuTemps
      const params = isTeacher
        ? { idPers: user?.idPers, idAnnee: selectedYear?.idAnnee }
        : { idClasse: filterIdClasse, jour: filterJour, idAnnee: selectedYear?.idAnnee }
      const { data } = await fn(params)
      setCreneaux(data.creneaux || data.data || [])
    } catch { toast.error('Erreur chargement emploi du temps.') }
    finally { setLoading(false) }
  }

  useEffect(() => { const t = setTimeout(fetch, 200); return () => clearTimeout(t) },
    [filterIdClasse, filterJour, selectedYear])

  // ── Actions ───────────────────────────────────────────────────
  const handleDelete = async (id, label) => {
    if (!window.confirm(`Supprimer le créneau "${label}" ?`)) return
    try {
      await deleteCreneau(id)
      toast.success('Créneau supprimé.')
      fetch()
    } catch { toast.error('Erreur suppression.') }
  }

  const handleSave = () => { setModal(null); fetch() }

  // Filtrage local par jour (si filtre sélectionné dans les pills)
  const creneauxAff = filterJour
    ? creneaux.filter(c => c.jour === filterJour)
    : creneaux

  // Légende (cours uniques)
  const coursUniques = [...new Map(creneaux.map(c => [c.idCours, c])).values()]
  const coursIds = [...new Set(creneaux.map(c => c.idCours))]
  const colorMap = Object.fromEntries(coursIds.map((id, i) => [id, i]))

  return (
    <div className="page-container">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Emploi du temps</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isTeacher ? 'Votre planning' : `${creneaux.length} créneau(x)`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetch} className="btn-icon" title="Actualiser">
            <RefreshCw size={16}/>
          </button>
          {canEdit && (
            <button onClick={() => setModal({ jour: jours[0], heure: '08:00',
              idClasse: filterIdClasse })} className="btn-primary">
              <Plus size={16}/> Ajouter un créneau
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {!isTeacher && (
          <select value={filterIdClasse}
            onChange={e => setFilterIdClasse(e.target.value)}
            className="select-field w-52">
            <option value="">Toutes les classes</option>
            {classes.map(c => (
              <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>
            ))}
          </select>
        )}
        {/* Pills jours */}
        <div className="flex flex-wrap gap-1.5">
          {['', ...jours].map((j, i) => (
            <button key={i} onClick={() => setFilterJour(j)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filterJour === j
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {j === '' ? 'Toute la semaine' : j.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Légende couleurs */}
      {coursUniques.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {coursUniques.slice(0, 8).map(c => {
            const col = PALETTE[colorMap[c.idCours] % PALETTE.length]
            return (
              <span key={c.idCours}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border
                  ${col.bg} ${col.text} ${col.border}`}>
                {c.libelleCours || 'Cours'}
              </span>
            )
          })}
        </div>
      )}

      {/* Grille */}
      {loading ? (
        <div className="card p-6 space-y-2">
          <div className="skeleton h-8 w-full rounded" />
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="skeleton w-12 h-10 rounded shrink-0" />
              {[...Array(6)].map((_, j) => (
                <div key={j} className={`skeleton h-10 flex-1 rounded
                  ${(i + j) % 3 === 0 ? 'opacity-100' : 'opacity-10'}`} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <GrilleHoraire
          creneaux={creneauxAff}
          jours={filterJour ? [filterJour] : jours}
          canEdit={canEdit}
          onEdit={c => setModal(c)}
          onDelete={handleDelete}
          onAdd={(jour, heure) => setModal({ jour, heure, idClasse: filterIdClasse })}
        />
      )}

      {/* Vue liste dépliable */}
      {!loading && creneauxAff.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600
            select-none transition-colors">
            Vue liste — {creneauxAff.length} créneaux
          </summary>
          <div className="card overflow-hidden mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Jour','Heure','Cours','Salle', canEdit ? 'Actions' : '']
                    .filter(Boolean).map(h => (
                    <th key={h} className="text-left font-medium text-gray-500 px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...creneauxAff]
                  .sort((a, b) => jours.indexOf(a.jour) - jours.indexOf(b.jour)
                    || a.heure.localeCompare(b.heure))
                  .map(c => (
                    <tr key={c.idTemps} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-700">{c.jour}</td>
                      <td className="px-5 py-3 font-mono text-gray-500 text-xs">{c.heure}</td>
                      <td className="px-5 py-3">
                        <span className={`badge ${
                          PALETTE[colorMap[c.idCours] % PALETTE.length].bg}
                          ${PALETTE[colorMap[c.idCours] % PALETTE.length].text}`}>
                          {c.libelleCours || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{c.libelleSalle || '—'}</td>
                      {canEdit && (
                        <td className="px-5 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => setModal(c)} className="btn-icon">
                              <Pencil size={13}/>
                            </button>
                            <button
                              onClick={() => handleDelete(c.idTemps, c.libelleCours)}
                              className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* Modal */}
      {modal && (
        <CreneauModal
          prefill={modal}
          jours={jours}
          cours={cours}
          classes={classes}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}