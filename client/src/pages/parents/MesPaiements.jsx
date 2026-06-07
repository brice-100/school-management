import { useState, useEffect, useCallback } from 'react'
import { CreditCard, RefreshCw, AlertCircle, CheckCircle, Clock, TrendingDown } from 'lucide-react'
import { getDetailsEnfants, getPaiementSummary } from '../../services/paymentService'
import { useAuth } from '../../context/AuthContext'
import { useYear } from '../../context/YearContext'
import toast from 'react-hot-toast'

const fmt = (n) =>
  Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0 }) + ' FCFA'

// ── Barre de progression de paiement ─────────────────────────────
function ProgressBar({ paid, total }) {
  const pct = total > 0 ? Math.min((paid / total) * 100, 100) : 0
  const color =
    pct >= 100 ? 'bg-emerald-500' :
    pct >= 50  ? 'bg-amber-500'   : 'bg-red-500'
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{pct.toFixed(0)}% réglé</span>
        <span>{fmt(paid)} / {fmt(total)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Statut badge ─────────────────────────────────────────────────
function StatutBadge({ reste }) {
  if (reste <= 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
      <CheckCircle size={12} /> À jour
    </span>
  )
  if (reste < 50000) return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
      <Clock size={12} /> Partiel
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700">
      <AlertCircle size={12} /> En retard
    </span>
  )
}

// ── Carte récapitulatif par enfant ───────────────────────────────
function EnfantCard({ enfant }) {
  return (
    <div className="card p-5 space-y-4">
      {/* En-tête enfant */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center
            justify-center text-primary-700 font-bold text-base shrink-0">
            {enfant.prenom?.[0]}{enfant.nom?.[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-900">
              {enfant.prenom} {enfant.nom}
            </p>
            <p className="text-xs text-gray-400">
              Classe : <span className="font-medium text-gray-600">{enfant.classe || '—'}</span>
              {' · '}Matricule : <span className="font-mono text-xs">{enfant.matricule}</span>
            </p>
          </div>
        </div>
        <StatutBadge reste={enfant.reste_a_payer} />
      </div>

      {/* Détail des montants */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Frais d'inscription</p>
          <p className="text-sm font-bold text-gray-800">{fmt(enfant.inscription_due)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-1">Pension / tranche</p>
          <p className="text-sm font-bold text-gray-800">{fmt(enfant.pension_mensuelle)}</p>
          <p className="text-xs text-gray-400">× {enfant.nbre_tranches} tranches</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-xs text-blue-500 mb-1">Total annuel dû</p>
          <p className="text-sm font-bold text-blue-700">{fmt(enfant.total_annuel_du)}</p>
        </div>
        <div className={`rounded-xl p-3 ${enfant.reste_a_payer <= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-xs mb-1 ${enfant.reste_a_payer <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {enfant.reste_a_payer <= 0 ? 'Soldé ✓' : 'Reste à payer'}
          </p>
          <p className={`text-sm font-bold ${enfant.reste_a_payer <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {fmt(Math.max(0, enfant.reste_a_payer))}
          </p>
        </div>
      </div>

      {/* Barre de progression */}
      <ProgressBar paid={enfant.total_paye} total={enfant.total_annuel_du} />
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────
export default function MesPaiements() {
  const { user } = useAuth()
  const { selectedYear } = useYear()

  const [details,  setDetails]  = useState([])
  const [summary,  setSummary]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = selectedYear?.idAnnee ? { idAca: selectedYear.idAnnee } : {}
      const [detRes, sumRes] = await Promise.all([
        getDetailsEnfants(params),
        getPaiementSummary(params),
      ])
      setDetails(detRes.data?.data || [])
      setSummary(sumRes.data?.data || null)
    } catch {
      toast.error('Impossible de charger les informations de paiement.')
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  useEffect(() => { fetchData() }, [fetchData])

  const totalDu    = summary?.totalDue    ?? details.reduce((s, e) => s + e.total_annuel_du, 0)
  const totalPaye  = summary?.totalPaid   ?? details.reduce((s, e) => s + e.total_paye, 0)
  const totalReste = summary?.remaining   ?? (totalDu - totalPaye)

  return (
    <div className="page-container max-w-4xl">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Mes paiements
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Bonjour {user?.prenom} — aperçu financier de votre ou vos enfant(s)
          </p>
        </div>
        <button onClick={fetchData} disabled={loading} className="btn-icon" title="Actualiser">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Résumé Global ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-5 border-l-4 border-blue-400">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <CreditCard size={18} className="text-blue-500" />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total annuel dû</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(totalDu)}</p>
          <p className="text-xs text-gray-400 mt-1">Pour {details.length} enfant(s)</p>
        </div>

        <div className="card p-5 border-l-4 border-emerald-400">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Déjà payé</p>
          </div>
          <p className="text-2xl font-bold text-emerald-700">{fmt(totalPaye)}</p>
          <p className="text-xs text-gray-400 mt-1">Paiements validés</p>
        </div>

        <div className={`card p-5 border-l-4 ${totalReste <= 0 ? 'border-emerald-400' : 'border-red-400'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${totalReste <= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <TrendingDown size={18} className={totalReste <= 0 ? 'text-emerald-500' : 'text-red-500'} />
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {totalReste <= 0 ? 'Compte soldé' : 'Reste à payer'}
            </p>
          </div>
          <p className={`text-2xl font-bold ${totalReste <= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {fmt(Math.max(0, totalReste))}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {totalReste <= 0 ? 'Aucun impayé 🎉' : 'Montant restant à régler'}
          </p>
        </div>
      </div>

      {/* ── Détail par enfant ──────────────────────────────────── */}
      <div className="mb-4">
        <h2 className="font-semibold text-gray-800 text-base">Détail par enfant</h2>
        <p className="text-gray-400 text-xs mt-0.5">
          Les montants sont calculés selon les tarifs fixés pour chaque classe.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="skeleton h-44 rounded-2xl" />
          ))}
        </div>
      ) : details.length === 0 ? (
        <div className="card py-14 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard size={24} className="text-gray-300" />
          </div>
          <h3 className="font-medium text-gray-600 mb-1">Aucune information disponible</h3>
          <p className="text-gray-400 text-sm">
            Aucun enfant inscrit ou aucun tarif défini pour leur classe.<br />
            Contactez l'administration pour plus d'informations.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {details.map(enfant => (
            <EnfantCard key={enfant.matricule} enfant={enfant} />
          ))}
        </div>
      )}

      {/* Note bas de page */}
      {details.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-6">
          Les montants affichés sont basés sur les tarifs de scolarité définis par l'établissement.
          Pour toute question, contactez le service administratif.
        </p>
      )}
    </div>
  )
}
