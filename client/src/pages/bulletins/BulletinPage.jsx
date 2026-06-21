import { useState, useEffect } from 'react'
import { Download, Star, Award, BookOpen, Printer, User, ChevronDown } from 'lucide-react'
import { getBulletinData } from '../../services/bulletinService'
import { getStudents } from '../../services/studentService'
import { getClasses } from '../../services/classService'
import { useYear } from '../../context/YearContext'
import { useAuth } from '../../context/AuthContext'
import { getMesEnfants } from '../../services/parentService'
import toast from 'react-hot-toast'

const TRIMESTRES = [1, 2, 3]

export default function BulletinPage() {
  const { user } = useAuth()
  const isParent = user?.role === 'parent'
  const { annees, selectedYear } = useYear()
  const [classes,    setClasses]    = useState([])
  const [students,   setStudents]   = useState([])
  const [allMyChildren, setAllMyChildren] = useState([])
  const [classeId,   setClasseId]   = useState('')
  const [studentId,  setStudentId]  = useState('')
  const [trimestre,  setTrimestre]  = useState(1)
  const [annee,      setAnnee]      = useState('')
  const [bulletin,   setBulletin]   = useState(null)
  const [loading,    setLoading]    = useState(false)

  const yearOptions = annees?.length ? annees : (selectedYear ? [selectedYear] : [])

  useEffect(() => {
    if (selectedYear) {
      setAnnee(selectedYear.libelle)
      setBulletin(null)
    }
  }, [selectedYear])

  useEffect(() => {
    getClasses().then(({ data }) => setClasses(data.data || []))
  }, [])

  useEffect(() => {
    if (isParent) {
      getMesEnfants()
        .then(({ data }) => setAllMyChildren(data.data || []))
        .catch(err => console.error('Erreur chargement enfants:', err))
    }
  }, [isParent])

  useEffect(() => {
    if (!classeId) {
      setStudents([])
      return
    }
    if (isParent) {
      const selectedClassLibelle = classes.find(c => String(c.idClasse) === String(classeId))?.libelle
      const filteredKids = allMyChildren.filter(kid => 
        selectedClassLibelle && kid.classe === selectedClassLibelle
      )
      setStudents(filteredKids)
      setStudentId('')
      setBulletin(null)
    } else {
      getStudents({ classe_id: classeId })
        .then(({ data }) => setStudents(data.data || []))
      setStudentId('')
      setBulletin(null)
    }
  }, [classeId, isParent, allMyChildren, classes])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const m = params.get('matricule')
    if (m) setStudentId(m)
  }, [])

  useEffect(() => {
    if (studentId && annee) {
      handleLoad()
    }
  }, [studentId, annee])

  const handleLoad = async () => {
    if (!studentId) return toast.error('Sélectionnez un élève.')
    setLoading(true)
    try {
      const { data } = await getBulletinData(studentId, { trimestre, annee_scolaire: annee })
      setBulletin(data.data)
    } catch { 
      toast.error('Erreur chargement bulletin.') 
    } finally { 
      setLoading(false) 
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      
      {/* CSS pour l'impression */}
      <style>{`
        @media print {
          body { background: white !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .page-container { padding: 0 !important; box-shadow: none !important; border: none !important; }
          .bulletin-paper { 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 20mm !important; 
            box-shadow: none !important;
            border: none !important;
          }
          @page { size: A4; margin: 0; }
        }
        .bulletin-paper {
          background: white;
          max-width: 210mm;
          margin: 0 auto;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
          border: 1px solid #e2e8f0;
          min-height: 297mm;
          padding: 25px;
          color: #1e293b;
          font-family: 'Inter', sans-serif;
        }
      `}</style>

      {/* ── Sélecteurs (no-print) ────────────────────────────────── */}
      <div className="max-w-4xl mx-auto mb-8 no-print">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulletins scolaires</h1>
            <p className="text-gray-500">Gérez et éditez les résultats académiques</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Classe</label>
              <select value={classeId} onChange={e => setClasseId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                <option value="">— Choisir —</option>
                {classes.map(c => <option key={c.idClasse} value={c.idClasse}>{c.libelle}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Élève</label>
              <select value={studentId} onChange={e => setStudentId(e.target.value)} disabled={!classeId}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                <option value="">— Choisir —</option>
                {students.map(s => <option key={s.matricule} value={s.matricule}>{s.prenom} {s.nom}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Trimestre</label>
              <div className="flex gap-1">
                {TRIMESTRES.map(t => (
                  <button key={t} onClick={() => setTrimestre(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
                      ${trimestre === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    T{t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Année</label>
              <select value={annee} onChange={e => setAnnee(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">— Choisir une année —</option>
                {yearOptions.length > 0 ? (
                  yearOptions.map(a => <option key={a.idAnnee} value={a.libelle}>{a.libelle}</option>)
                ) : (
                  <option value="" disabled>Aucune année disponible</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleLoad} disabled={!studentId || loading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
              {loading ? 'Chargement...' : 'Générer le bulletin'}
            </button>
            {bulletin && (
              <button onClick={handlePrint}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold text-sm hover:bg-gray-50 transition-all flex items-center gap-2">
                <Printer size={16} /> Imprimer / PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Calculs des Totaux ────────────────────────────────────────────── */}
      {(() => {
        let totalComp = 0, totalCoef = 0, totalPoints = 0;
        if (bulletin?.notes) {
          bulletin.notes.forEach(n => {
            totalComp += n.comp !== null ? parseFloat(n.comp) : 0;
            totalCoef += n.coefficient || 1;
            totalPoints += (n.moyenne_matiere || 0) * (n.coefficient || 1);
          });
        }
        
        return bulletin ? (
        <div className="bulletin-paper">
          
          {/* 1. En-tête Officiel (République du Cameroun) */}
          <div className="flex justify-between text-[9px] font-bold uppercase leading-tight mb-4">
            <div className="text-center">
              RÉPUBLIQUE DU CAMEROUN<br/>
              Paix-Travail-Patrie<br/>
              *******<br/>
              Ministère de l'Éducation de Base<br/>
              Délégation Régionale de l'Adamaoua<br/>
              Délégation Départementale de la Vina
            </div>
            <div className="flex flex-col items-center">
               <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-1">
                 <img src="/logo-placeholder.png" alt="Logo" className="w-8 h-8 opacity-50" />
               </div>
               <div className="text-[11px] font-black tracking-tight text-center">
                 école publique de Biyem-assi<br/>
                 <span className="text-[8px] font-normal lowercase italic">Biyem-assi Tél: 0987654321</span>
               </div>
            </div>
            <div className="text-center">
              REPUBLIC OF CAMEROON<br/>
              Peace-Work-Fatherland<br/>
              *******<br/>
              Ministry of Basic Education<br/>
              Adamawa Regional Delegation<br/>
              Divisional Delegation of Vina Division
            </div>
          </div>

          <div className="text-center border-t border-b border-gray-900 py-1 mb-4">
            <h3 className="text-sm font-black uppercase">
              BULLETIN SCOLAIRE - {trimestre}{trimestre === 1 ? 'er' : 'ème'} TRIMESTRE
            </h3>
            <p className="text-[10px] font-bold">Année Scolaire: {bulletin.annee_scolaire}</p>
          </div>

          {/* 2. Informations de l'Élève */}
          <div className="border-2 border-gray-900 p-4 mb-4 relative flex justify-between">
            <div className="flex-1">
              <h4 className="text-[11px] font-black uppercase mb-3">Informations de l'élève</h4>
              <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                <div><span className="font-bold">Nom et Prénom:</span> <span className="uppercase">{bulletin.student.nom} {bulletin.student.prenom}</span></div>
                <div><span className="font-bold">Matricule:</span> {bulletin.student.matricule}</div>
                <div><span className="font-bold">Né(e) le:</span> {bulletin.student.date_naissance ? new Date(bulletin.student.date_naissance).toLocaleDateString() : '01/01/2010'} à {bulletin.student.lieu_naissance || 'Non spécifié'}</div>
                <div><span className="font-bold">Classe:</span> {bulletin.student.classe_nom}</div>
                <div><span className="font-bold">Enseignant(e) principal(e):</span> {bulletin.student.enseignant_nom || 'Jeanne Dongmo'}</div>
                <div><span className="font-bold">Effectif:</span> {bulletin.student.effectif || 54}</div>
              </div>
            </div>
            {/* Cadre Photo */}
            <div className="w-24 h-28 border-2 border-gray-900 bg-gray-50 flex items-center justify-center text-gray-300 relative">
               {bulletin.student.photo && bulletin.student.photo !== 'INDEFINI' ? (
                 <img 
                   src={import.meta.env.VITE_API_URL.replace('/api', '') + bulletin.student.photo} 
                   className="w-full h-full object-cover" 
                   alt="Photo élève"
                 />
               ) : (
                 <div className="text-center">
                   <User size={40} className="mx-auto" />
                   <p className="text-[6px] font-bold uppercase mt-1">Photo</p>
                 </div>
               )}
               <div className="absolute top-0 right-0 p-0.5 bg-gray-900 text-white text-[5px] font-bold">PHOTO</div>
            </div>
          </div>

          {/* 3. Tableau des Matières */}
          <div className="mb-6">
            <table className="w-full text-[9px] border-collapse border-2 border-gray-900">
              <thead>
                <tr className="bg-slate-200 uppercase font-black">
                  <th className="border border-gray-900 px-2 py-1.5 text-left w-1/4">Matières</th>
                  <th className="border border-gray-900 px-1 py-1.5 text-center">SEQ1</th>
                  <th className="border border-gray-900 px-1 py-1.5 text-center">SEQ2</th>
                  <th className="border border-gray-900 px-1 py-1.5 text-center">COMP</th>
                  <th className="border border-gray-900 px-1 py-1.5 text-center">MOY</th>
                  <th className="border border-gray-900 px-1 py-1.5 text-center">COEF</th>
                  <th className="border border-gray-900 px-1 py-1.5 text-center">TOTAL</th>
                  <th className="border border-gray-900 px-1 py-1.5 text-center">RANG</th>
                  <th className="border border-gray-900 px-2 py-1.5 text-left">Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {bulletin.notes.map((n, idx) => (
                  <tr key={idx} className="font-medium">
                    <td className="border border-gray-900 px-2 py-1">{n.matiere_nom}</td>
                    <td className="border border-gray-900 px-1 py-1 text-center">{n.seq1 !== null ? parseFloat(n.seq1).toFixed(2) : '—'}</td>
                    <td className="border border-gray-900 px-1 py-1 text-center">{n.seq2 !== null ? parseFloat(n.seq2).toFixed(2) : '—'}</td>
                    <td className="border border-gray-900 px-1 py-1 text-center">{n.comp !== null ? parseFloat(n.comp).toFixed(2) : '—'}</td>
                    <td className="border border-gray-900 px-1 py-1 text-center font-bold">{(n.moyenne_matiere || 0).toFixed(2)}</td>
                    <td className="border border-gray-900 px-1 py-1 text-center">{n.coefficient || 1}</td>
                    <td className="border border-gray-900 px-1 py-1 text-center">{(n.moyenne_matiere * (n.coefficient || 1)).toFixed(2)}</td>
                    <td className="border border-gray-900 px-1 py-1 text-center">{idx + 1}</td>
                    <td className="border border-gray-900 px-2 py-1 uppercase">{n.moyenne_matiere >= 10 ? 'Acquis' : 'Non acquis'}</td>
                  </tr>
                ))}
                {/* Ligne de total réel */}
                <tr className="bg-gray-100 font-black uppercase text-[10px]">
                  <td className="border border-gray-900 px-2 py-1">Total Général</td>
                  <td className="border border-gray-900 px-1 py-1 text-center">—</td>
                  <td className="border border-gray-900 px-1 py-1 text-center">—</td>
                  <td className="border border-gray-900 px-1 py-1 text-center">{totalComp > 0 ? totalComp.toFixed(2) : '—'}</td>
                  <td className="border border-gray-900 px-1 py-1 text-center">{parseFloat(bulletin.moyenne).toFixed(2)}</td>
                  <td className="border border-gray-900 px-1 py-1 text-center">{totalCoef}</td>
                  <td className="border border-gray-900 px-1 py-1 text-center">{totalPoints.toFixed(2)}</td>
                  <td className="border border-gray-900 px-1 py-1 text-center">—</td>
                  <td className="border border-gray-900 px-2 py-1 uppercase">{bulletin.mention}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 4. Sections de Résumé (Profil, Travail, Conduite) */}
          <div className="grid grid-cols-4 gap-0 border-2 border-gray-900 mb-6 text-[8px]">
            {/* Colonne 1 : Résultat Annuel */}
            <div className="border-r border-gray-900">
               <div className="bg-slate-200 border-b border-gray-900 p-1 font-black text-center uppercase">Résultat du trimestre</div>
               <div className="p-2 space-y-1">
                 <div className="flex justify-between"><span>Moyenne de l'élève</span> <span className="font-bold">{bulletin.moyenne} / 20</span></div>
                 <div className="flex justify-between"><span>Rang de l'élève</span> <span className="font-bold">{bulletin.stats?.rang || '—'} / {bulletin.student.effectif || 54}</span></div>
                 <div className="mt-4 text-center font-black text-[12px] uppercase">{bulletin.mention}</div>
               </div>
            </div>
            {/* Colonne 2 : Profil de la classe */}
            <div className="border-r border-gray-900">
               <div className="bg-slate-200 border-b border-gray-900 p-1 font-black text-center uppercase">Profil de la classe</div>
               <div className="p-2 space-y-1">
                 <div className="flex justify-between"><span>Moyenne {'>'}= 10</span> <span>{Math.round(parseFloat(bulletin.stats?.tauxReussite || 0) * (bulletin.student.effectif || 54) / 100)}</span></div>
                 <div className="flex justify-between"><span>Moyenne Classe</span> <span>{bulletin.stats?.moyenneClasse || '0.00'}</span></div>
                 <div className="flex justify-between"><span>% Réussite</span> <span>{bulletin.stats?.tauxReussite || '0%'}</span></div>
                 <div className="flex justify-between"><span>Moyenne Max</span> <span>{bulletin.stats?.moyenneMax || '0.00'}</span></div>
                 <div className="flex justify-between"><span>Moyenne Min</span> <span>{bulletin.stats?.moyenneMin || '0.00'}</span></div>
               </div>
            </div>
            {/* Colonne 3 : Travail de l'élève */}
            <div className="border-r border-gray-900">
               <div className="bg-slate-200 border-b border-gray-900 p-1 font-black text-center uppercase">Travail de l'élève</div>
               <div className="p-2 space-y-1">
                 <div className="flex justify-between"><span>Tableau d'Honneur</span> <span>{bulletin.travail?.tableauHonneur || 'Non'}</span></div>
                 <div className="flex justify-between"><span>T.H + Encouragement</span> <span>{bulletin.travail?.encouragement || 'Non'}</span></div>
                 <div className="flex justify-between"><span>T.H + Félicitation</span> <span>{bulletin.travail?.felicitation || 'Non'}</span></div>
                 <div className="flex justify-between"><span>Avertissement Travail</span> <span>{bulletin.travail?.avertissement || 'Non'}</span></div>
                 <div className="flex justify-between"><span>Blame Travail</span> <span>{bulletin.travail?.blame || 'Non'}</span></div>
               </div>
            </div>
            {/* Colonne 4 : Conduite */}
            <div>
               <div className="bg-slate-200 border-b border-gray-900 p-1 font-black text-center uppercase">Conduite de l'élève</div>
               <div className="p-2 space-y-1">
                 <div className="flex justify-between"><span>Absences Totales</span> <span>{bulletin.conduite?.absencesTotales || '0 H'}</span></div>
                 <div className="flex justify-between"><span>Absences NJ</span> <span>{bulletin.conduite?.absencesNJ || '0 H'}</span></div>
                 <div className="flex justify-between"><span>Exclusions</span> <span>{bulletin.conduite?.exclusions || '0 Jrs'}</span></div>
                 <div className="flex justify-between"><span>Aver. Conduite</span> <span>{bulletin.conduite?.avertissement || 'Non'}</span></div>
                 <div className="flex justify-between"><span>Blame Conduite</span> <span>{bulletin.conduite?.blame || 'Non'}</span></div>
               </div>
            </div>
          </div>

          {/* 5. Visas et Décisions */}
          <div className="grid grid-cols-3 border-2 border-gray-900 text-[9px] h-24">
            <div className="border-r border-gray-900 p-2">
              <p className="font-black uppercase text-center mb-10">Visa du parent</p>
            </div>
            <div className="border-r border-gray-900 p-2">
              <p className="font-black uppercase text-center mb-2">Décision du conseil de classe</p>
              <p className="italic text-center text-[10px] mt-8">
                {bulletin.admis ? 'Admis' : 'Redouble'}
              </p>
            </div>
            <div className="p-2 flex flex-col justify-between">
              <p className="font-black uppercase text-center">Visa du Chef d'Établissement</p>
              <p className="font-black text-center text-[8px] uppercase">Le Principal</p>
            </div>
          </div>

          <div className="mt-4 text-[7px] text-gray-500 italic">
            Le bulletin est délivré sans rature ni surcharge.<br/>
            Report card issued without erasures or overwriting.
          </div>

        </div>
      ) : (
        /* État Vide (no-print) */
        <div className="max-w-md mx-auto py-20 text-center no-print">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen size={40} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun bulletin généré</h2>
          <p className="text-gray-500 text-sm">
            Veuillez sélectionner les critères ci-dessus pour afficher le bulletin de l'élève.
          </p>
        </div>
      )}
      })()}
    </div>
  )
}