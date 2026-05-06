import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Pencil, Trash2, Eye } from 'lucide-react'
import { getTeachers, deleteTeacher, restoreTeacher, hardDeleteTeacher } from '../../services/teacherService'
import toast from 'react-hot-toast'
import EnseignantFicheModal from '../../components/EnseignantFicheModal'

export default function TeacherList() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showArchives, setShowArchives] = useState(false)
  const [ficheId, setFicheId] = useState(null)

  const fetchTeachers = async () => {
    // Ne pas mettre loading à true si on a déjà des données (évite le flash blanc)
    if (teachers.length === 0) setLoading(true)
    try {
      const { data } = await getTeachers({ search, actif: showArchives ? 0 : 1 })
      const list = data.enseignants || data.data || []
      setTeachers(list)
    } catch { 
      toast.error('Erreur chargement enseignants.') 
    } finally { 
      setLoading(false) 
    }
  }

  useEffect(() => {
    if (showArchives) setTeachers([]) // Évite de voir les anciens noms lors du switch
    const t = setTimeout(fetchTeachers, 300)
    return () => clearTimeout(t)
  }, [search, showArchives])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Archiver ${name} ?`)) return
    try {
      await deleteTeacher(id)
      toast.success('Enseignant archivé.')
      fetchTeachers()
    } catch { toast.error('Erreur archivage.') }
  }

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Restaurer ${name} ?`)) return
    try {
      await restoreTeacher(id)
      toast.success('Enseignant restauré.')
      fetchTeachers()
    } catch { toast.error('Erreur restauration.') }
  }

  const handleHardDelete = async (id, name) => {
    if (!window.confirm(`Supprimer DÉFINITIVEMENT ${name} ? Cette action est irréversible.`)) return;
    try {
      await hardDeleteTeacher(id);
      toast.success('Enseignant supprimé définitivement.');
      fetchTeachers();
    } catch { toast.error('Erreur lors de la suppression.'); }
  };

  const BASE = import.meta.env.VITE_API_URL.replace('/api', '')

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">
            {showArchives ? 'Archives des enseignants' : 'Enseignants'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{teachers.length} enseignant(s) {showArchives ? 'archivé(s)' : ''}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowArchives(!showArchives)} className="btn-secondary">
            {showArchives ? 'Voir les actifs' : 'Voir les archives'}
          </button>
          {!showArchives && (
            <Link to="/teachers/new" className="btn-primary">
              <Plus size={16} /> Ajouter
            </Link>
          )}
        </div>
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <div className="flex flex-col items-center py-14 text-center">
            <p className="text-gray-400 text-sm mb-3">
              {showArchives ? 'Aucun enseignant archivé.' : 'Aucun enseignant enregistré.'}
            </p>
            {!showArchives && (
              <Link to="/teachers/new" className="btn-primary">
                <Plus size={15} /> Ajouter un enseignant
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Enseignant', 'Email', 'Téléphone', 'Classe', 'Matière', 'Actions'].map(h => (
                  <th key={h} className="text-left font-medium text-gray-500 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {t.photo
                        ? <img src={`${BASE}/${t.photo}`} className="w-9 h-9 rounded-full object-cover" alt="" />
                        : <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-semibold">
                            {t.prenom?.[0]}{t.nom?.[0]}
                          </div>
                      }
                      <p className="font-medium text-gray-900">{t.prenom} {t.nom}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{t.email || '—'}</td>
                  <td className="px-5 py-3.5 text-gray-600">{t.telephone || '—'}</td>
                  <td className="px-5 py-3.5">
                    {t.classe_nom
                      ? <span className="badge bg-purple-50 text-purple-700">{t.classe_nom}</span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    {t.matiere_nom
                      ? <span className="badge bg-amber-50 text-amber-700">{t.matiere_nom}</span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      {showArchives ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleRestore(t.idEnseignant || t.id, `${t.prenom} ${t.nom}`)}
                            className="btn-secondary text-sm py-1 px-3"
                          >
                            Restaurer
                          </button>
                          <button
                            onClick={() => handleHardDelete(t.idEnseignant || t.id, `${t.prenom} ${t.nom}`)}
                            className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setFicheId(t.idEnseignant || t.id)}
                            className="btn-icon text-blue-500 hover:bg-blue-50"
                            title="Voir la fiche"
                          >
                            <Eye size={15} />
                          </button>
                          <Link to={`/teachers/${t.idEnseignant || t.id}/edit`} className="btn-icon">
                            <Pencil size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(t.idEnseignant || t.id, `${t.prenom} ${t.nom}`)}
                            className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600"
                            title="Archiver"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {ficheId && <EnseignantFicheModal idEnseignant={ficheId} onClose={() => setFicheId(null)} />}
    </div>
  )
}