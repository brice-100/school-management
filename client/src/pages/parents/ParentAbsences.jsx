import { useState, useEffect, useCallback } from 'react'
import {
  AlertTriangle, Search, Plus, X, FileText, CheckCircle,
  Calendar, RefreshCw, AlertCircle, ExternalLink, HelpCircle
} from 'lucide-react'
import { getMesEnfants } from '../../services/parentService'
import { getRapports, getJustificatifs, createJustificatif } from '../../services/reportService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

// ── Modal justificatifs pour le parent ─────────────────────────────
function JustifierModal({ rapport, onClose, onSuccess }) {
  const [commentaire, setCommentaire] = useState('')
  const [urlDoc, setUrlDoc] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!commentaire.trim()) return toast.error('Veuillez entrer un commentaire explicatif.')
    
    setLoading(true)
    try {
      await createJustificatif({
        idRapport: rapport.idRap,
        commentaire,
        urlDoc: urlDoc.trim() || null
      })
      toast.success('Justification soumise avec succès ! L\'administrateur va l\'examiner.')
      onSuccess()
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la soumission.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-gray-900 text-lg">Justifier l'absence</h3>
            <p className="text-gray-400 text-xs mt-0.5">{rapport.libelle} du {fmtDate(rapport.event_date)}</p>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label font-semibold mb-1 block">Commentaire / Motif *</label>
            <textarea
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder="Expliquez la raison de l'absence ou du retard (ex: rendez-vous médical, panne de transport...)"
              rows={4}
              className="input-field w-full resize-none"
              required
            />
          </div>

          <div>
            <label className="form-label font-semibold mb-1 block">Lien du document justificatif (Optionnel)</label>
            <input
              value={urlDoc}
              onChange={e => setUrlDoc(e.target.value)}
              placeholder="Ex: Lien Drive/Dropbox vers un certificat médical..."
              className="input-field w-full"
            />
            <p className="text-[10px] text-gray-400 mt-1">Vous pouvez téléverser votre justificatif sur un drive et coller le lien d'accès direct ici.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Soumission...' : 'Soumettre à l\'administration'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function ParentAbsences() {
  const { user } = useAuth()

  const [enfants, setEnfants] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [rapports, setRapports] = useState([])
  const [justifsMap, setJustifsMap] = useState({}) // Associer idRapport -> list justificatifs
  const [loadEnf, setLoadEnf] = useState(true)
  const [loadRap, setLoadRap] = useState(false)
  const [selectedAbsence, setSelectedAbsence] = useState(null)

  // Charger mes enfants
  useEffect(() => {
    setLoadEnf(true)
    getMesEnfants()
      .then(({ data }) => {
        const list = data.enfants || data.data || []
        setEnfants(list)
        if (list.length > 0) setSelectedChild(list[0])
      })
      .catch(() => toast.error('Impossible de charger vos enfants.'))
      .finally(() => setLoadEnf(false))
  }, [])

  // Charger les rapports et leurs justifications
  const fetchRapports = useCallback(async () => {
    if (!selectedChild?.matricule) return
    setLoadRap(true)
    try {
      const { data } = await getRapports({ matricule: selectedChild.matricule })
      const list = data.rapports || data.data || []
      setRapports(list)

      // Charger les justificatifs pour chaque rapport pour connaître l'état précis
      const jMap = {}
      await Promise.all(
        list.map(async (r) => {
          try {
            const res = await getJustificatifs({ idRapport: r.idRap })
            jMap[r.idRap] = res.data.justificatifs || res.data.data || []
          } catch {}
        })
      )
      setJustifsMap(jMap)
    } catch {
      toast.error('Impossible de charger l\'historique des absences.')
    } finally {
      setLoadRap(false)
    }
  }, [selectedChild?.matricule])

  useEffect(() => { fetchRapports() }, [fetchRapports])

  return (
    <div className="page-container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900" style={{fontFamily: 'Syne, sans-serif'}}>
            Suivi des Absences & Retards
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {selectedChild
              ? `Historique et justifications de ${selectedChild.prenom} ${selectedChild.nom}`
              : 'Choisissez un enfant'}
          </p>
        </div>
        {selectedChild && (
          <button onClick={fetchRapports} className="btn-icon" title="Actualiser">
            <RefreshCw size={16} />
          </button>
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
          {/* Sélecteur enfant */}
          <div className="flex flex-wrap gap-2 mb-5">
            {enfants.map(e => (
              <button
                key={e.matricule}
                onClick={() => setSelectedChild(e)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2
                  transition-all text-sm font-medium ${
                  selectedChild?.matricule === e.matricule
                    ? 'border-rose-500 bg-rose-50/50 text-rose-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-rose-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center
                  text-xs font-bold ${
                  selectedChild?.matricule === e.matricule
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {e.prenom?.[0]}{e.nom?.[0]}
                </div>
                {e.prenom} {e.nom}
              </button>
            ))}
          </div>

          {/* Tableau d'historique */}
          <div className="card overflow-hidden">
            {loadRap ? (
              <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-1/3 rounded" />
                      <div className="skeleton h-3 w-1/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : rapports.length === 0 ? (
              <div className="py-14 text-center">
                <CheckCircle size={36} className="text-emerald-500/80 mx-auto mb-3" />
                <p className="text-gray-700 font-medium">Félicitations ! Aucun retard ou absence enregistré.</p>
                <p className="text-gray-400 text-xs mt-1">{selectedChild?.prenom} fait preuve d'une assiduité remarquable.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Date', 'Type d\'Assiduité', 'Détails / Commentaires', 'Statut Justification', 'Actions'].map(h => (
                      <th key={h} className="text-left font-semibold text-gray-500 px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rapports.map(r => {
                    const justifs = justifsMap[r.idRap] || []
                    const isJustified = r.justifie || justifs.some(j => j.idDirecteur !== null)
                    const hasPendingJustif = justifs.some(j => j.idDirecteur === null)

                    let statusBadge = (
                      <span className="badge bg-red-50 text-rose-700 border border-rose-100 font-semibold">
                        Non justifié
                      </span>
                    )
                    
                    if (isJustified) {
                      statusBadge = (
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                          Justifié ✓
                        </span>
                      )
                    } else if (hasPendingJustif) {
                      statusBadge = (
                        <span className="badge bg-amber-50 text-amber-700 border border-amber-100 font-semibold animate-pulse">
                          Justification en cours
                        </span>
                      )
                    }

                    // Nettoyage libellé (retirer heures si concaténées)
                    let cleanLib = r.libelle
                    let h = ''
                    if (r.libelle.includes('(') && r.libelle.includes(')')) {
                      const match = r.libelle.match(/\(([^)]+)\)/)
                      if (match) {
                        h = ` (${match[1]})`
                        cleanLib = r.libelle.split(' (')[0]
                      }
                    }

                    return (
                      <tr key={r.idRap} className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-5 py-4 text-gray-600 font-medium">{fmtDate(r.event_date)}</td>
                        <td className="px-5 py-4">
                          <span className={`badge ${cleanLib.includes('Retard') ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-rose-700'}`}>
                            {cleanLib}{h}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 max-w-xs truncate">
                          {r.commentaire || 'Aucun détail fourni.'}
                        </td>
                        <td className="px-5 py-4">{statusBadge}</td>
                        <td className="px-5 py-4">
                          {!isJustified && !hasPendingJustif ? (
                            <button
                              onClick={() => setSelectedAbsence(r)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shadow-rose-100"
                            >
                              <FileText size={12} /> Justifier en ligne
                            </button>
                          ) : hasPendingJustif && !isJustified ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-gray-400 font-semibold uppercase">Transmis le</span>
                              {justifs[0] && (
                                <span className="text-xs font-medium text-gray-600">{fmtDate(justifs[0].created_at)}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">Traitement finalisé</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Modal justificatif */}
      {selectedAbsence && (
        <JustifierModal
          rapport={selectedAbsence}
          onClose={() => setSelectedAbsence(null)}
          onSuccess={() => {
            setSelectedAbsence(null)
            fetchRapports()
          }}
        />
      )}
    </div>
  )
}
