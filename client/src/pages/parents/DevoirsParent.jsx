import { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, Calendar, FileText, ChevronLeft, ChevronRight,
  ExternalLink, RefreshCw, AlertCircle, User, X
} from 'lucide-react'
import { getMesEnfants } from '../../services/parentService'
import { getDevoirs } from '../../services/devoirService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'long', year: 'numeric',
}) : null

const getFileUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http')) return url;
  const baseUrl = import.meta.env.VITE_API_URL.replace('/api', '');
  return `${baseUrl}${url}`;
};

// ── Carte Devoir ──────────────────────────────────────────────────
function DevoirCard({ devoir, onClick }) {
  const isLate = devoir.date_rendu && new Date(devoir.date_rendu) < new Date();

  return (
    <div
      onClick={onClick}
      className="card p-5 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between cursor-pointer border"
    >
      <div>
        <div className="flex justify-between items-start gap-2 mb-3">
          <span className="badge bg-indigo-50 text-indigo-700 text-xs">
            {devoir.cours_nom}
          </span>
          <span className="badge bg-gray-50 text-gray-600 text-xs font-semibold">
            {devoir.classe_nom}
          </span>
        </div>

        <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-1">
          {devoir.titre}
        </h3>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-3">
          {devoir.description || 'Aucune consigne détaillée spécifiée.'}
        </p>
      </div>

      <div className="border-t border-gray-50 pt-4 mt-2">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1.5 font-medium text-gray-700">
            <User size={13} className="text-gray-400" />
            Par : {devoir.enseignant_nom}
          </span>
          
          <span className="flex items-center gap-1">
            <Calendar size={13} />
            À rendre le : 
            <span className={`font-bold ${isLate ? 'text-red-500' : 'text-indigo-600'}`}>
              {fmtDate(devoir.date_rendu)}
            </span>
          </span>
        </div>

        <div className="flex justify-between items-center mt-2">
          {devoir.urlDoc ? (
            <a
              href={getFileUrl(devoir.urlDoc)}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold
                text-primary-600 hover:text-primary-700 hover:underline transition-colors"
            >
              <ExternalLink size={12} />
              Télécharger les ressources
            </a>
          ) : (
            <span className="text-xs text-gray-300">Aucune pièce jointe</span>
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
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function DevoirsParent() {
  const { user } = useAuth()

  const [enfants, setEnfants] = useState([])
  const [selected, setSelected] = useState(null)
  const [devoirs, setDevoirs] = useState([])
  const [loadEnf, setLoadEnf] = useState(true)
  const [loadDev, setLoadDev] = useState(false)
  const [selectedDevoir, setSelectedDevoir] = useState(null)

  // Charger mes enfants
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

  // Charger les devoirs de l'enfant sélectionné
  const fetchDevoirs = useCallback(() => {
    if (!selected?.matricule) return
    setLoadDev(true)
    getDevoirs({ matricule: selected.matricule })
      .then(({ data }) => setDevoirs(data.data || []))
      .catch(() => toast.error('Impossible de charger les devoirs.'))
      .finally(() => setLoadDev(false))
  }, [selected?.matricule])

  useEffect(() => { fetchDevoirs() }, [fetchDevoirs])

  // Navigation entre enfants
  const naviguerEnfant = (direction) => {
    if (enfants.length <= 1) return
    const idx = enfants.findIndex(e => e.matricule === selected?.matricule)
    const next = direction === 'next'
      ? enfants[(idx + 1) % enfants.length]
      : enfants[(idx - 1 + enfants.length) % enfants.length]
    setSelected(next)
  }

  return (
    <div className="page-container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900" style={{fontFamily: 'Syne, sans-serif'}}>
            Cahier de Textes / Devoirs
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {selected
              ? `Exercices et devoirs de maison de ${selected.prenom} ${selected.nom}`
              : 'Choisissez un enfant'}
          </p>
        </div>
        {selected && (
          <div className="flex items-center gap-2">
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
            <button onClick={fetchDevoirs} className="btn-icon" title="Actualiser">
              <RefreshCw size={16} />
            </button>
          </div>
        )}
      </div>

      {loadEnf ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full rounded-2xl" />
          <div className="skeleton h-10 w-2/3 rounded-xl" />
        </div>
      ) : enfants.length === 0 ? (
        <div className="card p-8 text-center bg-white border border-gray-100">
          <AlertCircle size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Aucun enfant associé à votre compte.</p>
        </div>
      ) : (
        <>
          <EnfantSelector
            enfants={enfants}
            selected={selected}
            onSelect={(e) => { setSelected(e); setDevoirs([]) }}
          />

          {loadDev ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-5 space-y-4">
                  <div className="skeleton h-4 w-2/3 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                  <div className="skeleton h-12 w-full rounded" />
                </div>
              ))}
            </div>
          ) : devoirs.length === 0 ? (
            <div className="card py-16 text-center bg-white border border-gray-100">
              <BookOpen size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucun devoir à rendre pour {selected?.prenom}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devoirs.map(d => (
                <DevoirCard key={d.idDevoir} devoir={d} onClick={() => setSelectedDevoir(d)} />
              ))}
            </div>
          )}
        </>
      )}

      {selectedDevoir && (
        <DevoirDetailModal devoir={selectedDevoir} onClose={() => setSelectedDevoir(null)} />
      )}
    </div>
  )
}

// Modal pour afficher les détails du devoir avec aperçu d'image ou document
function DevoirDetailModal({ devoir, onClose }) {
  if (!devoir) return null
  const isLate = devoir.date_rendu && new Date(devoir.date_rendu) < new Date()
  
  // Vérifier si le document joint est une image
  const ext = devoir.urlDoc?.split('.').pop()?.toLowerCase()
  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)
  const isPdf = ext === 'pdf'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div>
            <span className="badge bg-indigo-50 text-indigo-700 text-xs mb-1 block w-max">
              {devoir.cours_nom}
            </span>
            <h3 className="font-display font-bold text-gray-900 text-xl">
              {devoir.titre}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon p-2 hover:bg-gray-100 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 flex-1">
          {/* Informations clefs */}
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl text-sm">
            <div>
              <p className="text-gray-400 text-xs">Enseignant</p>
              <p className="font-semibold text-gray-800">{devoir.enseignant_nom}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Date limite de rendu</p>
              <p className={`font-semibold ${isLate ? 'text-red-500' : 'text-indigo-600'}`}>
                {fmtDate(devoir.date_rendu)} {isLate && '(En retard)'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Consignes & Description
            </h4>
            <p className="text-gray-600 text-sm whitespace-pre-line bg-gray-50/50 p-4 rounded-2xl border border-gray-100 leading-relaxed">
              {devoir.description || 'Aucune consigne détaillée spécifiée.'}
            </p>
          </div>

          {/* Pièce jointe / Aperçu */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Fichier Joint / Aperçu
            </h4>
            {devoir.urlDoc ? (
              <div className="space-y-4">
                {isImage ? (
                  <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm bg-gray-50 p-2">
                    <img
                      src={getFileUrl(devoir.urlDoc)}
                      alt="Aperçu du devoir"
                      className="w-full max-h-[300px] object-contain rounded-xl"
                    />
                  </div>
                ) : isPdf ? (
                  <div className="flex flex-col items-center justify-center p-6 bg-indigo-50/50 border border-dashed border-indigo-100 rounded-2xl">
                    <FileText className="text-indigo-500 mb-2" size={36} />
                    <p className="text-sm font-semibold text-indigo-900">Document PDF joint</p>
                    <p className="text-xs text-indigo-600 mb-4">Cliquez ci-dessous pour ouvrir ou télécharger le PDF.</p>
                    <a
                      href={getFileUrl(devoir.urlDoc)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-100"
                    >
                      <ExternalLink size={12} /> Ouvrir le document
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
                    <FileText className="text-gray-400 mb-2" size={36} />
                    <p className="text-sm font-semibold text-gray-700">Ressource additionnelle</p>
                    <p className="text-xs text-gray-400 mb-4">Un fichier est joint à cet exercice.</p>
                    <a
                      href={getFileUrl(devoir.urlDoc)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-gray-200"
                    >
                      <ExternalLink size={12} /> Télécharger le fichier
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucune ressource ou image n'est jointe à cet exercice.</p>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 mt-6 flex justify-end">
          <button onClick={onClose} className="btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
