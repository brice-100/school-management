import { useState, useEffect } from 'react'
import { Download, Star, Award, BookOpen, TrendingUp, User, ChevronDown } from 'lucide-react'
import { getBulletinData, downloadBulletinPDF } from '../../services/bulletinService'
import { getStudents } from '../../services/studentService'
import { getClasses } from '../../services/classService'
import { useYear } from '../../context/YearContext'
import toast from 'react-hot-toast'

const TRIMESTRES = [1, 2, 3]

const MENTION_CONFIG = {
  'Très Bien':  { color: 'from-emerald-400 to-teal-500',   bg: 'bg-emerald-50',  text: 'text-emerald-700',  icon: '🏆' },
  'Bien':       { color: 'from-blue-400 to-indigo-500',    bg: 'bg-blue-50',     text: 'text-blue-700',     icon: '⭐' },
  'Assez Bien': { color: 'from-amber-400 to-orange-500',   bg: 'bg-amber-50',    text: 'text-amber-700',    icon: '👍' },
  'Passable':   { color: 'from-yellow-400 to-amber-500',   bg: 'bg-yellow-50',   text: 'text-yellow-700',   icon: '✓'  },
  'Insuffisant':{ color: 'from-red-400 to-rose-500',       bg: 'bg-red-50',      text: 'text-red-700',      icon: '📚' },
  '—':          { color: 'from-gray-300 to-gray-400',      bg: 'bg-gray-50',     text: 'text-gray-500',     icon: '—'  },
}

const NOTE_COLOR = (v) => {
  const n = parseFloat(v)
  if (n >= 16) return 'text-emerald-600 bg-emerald-50'
  if (n >= 12) return 'text-blue-600 bg-blue-50'
  if (n >= 10) return 'text-amber-600 bg-amber-50'
  return 'text-red-500 bg-red-50'
}

// Avatar avec initiales colorées
function Avatar({ nom, prenom, photo, size = 'md', color = 'blue' }) {
  const BASE = import.meta.env.VITE_API_URL.replace('/api', '')
  const SIZES = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-20 h-20 text-xl', xl: 'w-28 h-28 text-3xl' }
  const COLORS = {
    blue:   'from-blue-400 to-blue-600',
    green:  'from-emerald-400 to-teal-600',
    purple: 'from-purple-400 to-violet-600',
    orange: 'from-orange-400 to-amber-600',
  }
  const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`

  if (photo) {
    return (
      <img
        src={`${BASE}/${photo}`}
        alt={`${prenom} ${nom}`}
        className={`${SIZES[size]} rounded-full object-cover ring-2 ring-white shadow-md flex-shrink-0`}
      />
    )
  }
  return (
    <div className={`${SIZES[size]} rounded-full bg-gradient-to-br ${COLORS[color]}
      flex items-center justify-center text-white font-bold ring-2 ring-white shadow-md flex-shrink-0`}>
      {initials}
    </div>
  )
}

// Barre de note animée
function NoteBar({ value, max = 20 }) {
  const pct = Math.min(100, (parseFloat(value) / max) * 100)
  const color = pct >= 80 ? 'from-emerald-400 to-teal-500'
    : pct >= 60 ? 'from-blue-400 to-indigo-500'
    : pct >= 50 ? 'from-amber-400 to-orange-500'
    : 'from-red-400 to-rose-500'
  return (
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function BulletinPage() {
  const { annees, selectedYear } = useYear()
  const [classes,    setClasses]    = useState([])
  const [students,   setStudents]   = useState([])
  const [classeId,   setClasseId]   = useState('')
  const [studentId,  setStudentId]  = useState('')
  const [trimestre,  setTrimestre]  = useState(1)
  const [annee,      setAnnee]      = useState('')
  const [bulletin,   setBulletin]   = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [downloading,setDownloading]= useState(false)

  useEffect(() => {
    if (selectedYear) {
      setAnnee(selectedYear.libelle)
      // On réinitialise le bulletin si l'année change
      setBulletin(null)
    }
  }, [selectedYear])

  useEffect(() => {
    getClasses().then(({ data }) => setClasses(data.data || []))
  }, [])

  useEffect(() => {
    if (!classeId) return
    getStudents({ classe_id: classeId })
      .then(({ data }) => setStudents(data.data || []))
    setStudentId('')
    setBulletin(null)
  }, [classeId])

  const handleLoad = async () => {
    if (!studentId) return toast.error('Sélectionnez un élève.')
    setLoading(true)
    try {
      const { data } = await getBulletinData(studentId, { trimestre, annee_scolaire: annee })
      setBulletin(data.data)
    } catch { toast.error('Erreur chargement bulletin.') }
    finally { setLoading(false) }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadBulletinPDF(studentId, trimestre, annee)
      toast.success('PDF téléchargé !')
    } catch { toast.error('Erreur génération PDF.') }
    finally { setDownloading(false) }
  }

  const mention = bulletin?.mention || '—'
  const mConf   = MENTION_CONFIG[mention] || MENTION_CONFIG['—']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">

      {/* ── En-tête ────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
            flex items-center justify-center shadow-lg shadow-indigo-200">
            <BookOpen size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>
              Bulletins scolaires
            </h1>
            <p className="text-sm text-gray-500">Consultation et téléchargement des résultats</p>
          </div>
        </div>
      </div>

      {/* ── Sélecteurs ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Classe */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Classe
            </label>
            <div className="relative">
              <select value={classeId} onChange={e => setClasseId(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl
                  px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2
                  focus:ring-indigo-300 focus:border-indigo-300 pr-10 cursor-pointer">
                <option value="">— Choisir —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            </div>
          </div>

          {/* Élève */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Élève
            </label>
            <div className="relative">
              <select value={studentId} onChange={e => setStudentId(e.target.value)}
                disabled={!classeId}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl
                  px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2
                  focus:ring-indigo-300 focus:border-indigo-300 pr-10 cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">— Choisir —</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.prenom} {s.nom}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            </div>
          </div>

          {/* Trimestre */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Trimestre
            </label>
            <div className="flex gap-2">
              {TRIMESTRES.map(t => (
                <button key={t} onClick={() => setTrimestre(t)}
                  className={`flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all
                    ${trimestre === t
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  T{t}
                </button>
              ))}
            </div>
          </div>

          {/* Année */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Année scolaire
            </label>
            <div className="relative">
              <select value={annee} onChange={e => setAnnee(e.target.value)}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl
                  px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2
                  focus:ring-indigo-300 focus:border-indigo-300 pr-10 cursor-pointer">
                {annees && annees.map(a => (
                  <option key={a.idAnnee} value={a.libelle}>{a.libelle}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={handleLoad} disabled={!studentId || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500
              to-purple-600 text-white rounded-2xl font-semibold text-sm shadow-md
              shadow-indigo-200 hover:shadow-lg hover:scale-105 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
            {loading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg> Chargement...</>
            ) : (
              <><BookOpen size={16} /> Afficher le bulletin</>
            )}
          </button>

          {bulletin && (
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-indigo-200
                text-indigo-600 rounded-2xl font-semibold text-sm hover:bg-indigo-50
                hover:border-indigo-300 transition-all disabled:opacity-50">
              <Download size={16} />
              {downloading ? 'Génération...' : 'Télécharger PDF'}
            </button>
          )}
        </div>
      </div>

      {/* ── Bulletin ───────────────────────────────────────────── */}
      {bulletin ? (
        <div className="space-y-5">

          {/* Carte profil élève + résumé */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Bandeau coloré en-tête */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 pb-10 relative">
              <div className="absolute inset-0 opacity-10"
                style={{backgroundImage:'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',backgroundSize:'20px 20px'}}/>
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Bulletin scolaire</p>
                  <h2 className="text-white text-2xl font-bold mt-0.5" style={{fontFamily:'Syne,sans-serif'}}>
                    Trimestre {bulletin.trimestre}
                  </h2>
                  <p className="text-indigo-200 text-sm">{bulletin.annee_scolaire}</p>
                </div>
                <div className={`px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30`}>
                  <span className="text-white font-bold text-lg">
                    {mConf.icon} {mention}
                  </span>
                </div>
              </div>
            </div>

            {/* Infos élève — remonte sur le bandeau */}
            <div className="px-6 pb-6 -mt-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5">
                <div className="flex flex-col sm:flex-row gap-5">

                  {/* Photo élève */}
                  <div className="flex items-center gap-4">
                    <Avatar
                      nom={bulletin.student.nom}
                      prenom={bulletin.student.prenom}
                      photo={bulletin.student.photo}
                      size="xl"
                      color="blue"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700
                          text-xs font-bold rounded-full uppercase tracking-wide">
                          Élève
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>
                        {bulletin.student.prenom} {bulletin.student.nom}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Classe : <span className="font-semibold text-indigo-600">
                          {bulletin.student.classe_nom || '—'}
                        </span>
                      </p>
                      {bulletin.student.date_naissance && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Né(e) le {new Date(bulletin.student.date_naissance).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Séparateur */}
                  <div className="hidden sm:block w-px bg-gray-100 self-stretch mx-2" />

                  {/* Parent avec photo */}
                  <div className="flex items-center gap-4 sm:border-l-0">
                    <Avatar
                      nom={bulletin.student.parent_nom}
                      prenom={bulletin.student.parent_prenom}
                      photo={bulletin.student.parent_photo}
                      size="lg"
                      color="green"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700
                          text-xs font-bold rounded-full uppercase tracking-wide">
                          Parent
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900">
                        {bulletin.student.parent_prenom || '—'} {bulletin.student.parent_nom || ''}
                      </h4>
                      {bulletin.student.telephone && (
                        <p className="text-sm text-gray-500">📞 {bulletin.student.telephone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Résumé performances */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Moyenne générale',
                value: bulletin.moyenne ? `${bulletin.moyenne}/20` : '—',
                icon: <Star size={20}/>,
                color: 'from-amber-400 to-orange-500',
                bg: 'bg-amber-50',
                text: 'text-amber-600',
              },
              {
                label: 'Mention',
                value: mention,
                icon: <Award size={20}/>,
                color: `bg-gradient-to-br ${mConf.color}`,
                bg: mConf.bg,
                text: mConf.text,
                raw: true,
              },
              {
                label: 'Décision',
                value: bulletin.moyenne
                  ? bulletin.admis ? 'Admis(e)' : 'Non admis(e)'
                  : '—',
                icon: <TrendingUp size={20}/>,
                color: bulletin.admis ? 'from-emerald-400 to-teal-500' : 'from-red-400 to-rose-500',
                bg: bulletin.admis ? 'bg-emerald-50' : 'bg-red-50',
                text: bulletin.admis ? 'text-emerald-600' : 'text-red-500',
              },
              {
                label: 'Matières évaluées',
                value: bulletin.nb_matieres || 0,
                icon: <BookOpen size={20}/>,
                color: 'from-indigo-400 to-purple-500',
                bg: 'bg-indigo-50',
                text: 'text-indigo-600',
              },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4
                flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stat.color}
                  flex items-center justify-center text-white shadow-md`}>
                  {stat.icon}
                </div>
                <div className={`text-xl font-bold ${stat.text}`} style={{fontFamily:'Syne,sans-serif'}}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tableau des notes */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h3 className="font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>
                📊 Résultats par matière
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {bulletin.notes.length} matière(s) — Trimestre {bulletin.trimestre}
              </p>
            </div>

            {bulletin.notes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-3">📚</div>
                <p className="text-gray-500 text-sm">Aucune note validée pour ce trimestre.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {bulletin.notes.map((note, i) => (
                  <div key={note.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">

                    {/* Numéro */}
                    <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center
                      text-xs font-bold text-gray-500 flex-shrink-0">
                      {i + 1}
                    </div>

                    {/* Matière */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {note.matiere_nom}
                      </p>
                      {/* Enseignant avec mini avatar */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-300
                          to-purple-400 flex items-center justify-center text-white text-xs flex-shrink-0">
                          {note.teacher_prenom?.[0]}
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {note.teacher_prenom} {note.teacher_nom}
                        </p>
                      </div>
                    </div>

                    {/* Barre de progression — masquée sur mobile */}
                    <div className="hidden md:flex flex-1 items-center gap-3 max-w-xs">
                      <NoteBar value={note.valeur} />
                    </div>

                    {/* Note */}
                    <div className={`px-3 py-1.5 rounded-2xl text-sm font-bold flex-shrink-0
                      ${NOTE_COLOR(note.valeur)}`}>
                      {parseFloat(note.valeur).toFixed(2)}<span className="text-xs font-normal opacity-70">/20</span>
                    </div>

                    {/* Statut */}
                    <div className={`hidden sm:block px-2.5 py-1 rounded-xl text-xs font-semibold flex-shrink-0
                      ${note.statut === 'valide'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'}`}>
                      {note.statut === 'valide' ? '✓ Validée' : 'Brouillon'}
                    </div>

                    {/* Commentaire */}
                    {note.commentaire && (
                      <div className="hidden lg:block max-w-32 truncate text-xs text-gray-400 italic">
                        "{note.commentaire}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pied de tableau avec moyenne */}
            {bulletin.notes.length > 0 && bulletin.moyenne && (
              <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50
                border-t border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-500 fill-amber-500" />
                  <span className="text-sm font-semibold text-gray-700">Moyenne générale du trimestre</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-indigo-600" style={{fontFamily:'Syne,sans-serif'}}>
                    {bulletin.moyenne}
                  </span>
                  <span className="text-gray-400 text-sm">/20</span>
                  <span className={`px-3 py-1 rounded-2xl text-sm font-bold ${mConf.bg} ${mConf.text}`}>
                    {mConf.icon} {mention}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section signatures */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="h-16 border-b-2 border-dashed border-gray-200 mb-3 flex items-end justify-center pb-2">
                  <p className="text-gray-300 text-xs italic">Signature</p>
                </div>
                <p className="text-sm font-semibold text-gray-600">Le Directeur</p>
              </div>
              <div className="text-center">
                {/* Parent avec photo dans la signature */}
                <div className="h-16 border-b-2 border-dashed border-gray-200 mb-3 flex items-end justify-center gap-2 pb-2">
                  <Avatar
                    nom={bulletin.student.parent_nom}
                    prenom={bulletin.student.parent_prenom}
                    photo={bulletin.student.parent_photo}
                    size="sm"
                    color="green"
                  />
                  <p className="text-gray-400 text-xs italic">Lu et approuvé</p>
                </div>
                <p className="text-sm font-semibold text-gray-600">
                  {bulletin.student.parent_prenom} {bulletin.student.parent_nom}
                </p>
                <p className="text-xs text-gray-400">Parent / Tuteur</p>
              </div>
            </div>

            {/* Tampon généré */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <p className="text-xs text-gray-400">
                Document généré le {new Date().toLocaleDateString('fr-FR')} — ÉcoleManager
              </p>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </div>
          </div>

        </div>
      ) : (
        /* État vide */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100
            flex items-center justify-center mb-5 shadow-inner">
            <BookOpen size={40} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2" style={{fontFamily:'Syne,sans-serif'}}>
            Aucun bulletin chargé
          </h3>
          <p className="text-sm text-gray-400 max-w-sm">
            Sélectionnez une classe, un élève et un trimestre, puis cliquez sur
            <strong className="text-indigo-600"> "Afficher le bulletin"</strong>.
          </p>
        </div>
      )}
    </div>
  )
}