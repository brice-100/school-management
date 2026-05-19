import { useState, useEffect } from 'react'
import {
  AlertTriangle, Search, Plus, X, Edit3, Send, CheckCircle,
  GraduationCap, Calendar, Clock, RefreshCw, FileText
} from 'lucide-react'
import { getTeacherStudents } from '../../services/teacherService'
import { getRapports, createRapport, updateRapport } from '../../services/reportService'
import { getAnneesAcademiques } from '../../services/paymentService'
import { useAuth } from '../../context/AuthContext'
import { useYear } from '../../context/YearContext'
import toast from 'react-hot-toast'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function TeacherAbsences() {
  const { user } = useAuth()
  const { selectedYear } = useYear()

  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [rapports, setRapports] = useState([])
  const [annees, setAnnees] = useState([])
  const [selectedSalle, setSelectedSalle] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modals / Formulaires
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({
    libelle: 'Absence',
    matricule: '',
    commentaire: '',
    event_date: new Date().toISOString().split('T')[0],
    heures: '2h',
    points: '0',
    idAca: selectedYear?.idAnnee || ''
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedYear?.idAnnee) {
      setForm(f => ({ ...f, idAca: selectedYear.idAnnee }))
      loadRapports()
    }
  }, [selectedYear])

  const loadData = async () => {
    setLoading(true)
    try {
      const [studentsRes, anneesRes] = await Promise.all([
        getTeacherStudents(user.id),
        getAnneesAcademiques()
      ])
      const classList = studentsRes.data.classes || []
      setClasses(classList)
      if (classList.length > 0) {
        setSelectedSalle(classList[0].idSalle.toString())
      }
      setAnnees(anneesRes.data.annees || anneesRes.data.data || [])
    } catch {
      toast.error('Erreur de chargement des données.')
    } finally {
      setLoading(false)
    }
  }

  const loadRapports = async () => {
    try {
      const { data } = await getRapports({ idAca: selectedYear?.idAnnee })
      setRapports(data.rapports || data.data || [])
    } catch {}
  }

  const handleOpenCreate = () => {
    setEditId(null)
    setForm({
      libelle: 'Absence',
      matricule: activeEleves[0]?.matricule || '',
      commentaire: '',
      event_date: new Date().toISOString().split('T')[0],
      heures: '2h',
      points: '0',
      idAca: selectedYear?.idAnnee || ''
    })
    setShowForm(true)
  }

  const handleOpenEdit = (r) => {
    setEditId(r.idRap)
    // Extraire les heures du libellé si présent, ex: "Absence (2h)"
    let h = '2h'
    let cleanLib = r.libelle
    if (r.libelle.includes('(') && r.libelle.includes(')')) {
      const match = r.libelle.match(/\(([^)]+)\)/)
      if (match) {
        h = match[1]
        cleanLib = r.libelle.split(' (')[0]
      }
    }

    setForm({
      libelle: cleanLib,
      matricule: r.matricule,
      commentaire: r.commentaire || '',
      event_date: r.event_date?.split('T')[0] || '',
      heures: h,
      points: r.points?.toString() || '0',
      idAca: r.idAca
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.matricule) return toast.error('Veuillez sélectionner un élève.')
    
    // Concaténer le type d'absence et les heures dans le libellé pour conserver la compatibilité
    const finalLibelle = `${form.libelle} (${form.heures})`

    try {
      if (editId) {
        await updateRapport(editId, {
          libelle: finalLibelle,
          commentaire: form.commentaire,
          points: parseInt(form.points) || 0,
          status: 'Enregistré'
        })
        toast.success('Absence modifiée avec succès !')
      } else {
        await createRapport({
          libelle: finalLibelle,
          points: parseInt(form.points) || 0,
          matricule: form.matricule,
          idAca: form.idAca,
          event_date: form.event_date,
          commentaire: form.commentaire,
          status: 'Enregistré'
        })
        toast.success('Absence enregistrée avec succès !')
      }
      setShowForm(false)
      loadRapports()
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la validation.')
    }
  }

  const handleTransmit = async (id) => {
    if (!window.confirm('Transmettre cette absence à l\'administration ? Vous ne pourrez plus la modifier.')) return
    try {
      // Pour transmettre, on met à jour le statut du rapport vers 'Transmis'
      const report = rapports.find(r => r.idRap === id)
      await updateRapport(id, {
        libelle: report.libelle,
        commentaire: report.commentaire,
        status: 'Transmis'
      })
      toast.success('Absence transmise à l\'administration !')
      loadRapports()
    } catch {
      toast.error('Erreur lors de la transmission.')
    }
  }

  // Filtrer les élèves de la salle active
  const activeClassObj = classes.find(c => c.idSalle.toString() === selectedSalle)
  const activeEleves = activeClassObj?.eleves || []

  // Filtrer les rapports correspondants aux élèves de cette classe/salle pour le prof
  const rapportsClasse = rapports.filter(r => {
    const isDeLaClasse = activeEleves.some(e => e.matricule === r.matricule)
    if (!isDeLaClasse) return false

    if (searchTerm) {
      const nom = (r.nomEleve || '').toLowerCase()
      const lib = (r.libelle || '').toLowerCase()
      const q = searchTerm.toLowerCase()
      return nom.includes(q) || lib.includes(q)
    }
    return true
  })

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-200">
            <AlertTriangle className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Syne, sans-serif'}}>
              Gestion des Absences
            </h1>
            <p className="text-gray-500 text-sm">Enregistrez, modifiez et transmettez les absences de vos classes.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={loadRapports} className="btn-icon bg-white border border-gray-100 hover:bg-gray-50">
            <RefreshCw size={16} />
          </button>
          <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-1.5 shadow-lg shadow-primary-200">
            <Plus size={16} /> Enregistrer une absence
          </button>
        </div>
      </div>

      {/* Barre de Filtres */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            placeholder="Rechercher par élève..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="input-field pl-11"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={selectedSalle}
            onChange={e => setSelectedSalle(e.target.value)}
            className="select-field min-w-[200px]"
          >
            {classes.map(c => (
              <option key={c.idSalle} value={c.idSalle}>
                {c.classe_nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des Absences enregistrées */}
      <div className="card overflow-hidden">
        {loading ? (
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
        ) : rapportsClasse.length === 0 ? (
          <div className="py-14 text-center">
            <CheckCircle size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucune absence enregistrée pour cette classe.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {['Élève', 'Type', 'Heures', 'Date', 'Statut', 'Actions'].map(h => (
                  <th key={h} className="text-left font-semibold text-gray-500 px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rapportsClasse.map(r => {
                let statusCls = 'bg-gray-100 text-gray-600'
                let statusText = r.status || 'Enregistré'
                
                if (r.status === 'Transmis') {
                  statusCls = 'bg-amber-50 text-amber-700'
                  statusText = 'Transmis à l\'admin'
                } else if (r.status === 'Validé' || r.justifie) {
                  statusCls = 'bg-emerald-50 text-emerald-700'
                  statusText = 'Validé / Justifié'
                }

                // Extraire heures et libellé
                let h = '2h'
                let cleanLib = r.libelle
                if (r.libelle.includes('(') && r.libelle.includes(')')) {
                  const match = r.libelle.match(/\(([^)]+)\)/)
                  if (match) {
                    h = match[1]
                    cleanLib = r.libelle.split(' (')[0]
                  }
                }

                return (
                  <tr key={r.idRap} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900">{r.nomEleve || `Élève #${r.matricule}`}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${cleanLib.includes('Retard') ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-rose-700'}`}>
                        {cleanLib}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{h}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{fmtDate(r.event_date)}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${statusCls}`}>
                        {statusText}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {r.status === 'Enregistré' || !r.status ? (
                          <>
                            <button
                              onClick={() => handleOpenEdit(r)}
                              className="btn-icon hover:bg-gray-100 text-gray-500"
                              title="Modifier"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleTransmit(r.idRap)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition-all"
                              title="Transmettre à l'administration"
                            >
                              <Send size={12} /> Transmettre
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">Non modifiable</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal d'enregistrement/édition */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-gray-900 text-lg">
                {editId ? 'Modifier l\'absence' : 'Enregistrer une absence / retard'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn-icon"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editId && (
                <div>
                  <label className="form-label font-semibold mb-1 block">Sélectionner l'élève *</label>
                  <select
                    value={form.matricule}
                    onChange={e => setForm(f => ({ ...f, matricule: e.target.value }))}
                    className="select-field w-full"
                  >
                    {activeEleves.map(e => (
                      <option key={e.matricule} value={e.matricule}>
                        {e.prenom} {e.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label font-semibold mb-1 block">Type *</label>
                  <select
                    value={form.libelle}
                    onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
                    className="select-field w-full"
                  >
                    <option value="Absence">Absence</option>
                    <option value="Retard">Retard</option>
                  </select>
                </div>

                <div>
                  <label className="form-label font-semibold mb-1 block">Durée *</label>
                  <select
                    value={form.heures}
                    onChange={e => setForm(f => ({ ...f, heures: e.target.value }))}
                    className="select-field w-full"
                  >
                    <option value="1h">1 heure</option>
                    <option value="2h">2 heures</option>
                    <option value="4h">4 heures</option>
                    <option value="1 jour">1 jour</option>
                    <option value="Plus">Plus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label font-semibold mb-1 block">Date d'événement</label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                  className="input-field w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label font-semibold mb-1 block">Année académique</label>
                  <select
                    value={form.idAca}
                    onChange={e => setForm(f => ({ ...f, idAca: e.target.value }))}
                    className="select-field w-full"
                  >
                    {annees.map(a => (
                      <option key={a.idAnnee} value={a.idAnnee}>
                        {a.libelle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label font-semibold mb-1 block">Points malus *</label>
                  <input
                    type="number"
                    min="0"
                    value={form.points}
                    onChange={e => setForm(f => ({ ...f, points: e.target.value }))}
                    placeholder="Ex: 5"
                    className="input-field w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label font-semibold mb-1 block">Commentaire</label>
                <textarea
                  value={form.commentaire}
                  onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                  placeholder="Ex: Absent pendant le cours de mathématiques."
                  rows={3}
                  className="input-field w-full resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editId ? 'Enregistrer les modifications' : 'Enregistrer'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
