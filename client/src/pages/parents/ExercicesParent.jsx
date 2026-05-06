import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, FileText, ChevronLeft, ChevronRight,
  ExternalLink, RefreshCw, AlertCircle,
} from 'lucide-react'
import { getMesEnfants }     from '../../services/parentService'
import { getEpreuvesClasse } from '../../services/evaluationService'
import { useAuth }           from '../../context/AuthContext'
import toast                 from 'react-hot-toast'

// ── Couleur nature épreuve ─────────────────────────────────────────
const NATURE_STYLE = {
  'Controle Continu':    'bg-blue-50 text-blue-700 border-blue-200',
  'Examen':              'bg-purple-50 text-purple-700 border-purple-200',
  'Devoir Mercredi':     'bg-amber-50 text-amber-700 border-amber-200',
  'Devoir Week End':     'bg-emerald-50 text-emerald-700 border-emerald-200',
}
const natureStyle = (n) => NATURE_STYLE[n] || 'bg-gray-100 text-gray-600 border-gray-200'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric',
}) : null

// ── Carte épreuve ─────────────────────────────────────────────────
function EpreuveCard({ epreuve }) {
  return (
    <div className="card p-4 hover:shadow-sm transition-all">
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center
          justify-center shrink-0">
          <FileText size={17} className="text-amber-600" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Titre + nature */}
          <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
            <p className="font-medium text-gray-900 text-sm">{epreuve.libelle}</p>
            {epreuve.libelleNature && (
              <span className={`badge border text-xs shrink-0 ${natureStyle(epreuve.libelleNature)}`}>
                {epreuve.libelleNature}
              </span>
            )}
          </div>

          {/* Auteur */}
          {epreuve.auteur && epreuve.auteur !== 'INDEFINI' && (
            <p className="text-xs text-gray-400 mb-1">Par {epreuve.auteur}</p>
          )}

          {/* Date */}
          {epreuve.created_at && (
            <p className="text-xs text-gray-400">
              Publié le {fmtDate(epreuve.created_at)}
            </p>
          )}

          {/* Lien document */}
          {epreuve.urlDoc && epreuve.urlDoc !== 'INDEFINI' && (
            <a
              href={epreuve.urlDoc}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium
                text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              <ExternalLink size={12} />
              Télécharger l'exercice
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sélecteur d'enfant ─────────────────────────────────────────────
function EnfantSelector({ enfants, selected, onSelect }) {
  if (enfants.length === 0) return null

  if (enfants.length === 1) {
    return (
      <div className="flex items-center gap-3 bg-primary-50 border border-primary-200
        rounded-2xl px-4 py-3 mb-5">
        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center
          justify-center text-primary-700 font-semibold text-sm shrink-0">
          {enfants[0].prenom?.[0]}{enfants[0].nom?.[0]}
        </div>
        <div>
          <p className="font-medium text-primary-900 text-sm">
            {enfants[0].prenom} {enfants[0].nom}
          </p>
          <p className="text-xs text-primary-600">
            {enfants[0].classe || 'Classe non définie'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
        Choisir un enfant
      </p>
      <div className="flex flex-wrap gap-2">
        {enfants.map(e => (
          <button
            key={e.matricule}
            onClick={() => onSelect(e)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2
              transition-all text-sm font-medium ${
              selected?.matricule === e.matricule
                ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center
              text-xs font-bold ${
              selected?.matricule === e.matricule
                ? 'bg-primary-100 text-primary-600'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {e.prenom?.[0]}{e.nom?.[0]}
            </div>
            {e.prenom} {e.nom}
            {selected?.matricule === e.matricule && (
              <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function ExercicesParent() {
  const { user } = useAuth()

  const [enfants,   setEnfants]   = useState([])
  const [selected,  setSelected]  = useState(null)
  const [epreuves,  setEpreuves]  = useState([])
  const [loadEnf,   setLoadEnf]   = useState(true)
  const [loadEpr,   setLoadEpr]   = useState(false)

  // ── Charger mes enfants ────────────────────────────────────────
  useEffect(() => {
    setLoadEnf(true)
    getMesEnfants()
      .then(({ data }) => {
        const list = data.enfants || data.data || []
        setEnfants(list)
        if (list.length > 0) setSelected(list[0])
      })
      .catch(() => toast.error('Impossible de charger vos enfants.'))
      .finally(() => setLoadEnf(false))
  }, [])

  // ── Charger les exercices de l'enfant sélectionné ─────────────
  const fetchEpreuves = useCallback(() => {
    if (!selected?.matricule) return
    setLoadEpr(true)
    getEpreuvesClasse({ matricule: selected.matricule })
      .then(({ data }) => setEpreuves(data.epreuves || data.data || []))
      .catch(() => toast.error('Impossible de charger les exercices.'))
      .finally(() => setLoadEpr(false))
  }, [selected?.matricule])

  useEffect(() => { fetchEpreuves() }, [fetchEpreuves])

  // ── Navigation entre enfants (touches clavier) ────────────────
  const naviguerEnfant = (direction) => {
    if (enfants.length <= 1) return
    const idx = enfants.findIndex(e => e.matricule === selected?.matricule)
    const next = direction === 'next'
      ? enfants[(idx + 1) % enfants.length]
      : enfants[(idx - 1 + enfants.length) % enfants.length]
    setSelected(next)
  }

  // ── Grouper par nature ─────────────────────────────────────────
  const groupes = epreuves.reduce((acc, ep) => {
    const key = ep.libelleNature || 'Autres'
    if (!acc[key]) acc[key] = []
    acc[key].push(ep)
    return acc
  }, {})

  const ordreNatures = ['Devoir Week End', 'Devoir Mercredi', 'Controle Continu', 'Examen', 'Autres']
  const naturesTriees = ordreNatures.filter(n => groupes[n])

  return (
    <div className="page-container">

      {/* ── En-tête ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Exercices & devoirs
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {selected
              ? `Exercices de ${selected.prenom} ${selected.nom}`
              : 'Choisissez un enfant'}
          </p>
        </div>
        {selected && (
          <div className="flex items-center gap-2">
            {/* Navigation entre enfants */}
            {enfants.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => naviguerEnfant('prev')}
                  className="btn-icon" title="Enfant précédent">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-400 px-2">
                  {enfants.findIndex(e => e.matricule === selected.matricule) + 1}
                  /{enfants.length}
                </span>
                <button
                  onClick={() => naviguerEnfant('next')}
                  className="btn-icon" title="Enfant suivant">
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
            <button onClick={fetchEpreuves} className="btn-icon" title="Actualiser">
              <RefreshCw size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Chargement enfants ────────────────────────────────────── */}
      {loadEnf ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full rounded-2xl" />
          <div className="skeleton h-10 w-2/3 rounded-xl" />
        </div>
      ) : enfants.length === 0 ? (
        <div className="card p-8 text-center">
          <AlertCircle size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            Aucun enfant associé à votre compte.
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Contactez l'administration pour lier votre compte à vos enfants.
          </p>
        </div>
      ) : (
        <>
          {/* ── Sélecteur enfant ──────────────────────────────────── */}
          <EnfantSelector
            enfants={enfants}
            selected={selected}
            onSelect={(e) => { setSelected(e); setEpreuves([]) }}
          />

          {/* ── Contenu exercices ─────────────────────────────────── */}
          {loadEpr ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card p-4 flex items-start gap-3">
                  <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-2/3 rounded" />
                    <div className="skeleton h-3 w-1/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : epreuves.length === 0 ? (
            <div className="card py-14 text-center">
              <BookOpen size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                Aucun exercice disponible pour {selected?.prenom}.
              </p>
              <p className="text-gray-400 text-xs mt-1">
                Les exercices sont publiés par les enseignants.
              </p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Résumé rapide */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl
                  px-3 py-2 text-sm text-gray-600">
                  <BookOpen size={14} className="text-gray-400" />
                  <span className="font-medium text-gray-900">{epreuves.length}</span>
                  exercice{epreuves.length > 1 ? 's' : ''} au total
                </div>
                {naturesTriees.map(n => (
                  <div key={n}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl
                      text-xs font-medium border ${natureStyle(n)}`}>
                    {groupes[n].length} {n}
                  </div>
                ))}
              </div>

              {/* Liste groupée par nature */}
              {naturesTriees.map(nature => (
                <div key={nature}>
                  <h2 className="text-xs font-semibold text-gray-500
                    uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full inline-block
                      ${nature === 'Examen' ? 'bg-purple-400'
                        : nature === 'Controle Continu' ? 'bg-blue-400'
                        : nature === 'Devoir Mercredi' ? 'bg-amber-400'
                        : nature === 'Devoir Week End' ? 'bg-emerald-400'
                        : 'bg-gray-400'}`} />
                    {nature}
                    <span className="text-gray-400 font-normal normal-case tracking-normal">
                      — {groupes[nature].length} exercice{groupes[nature].length > 1 ? 's' : ''}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {groupes[nature].map(ep => (
                      <EpreuveCard key={ep.idEpreuve} epreuve={ep} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}