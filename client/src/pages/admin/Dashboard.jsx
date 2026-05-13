import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Users, GraduationCap, UserCheck, School,
  TrendingUp, CreditCard, BookOpen, Clock,
} from 'lucide-react'
import {
  getOverview, getNotesByClasse, getNotesByMatiere,
  getPaymentsByMonth, getPaymentsByStatut, getReussiteByTrimestre,
  getTeachersRecap,
} from '../../services/statsService'
import { useAuth } from '../../context/AuthContext'
import { useYear } from '../../context/YearContext'
import toast from 'react-hot-toast'

// ── Couleurs graphiques ──────────────────────────────────────────
const COLORS_PIE  = ['#F59E0B', '#3B82F6', '#10B981']
const COLOR_BLUE  = '#1E3A5F'
const COLOR_GREEN = '#10B981'
const COLOR_RED   = '#EF4444'

// ── Composant carte stat ─────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, loading }) {
  const VisualIcon = Icon;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <VisualIcon size={20} className="text-white" />
        </div>
      </div>
      {loading
        ? <div className="skeleton h-7 w-24 rounded mb-1" />
        : <p className="font-display text-2xl font-bold text-gray-900">{value}</p>
      }
      <p className="text-gray-500 text-sm mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

// ── Tooltip personnalisé ─────────────────────────────────────────
function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-medium text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name} : {prefix}{Number(p.value).toLocaleString('fr-FR')}{suffix}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { selectedYear } = useYear()
  const isAdmin  = user?.role === 'admin'
  const ANNEE = selectedYear?.libelle || '2024-2025'

  const [overview,      setOverview]      = useState(null)
  const [notesByClasse, setNotesByClasse] = useState([])
  const [notesByMat,    setNotesByMat]    = useState([])
  const [payByMonth,    setPayByMonth]    = useState([])
  const [payByStatut,   setPayByStatut]   = useState([])
  const [reussite,      setReussite]      = useState([])
  const [teachers,      setTeachers]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [trimestre,     setTrimestre]     = useState('')

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return }

    const params = { annee_scolaire: ANNEE, ...(trimestre ? { trimestre } : {}) }

    Promise.all([
      getOverview(),
      getNotesByClasse(params),
      getNotesByMatiere(params),
      getPaymentsByMonth({ annee: new Date().getFullYear() }),
      getPaymentsByStatut(),
      getReussiteByTrimestre({ annee_scolaire: ANNEE }),
      getTeachersRecap(),
    ])
      .then(([ov, nc, nm, pm, ps, rt, tr]) => {
        setOverview(ov.data.data)
        setNotesByClasse(nc.data.data)
        setNotesByMat(nm.data.data)
        setPayByMonth(pm.data.data)
        setPayByStatut(ps.data.data)
        setReussite(rt.data.data)
        setTeachers(tr.data.data)
      })
      .catch(() => toast.error('Erreur chargement statistiques.'))
      .finally(() => setLoading(false))
  }, [isAdmin, trimestre, selectedYear])

  const fmt = (n) => Number(n || 0).toLocaleString('fr-FR')

  if (!isAdmin) {
    return (
      <div className="page-container">
        <h1 className="font-display text-2xl font-semibold text-gray-900 mb-1">
          Tableau de bord
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Bienvenue, {user?.prenom} {user?.nom}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {user?.role === 'parent' && (
            <>
              <button onClick={() => navigate('/mon-enfant')}
                className="card p-8 text-center hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-transparent hover:border-primary-200 group">
                <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                  <Users size={32} />
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900">Mes enfants</h3>
                <p className="text-gray-500 text-sm mt-2">Suivez les notes, bulletins et exercices de vos enfants.</p>
              </button>

              <button onClick={() => navigate('/paiements')}
                className="card p-8 text-center hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-transparent hover:border-emerald-200 group">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <CreditCard size={32} />
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900">Mes paiements</h3>
                <p className="text-gray-500 text-sm mt-2">Consultez l'historique et effectuez vos règlements scolarité.</p>
              </button>
            </>
          )}

          {user?.role === 'teacher' && (
            <>
              <button onClick={() => navigate('/grades')}
                className="card p-8 text-center hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-transparent hover:border-blue-200 group">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <BookOpen size={32} />
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900">Saisie des notes</h3>
                <p className="text-gray-500 text-sm mt-2">Enregistrez les évaluations pour vos classes et matières.</p>
              </button>

              <button onClick={() => navigate('/planning')}
                className="card p-8 text-center hover:shadow-xl hover:scale-[1.02] transition-all border-2 border-transparent hover:border-amber-200 group">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Clock size={32} />
                </div>
                <h3 className="font-display text-lg font-bold text-gray-900">Mon planning</h3>
                <p className="text-gray-500 text-sm mt-2">Consultez votre emploi du temps et vos cours à venir.</p>
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Année scolaire {ANNEE}
          </p>
        </div>
        <select value={trimestre} onChange={e => setTrimestre(e.target.value)}
          className="select-field w-40">
          <option value="">Tous les trimestres</option>
          <option value="1">Trimestre 1</option>
          <option value="2">Trimestre 2</option>
          <option value="3">Trimestre 3</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard loading={loading} label="Élèves inscrits"
          value={overview?.students ?? '—'}
          icon={Users} color="bg-primary-500" />
        <StatCard loading={loading} label="Enseignants actifs"
          value={overview?.teachers ?? '—'}
          icon={GraduationCap} color="bg-blue-500" />
        <StatCard loading={loading} label="Parents"
          value={overview?.parents ?? '—'}
          icon={UserCheck} color="bg-purple-500" />
        <StatCard loading={loading} label="Classes"
          value={overview?.classes ?? '—'}
          icon={School} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard loading={loading} label="Taux de réussite"
          value={overview ? `${overview.taux_reussite}%` : '—'}
          icon={TrendingUp} color="bg-emerald-500"
          sub={`${overview?.nb_admis ?? 0} admis / ${overview?.nb_echec ?? 0} échec`} />
        <StatCard loading={loading} label="Moyenne générale"
          value={overview ? `${overview.moyenne_generale}/20` : '—'}
          icon={BookOpen} color="bg-cyan-500" />
        <StatCard loading={loading} label="Taux de collecte"
          value={overview ? `${overview.taux_collecte}%` : '—'}
          icon={CreditCard} color="bg-green-500"
          sub={`${fmt(overview?.total_paye)} / ${fmt(overview?.total_attendu)} FCFA`} />
        <StatCard loading={loading} label="Comptes en attente"
          value={overview?.pending_accounts ?? '—'}
          icon={Clock}
          color={overview?.pending_accounts > 0 ? 'bg-red-500' : 'bg-gray-400'}
          sub={overview?.pending_accounts > 0 ? 'Validation requise' : 'Tout est à jour'} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">
            Paiements mensuels (FCFA)
          </h2>
          {loading ? (
            <div className="skeleton h-56 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={payByMonth} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }}
                  tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<CustomTooltip suffix=" FCFA" />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="attendu" name="Attendu" fill="#E2E8F0" radius={[4,4,0,0]} />
                <Bar dataKey="paye"    name="Payé"    fill={COLOR_GREEN} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">
            Évolution taux de réussite
          </h2>
          {loading ? (
            <div className="skeleton h-56 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={reussite} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="trimestre" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }}
                  tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="taux" name="Taux réussite (%)"
                  stroke={COLOR_BLUE} strokeWidth={2.5}
                  dot={{ fill: COLOR_BLUE, r: 5 }}
                  activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="moyenne" name="Moyenne /20"
                  stroke={COLOR_GREEN} strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: COLOR_GREEN, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">
            Répartition des paiements
          </h2>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : payByStatut.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Aucun paiement
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={payByStatut}
                  cx="50%" cy="50%"
                  innerRadius={40} outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {payByStatut.map((_, i) => (
                    <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} paiement(s)`, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold text-gray-700 text-sm mb-4">
            Moyenne par matière
          </h2>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : notesByMat.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Aucune note validée
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart
                data={notesByMat.filter(m => m.total_notes > 0)}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 60, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="matiere" tick={{ fontSize: 11 }} width={70} />
                <Tooltip content={<CustomTooltip suffix="/20" />} />
                <Bar dataKey="moyenne" name="Moyenne" radius={[0,4,4,0]}
                  fill={COLOR_BLUE}>
                  {notesByMat.filter(m => m.total_notes > 0).map((m, i) => (
                    <Cell key={i}
                      fill={parseFloat(m.moyenne) >= 10 ? COLOR_GREEN : COLOR_RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 text-sm">
            Récapitulatif enseignants
          </h2>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-4 flex-1 rounded" />
              </div>
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            Aucun enseignant actif.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Enseignant','Classe','Matières','Notes','Moyenne','Salaire'].map(h => (
                    <th key={h}
                      className="text-left font-medium text-gray-500 px-5 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teachers.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center
                          justify-center text-blue-600 text-xs font-semibold shrink-0">
                          {t.prenom?.[0]}{t.nom?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 leading-none">
                            {t.prenom} {t.nom}
                          </p>
                          <p className="text-gray-400 text-[10px] mt-1">{t.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="badge bg-blue-50 text-blue-700">
                        {t.classe_nom || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs min-w-[120px]">
                      {t.matieres || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-center font-semibold text-gray-900">
                      {t.nb_notes}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span className={`font-semibold
                        ${parseFloat(t.moyenne_notes) >= 10
                          ? 'text-emerald-600' : 'text-red-500'}`}>
                        {t.moyenne_notes}/20
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {t.salaire_statut === 'paye'
                        ? <span className="badge bg-emerald-50 text-emerald-700">✓ Payé</span>
                        : t.salaire_montant
                          ? <span className="badge bg-red-50 text-red-600">Non payé</span>
                          : <span className="text-gray-400 text-xs">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}