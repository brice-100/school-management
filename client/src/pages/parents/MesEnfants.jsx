import { useState, useEffect, useCallback } from 'react'
import {
  Users, BookOpen, Star, FileText,
  ChevronRight, AlertCircle, RefreshCw,
} from 'lucide-react'
import { getMesEnfants }    from '../../services/parentService'
import { getEvaluations }   from '../../services/evaluationService'
import { getEpreuvesClasse }from '../../services/evaluationService'
import { getBulletinData, downloadBulletinPDF } from '../../services/bulletinService'
import { useAuth }          from '../../context/AuthContext'
import { useYear }          from '../../context/YearContext'
import toast                from 'react-hot-toast'
import { Download }         from 'lucide-react'

// ── Couleur note ──────────────────────────────────────────────────
const NOTE_COLOR = (n) => {
  if (n >= 16) return 'text-emerald-700 bg-emerald-50 border-emerald-200'
  if (n >= 12) return 'text-blue-700 bg-blue-50 border-blue-200'
  if (n >= 10) return 'text-amber-700 bg-amber-50 border-amber-200'
  return 'text-red-700 bg-red-50 border-red-200'
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

// ── Carte enfant sélectionnable ───────────────────────────────────
function EnfantCard({ enfant, selected, onSelect }) {
  const initiales = `${enfant.prenom?.[0] ?? ''}${enfant.nom?.[0] ?? ''}`
  return (
    <button
      onClick={() => onSelect(enfant)}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left
        w-full transition-all ${selected
          ? 'border-primary-500 bg-primary-50 shadow-sm'
          : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm'}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center
        text-base font-semibold shrink-0 ${selected
          ? 'bg-primary-500 text-white'
          : 'bg-gray-100 text-gray-600'}`}>
        {initiales}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">
          {enfant.prenom} {enfant.nom}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {enfant.classe || 'Classe non définie'}
        </p>
        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium
          ${enfant.actif === 1
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-gray-100 text-gray-500'}`}>
          {enfant.actif === 1 ? 'Actif' : 'Inactif'}
        </span>
      </div>
      {selected && (
        <ChevronRight size={16} className="text-primary-500 shrink-0" />
      )}
    </button>
  )
}

// ── Section Notes ─────────────────────────────────────────────────
function NotesSection({ matricule }) {
  const { selectedYear } = useYear()
  const [notes,   setNotes]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getEvaluations({ matricule, idAnnee: selectedYear?.idAnnee })
      setNotes(data.evaluations || data.data || [])
    } catch { toast.error('Impossible de charger les notes.') }
    finally { setLoading(false) }
  }, [matricule, selectedYear])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  if (loading) return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center">
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-12 rounded" />
        </div>
      ))}
    </div>
  )

  if (notes.length === 0) return (
    <div className="py-8 text-center">
      <Star size={28} className="text-gray-200 mx-auto mb-2" />
      <p className="text-gray-400 text-sm">Aucune note enregistrée pour l'instant.</p>
    </div>
  )

  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left font-medium text-gray-500 px-0 py-2.5">Matière</th>
            <th className="text-center font-medium text-gray-500 px-3 py-2.5">Note</th>
            <th className="text-center font-medium text-gray-500 px-3 py-2.5">Coeff.</th>
            <th className="text-left font-medium text-gray-500 px-3 py-2.5 hidden sm:table-cell">
              Appréciation
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {notes.map(n => (
            <tr key={n.idEval} className="hover:bg-gray-50/40 transition-colors">
              <td className="py-3 pr-3">
                <p className="font-medium text-gray-900">{n.libelleCours || '—'}</p>
                <p className="text-xs text-gray-400">
                  {n.libelleNature || ''}{n.libelleNature && n.libelleSession ? ' · ' : ''}{n.libelleSession || ''}
                </p>
              </td>
              <td className="py-3 px-3 text-center">
                <span className={`inline-flex items-center justify-center w-12 h-8
                  rounded-lg text-sm font-bold border ${NOTE_COLOR(n.note)}`}>
                  {Number(n.note).toFixed(1)}
                </span>
              </td>
              <td className="py-3 px-3 text-center text-gray-500 text-sm">
                {n.coefficient ?? '—'}
              </td>
              <td className="py-3 px-3 text-gray-400 text-xs hidden sm:table-cell">
                {n.appreciation || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Récap rapide */}
      {notes.length > 0 && (() => {
        const moy = notes.reduce((acc, n) => acc + parseFloat(n.note), 0) / notes.length
        return (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
            <span className="text-sm text-gray-500">Moyenne générale :</span>
            <span className={`px-3 py-1 rounded-lg text-sm font-bold border
              ${NOTE_COLOR(moy)}`}>
              {moy.toFixed(2)} / 20
            </span>
          </div>
        )
      })()}
    </div>
  )
}

// ── Section Exercices ─────────────────────────────────────────────
function ExercicesSection({ matricule }) {
  const { selectedYear } = useYear()
  const [exercices, setExercices] = useState([])
  const [loading,   setLoading]   = useState(true)

  const fetchExercices = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getEpreuvesClasse({ matricule, idAnnee: selectedYear?.idAnnee })
      setExercices(data.epreuves || data.data || [])
    } catch { toast.error('Impossible de charger les exercices.') }
    finally { setLoading(false) }
  }, [matricule, selectedYear])

  useEffect(() => { fetchExercices() }, [fetchExercices])

  if (loading) return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="skeleton h-14 rounded-xl" />
      ))}
    </div>
  )

  if (exercices.length === 0) return (
    <div className="py-8 text-center">
      <FileText size={28} className="text-gray-200 mx-auto mb-2" />
      <p className="text-gray-400 text-sm">Aucun exercice disponible pour l'instant.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {exercices.map(ex => (
        <div key={ex.idEpreuve}
          className="flex items-start gap-3 p-4 rounded-xl border border-gray-100
            hover:border-gray-200 hover:bg-gray-50/40 transition-all">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center
            justify-center shrink-0">
            <FileText size={15} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="font-medium text-gray-900 text-sm">{ex.libelle}</p>
              <span className="badge bg-blue-50 text-blue-700 text-xs shrink-0">
                {ex.libelleNature || 'Exercice'}
              </span>
            </div>
            {ex.auteur && ex.auteur !== 'INDEFINI' && (
              <p className="text-xs text-gray-400 mt-0.5">Par {ex.auteur}</p>
            )}
            {ex.urlDoc && ex.urlDoc !== 'INDEFINI' && (
              <a href={ex.urlDoc} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary-600
                  hover:underline mt-1.5 font-medium">
                <BookOpen size={12} />
                Télécharger le document
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Section Bulletin ──────────────────────────────────────────────
function BulletinSection({ matricule }) {
  const { annees, selectedYear } = useYear()
  const [downloading,setDownloading]= useState(false)
  const [loading,     setLoading]    = useState(false)
  const [bulletin,    setBulletin]   = useState(null)
  const [trimestre,  setTrimestre]  = useState(1)
  const [annee,      setAnnee]      = useState(selectedYear?.libelle || '')
 
  const fetchBulletin = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getBulletinData(matricule, { trimestre, annee_scolaire: annee })
      setBulletin(data.data)
    } catch { 
      toast.error('Erreur chargement bulletin.') 
      setBulletin(null)
    } finally { 
      setLoading(false) 
    }
  }, [matricule, trimestre, annee])

  useEffect(() => {
    if (selectedYear) setAnnee(selectedYear.libelle)
  }, [selectedYear])

  useEffect(() => {
    if (matricule && annee) fetchBulletin()
  }, [fetchBulletin, matricule, annee])
 
  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadBulletinPDF(matricule, trimestre, annee)
      toast.success('Téléchargement lancé !')
    } catch { toast.error('Erreur lors du téléchargement.') }
    finally { setDownloading(false) }
  }
 
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Trimestre
          </label>
          <div className="flex gap-2">
            {[1, 2, 3].map(t => (
              <button key={t} onClick={() => setTrimestre(t)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
                  ${trimestre === t ? 'bg-primary-500 text-white shadow-md shadow-primary-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                T{t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Année scolaire
          </label>
          <select value={annee} onChange={e => setAnnee(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-2 text-sm font-medium focus:border-primary-300 outline-none">
            {annees.map(a => <option key={a.idAnnee} value={a.libelle}>{a.libelle}</option>)}
          </select>
        </div>
      </div>
 
      {loading ? (
        <div className="py-12 text-center space-y-4">
          <RefreshCw className="animate-spin text-primary-500 mx-auto" size={32} />
          <p className="text-gray-500">Génération de l'aperçu...</p>
        </div>
      ) : bulletin ? (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
           {/* Mini Aperçu du Bulletin */}
           <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
             <h5 className="font-bold text-sm text-gray-700 uppercase">Aperçu - {bulletin.trimestre}e Trimestre</h5>
             <button onClick={handleDownload} disabled={downloading} className="text-primary-600 font-bold text-xs flex items-center gap-1">
               <Download size={14} /> {downloading ? '...' : 'PDF'}
             </button>
           </div>
           
           <div className="p-4 space-y-4 overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-gray-100 uppercase font-bold text-gray-600">
                    <th className="border border-gray-200 p-1 text-left">Matière</th>
                    <th className="border border-gray-200 p-1">SEQ1</th>
                    <th className="border border-gray-200 p-1">SEQ2</th>
                    <th className="border border-gray-200 p-1">COMP</th>
                    <th className="border border-gray-200 p-1 bg-primary-50">MOY.</th>
                  </tr>
                </thead>
                <tbody>
                  {bulletin.notes.map((n, i) => (
                    <tr key={i}>
                      <td className="border border-gray-200 p-1 font-semibold">{n.matiere_nom}</td>
                      <td className="border border-gray-200 p-1 text-center">{n.seq1 ?? '—'}</td>
                      <td className="border border-gray-200 p-1 text-center">{n.seq2 ?? '—'}</td>
                      <td className="border border-gray-200 p-1 text-center">{n.comp ?? '—'}</td>
                      <td className="border border-gray-200 p-1 text-center font-bold bg-primary-50/30">{(n.moyenne_matiere || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-primary-500 text-white font-bold">
                    <td className="border border-primary-600 p-1 uppercase">Moyenne Générale</td>
                    <td colSpan={3} className="border border-primary-600 p-1"></td>
                    <td className="border border-primary-600 p-1 text-center">{bulletin.moyenne} / 20</td>
                  </tr>
                </tbody>
              </table>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                  <p className="text-[10px] text-indigo-500 font-bold uppercase mb-1">Position</p>
                  <p className="text-xl font-black text-indigo-700">{bulletin.stats?.rang || '—'} <span className="text-xs font-normal">/ {bulletin.student.effectif || '—'}</span></p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <p className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Mention</p>
                  <p className="text-lg font-black text-emerald-700">{bulletin.mention}</p>
                </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 border border-primary-100 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-primary-500">
            <BookOpen size={32} />
          </div>
          <h4 className="font-display text-xl font-bold text-gray-900 mb-2">Bulletin de notes</h4>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Aucun résultat trouvé pour ce trimestre.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function MesEnfants() {
  const { user } = useAuth()

  const [enfants,  setEnfants]  = useState([])
  const [selected, setSelected] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState('notes')

  const fetchEnfants = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getMesEnfants()
      const list = data.enfants || data.data || []
      setEnfants(list)
      // Sélectionner automatiquement le premier enfant
      if (list.length > 0 && !selected) setSelected(list[0])
    } catch { toast.error('Impossible de charger vos enfants.') }
    finally { setLoading(false) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchEnfants() }, [fetchEnfants])

  const TABS = [
    { key: 'notes',     label: 'Notes',     icon: Star      },
    { key: 'bulletin',  label: 'Bulletin',  icon: BookOpen  },
    { key: 'exercices', label: 'Exercices', icon: FileText  },
  ]

  return (
    <div className="page-container">

      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Mes enfants
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Bonjour {user?.prenom} — suivez la scolarité de vos enfants
          </p>
        </div>
        <button onClick={fetchEnfants} className="btn-icon" title="Actualiser">
          <RefreshCw size={16} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      ) : enfants.length === 0 ? (
        <div className="card py-14 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center
            justify-center mx-auto mb-4">
            <Users size={24} className="text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-700 mb-1">Aucun enfant trouvé</h3>
          <p className="text-gray-400 text-sm">
            Contactez l'administration pour associer vos enfants à votre compte.
          </p>
        </div>
      ) : (
        <>
          {/* ── Sélecteur d'enfant ─────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {enfants.map(enfant => (
              <EnfantCard
                key={enfant.matricule}
                enfant={enfant}
                selected={selected?.matricule === enfant.matricule}
                onSelect={setSelected}
              />
            ))}
          </div>

          {/* ── Contenu pour l'enfant sélectionné ──────────────── */}
          {selected && (
            <div>
              {/* Bandeau enfant sélectionné */}
              <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-primary-50
                border border-primary-200 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center
                  justify-center text-white text-xs font-bold shrink-0">
                  {selected.prenom?.[0]}{selected.nom?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-primary-900 text-sm">
                    {selected.prenom} {selected.nom}
                  </p>
                  <p className="text-xs text-primary-600">
                    Classe : {selected.classe || '—'} · Matricule : {selected.matricule}
                  </p>
                </div>
              </div>

              {/* Onglets */}
              <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
                {TABS.map(t => {
                  const Icon = t.icon
                  return (
                    <button key={t.key} onClick={() => setTab(t.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                        font-medium transition-all ${tab === t.key
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'}`}>
                      <Icon size={14} />
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {/* Contenu onglet */}
              <div className="card p-5">
                {tab === 'notes' && (
                  <NotesSection key={selected.matricule} matricule={selected.matricule} />
                )}
                {tab === 'bulletin' && (
                  <BulletinSection key={selected.matricule} matricule={selected.matricule} />
                )}
                {tab === 'exercices' && (
                  <ExercicesSection key={selected.matricule} matricule={selected.matricule} />
                )}
              </div>

              {/* Note légale */}
              <p className="text-xs text-gray-400 mt-3 text-center">
                Les notes et exercices sont mis à jour par les enseignants en temps réel.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}