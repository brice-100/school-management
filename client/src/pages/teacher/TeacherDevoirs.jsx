import { useState, useEffect } from 'react'
import {
  BookOpen, Search, Plus, X, Pencil, Trash2,
  Calendar, FileText, RefreshCw, AlertCircle
} from 'lucide-react'
import { getTeacherStudents } from '../../services/teacherService'
import { getMatieres } from '../../services/matiereService'
import { getDevoirs, createDevoir, updateDevoir, deleteDevoir } from '../../services/devoirService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '—'

export default function TeacherDevoirs() {
  const { user } = useAuth()

  const [devoirs, setDevoirs] = useState([])
  const [classes, setClasses] = useState([])
  const [matieres, setMatieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSalle, setSelectedSalle] = useState('all')

  // Modals & Formulaires
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({
    titre: '',
    description: '',
    idCours: '',
    idSalle: '',
    date_rendu: '',
    urlDoc: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [studentsRes, matieresRes, devoirsRes] = await Promise.all([
        getTeacherStudents(user.id),
        getMatieres(),
        getDevoirs()
      ])

      const classList = studentsRes.data.classes || []
      setClasses(classList)
      setMatieres(matieresRes.data.data || matieresRes.data.cours || [])
      setDevoirs(devoirsRes.data.data || [])
      
      // Pré-remplir les valeurs par défaut
      if (classList.length > 0) {
        setForm(f => ({ ...f, idSalle: classList[0].idSalle.toString() }))
      }
    } catch {
      toast.error('Erreur lors du chargement des données.')
    } finally {
      setLoading(false)
    }
  }

  const [selectedFile, setSelectedFile] = useState(null)

  const handleOpenCreate = () => {
    setEditId(null)
    setSelectedFile(null)
    setForm({
      titre: '',
      description: '',
      idCours: matieres[0]?.idCours?.toString() || '',
      idSalle: classes[0]?.idSalle?.toString() || '',
      date_rendu: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // Par défaut dans 2 jours
      urlDoc: ''
    })
    setShowForm(true)
  }

  const handleOpenEdit = (d) => {
    setEditId(d.idDevoir)
    setSelectedFile(null)
    setForm({
      titre: d.titre,
      description: d.description || '',
      idCours: d.idCours.toString(),
      idSalle: d.idSalle.toString(),
      date_rendu: d.date_rendu ? d.date_rendu.split('T')[0] : '',
      urlDoc: d.urlDoc || ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.titre || !form.idCours || !form.idSalle) {
      return toast.error('Le titre, la matière et la classe sont obligatoires.')
    }

    const formData = new FormData()
    formData.append('titre', form.titre)
    formData.append('description', form.description)
    formData.append('idCours', form.idCours)
    formData.append('idSalle', form.idSalle)
    formData.append('date_rendu', form.date_rendu)
    if (form.urlDoc) {
      formData.append('urlDoc', form.urlDoc)
    }
    if (selectedFile) {
      formData.append('file', selectedFile)
    }

    try {
      if (editId) {
        await updateDevoir(editId, formData)
        toast.success('Devoir mis à jour avec succès !')
      } else {
        await createDevoir(formData)
        toast.success('Devoir publié aux parents avec succès !')
      }
      setSelectedFile(null)
      setShowForm(false)
      const { data } = await getDevoirs()
      setDevoirs(data.data || [])
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la validation.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer définitivement ce devoir ?')) return
    try {
      await deleteDevoir(id)
      toast.success('Devoir supprimé !')
      setDevoirs(prev => prev.filter(d => d.idDevoir !== id))
    } catch {
      toast.error('Erreur lors de la suppression.')
    }
  }

  // Filtrer les devoirs
  const devoirsFiltres = devoirs.filter(d => {
    const matchesSearch = d.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesSalle = selectedSalle === 'all' || d.idSalle.toString() === selectedSalle
    return matchesSearch && matchesSalle
  })

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200">
            <BookOpen className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Syne, sans-serif'}}>
              Mes Devoirs & Exercices
            </h1>
            <p className="text-gray-500 text-sm">Publiez et gérez les exercices destinés aux élèves et à leurs parents.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={loadData} className="btn-icon bg-white border border-gray-100 hover:bg-gray-50">
            <RefreshCw size={16} />
          </button>
          <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-1.5 shadow-lg shadow-primary-200">
            <Plus size={16} /> Publier un devoir
          </button>
        </div>
      </div>

      {/* Barre de Filtres */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            placeholder="Rechercher un devoir..."
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
            <option value="all">Toutes les classes</option>
            {classes.map(c => (
              <option key={c.idSalle} value={c.idSalle}>
                {c.classe_nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Liste des devoirs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 space-y-4">
              <div className="skeleton h-4 w-2/3 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
              <div className="skeleton h-12 w-full rounded" />
            </div>
          ))
        ) : devoirsFiltres.length === 0 ? (
          <div className="col-span-full py-16 text-center card bg-white">
            <AlertCircle size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Aucun devoir ou exercice publié pour l'instant.</p>
          </div>
        ) : (
          devoirsFiltres.map(d => (
            <div key={d.idDevoir} className="card p-5 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="badge bg-indigo-50 text-indigo-700 text-xs">
                    {d.cours_nom}
                  </span>
                  <span className="badge bg-gray-50 text-gray-600 text-xs font-semibold">
                    {d.classe_nom} - {d.salle_nom}
                  </span>
                </div>

                <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-1">
                  {d.titre}
                </h3>
                
                <p className="text-gray-500 text-sm mb-4 line-clamp-3 min-h-[60px]">
                  {d.description || 'Aucune description détaillée.'}
                </p>
              </div>

              <div className="border-t border-gray-50 pt-4 mt-2">
                <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} />
                    Rendu le : <span className="font-semibold text-rose-500">{fmtDate(d.date_rendu)}</span>
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  {d.urlDoc ? (
                    <a
                      href={d.urlDoc}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-primary-600 hover:underline font-semibold"
                    >
                      <FileText size={13} /> Voir le document
                    </a>
                  ) : (
                    <span className="text-xs text-gray-300">Sans fichier joint</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(d)}
                      className="p-2 text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
                      title="Modifier"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(d.idDevoir)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal d'édition/création */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-gray-900 text-lg">
                {editId ? 'Modifier l\'exercice' : 'Publier un nouvel exercice'}
              </h3>
              <button onClick={() => setShowForm(false)} className="btn-icon"><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label font-semibold mb-1 block">Titre de l'exercice *</label>
                <input
                  value={form.titre}
                  onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  placeholder="Ex: Devoir de mathématiques sur les fractions"
                  className="input-field w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label font-semibold mb-1 block">Matière *</label>
                  <select
                    value={form.idCours}
                    onChange={e => setForm(f => ({ ...f, idCours: e.target.value }))}
                    className="select-field w-full"
                    required
                  >
                    {matieres.map(m => (
                      <option key={m.idCours} value={m.idCours}>
                        {m.libelle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label font-semibold mb-1 block">Classe / Salle *</label>
                  <select
                    value={form.idSalle}
                    onChange={e => setForm(f => ({ ...f, idSalle: e.target.value }))}
                    className="select-field w-full"
                    required
                  >
                    {classes.map(c => (
                      <option key={c.idSalle} value={c.idSalle}>
                        {c.classe_nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label font-semibold mb-1 block">Date limite de rendu</label>
                  <input
                    type="date"
                    value={form.date_rendu}
                    onChange={e => setForm(f => ({ ...f, date_rendu: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="form-label font-semibold mb-1 block">Fichier joint (Image / PDF)</label>
                  <input
                    type="file"
                    onChange={e => setSelectedFile(e.target.files[0])}
                    className="input-field w-full pt-1"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  {form.urlDoc && (
                    <p className="text-[10px] text-gray-400 mt-1 truncate">
                      Fichier actuel : {form.urlDoc.split('/').pop()}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label font-semibold mb-1 block">Description & Instructions</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Écrivez ici les consignes détaillées pour les élèves et les parents..."
                  rows={4}
                  className="input-field w-full resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  {editId ? 'Enregistrer les modifications' : 'Publier le devoir'}
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
