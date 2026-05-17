import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, UserCircle, Eye } from 'lucide-react';
import { getStudents, deleteStudent, restoreStudent, hardDeleteStudent } from '../../services/studentService';
import { useYear } from '../../context/YearContext';
import toast from 'react-hot-toast';
import EleveFicheModal from '../../components/EleveFicheModal';

export default function StudentList() {
  const { selectedYear } = useYear();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showArchives, setShowArchives] = useState(false);
  const [ficheMatricule, setFicheMatricule] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getStudents({ 
        search, 
        archives: showArchives ? 1 : 0,
        idAnnee: selectedYear?.idAnnee
      });
      setStudents(data.eleves || data.data || []);
    } catch { toast.error('Impossible de charger les élèves.'); }
    finally { setLoading(false); }
  }, [search, showArchives, selectedYear]);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Archiver ${name} ?`)) return;
    try {
      await deleteStudent(id);
      toast.success('Élève archivé.');
      fetchStudents();
    } catch { toast.error('Erreur lors de l\'archivage.'); }
  };

  const handleRestore = async (id, name) => {
    if (!window.confirm(`Restaurer ${name} ?`)) return;
    try {
      await restoreStudent(id);
      toast.success('Élève restauré.');
      fetchStudents();
    } catch { toast.error('Erreur lors de la restauration.'); }
  };

  const handleHardDelete = async (id, name) => {
    if (!window.confirm(`Supprimer DÉFINITIVEMENT ${name} ? Cette action est irréversible.`)) return;
    try {
      await hardDeleteStudent(id);
      toast.success('Élève supprimé définitivement.');
      fetchStudents();
    } catch { toast.error('Erreur lors de la suppression.'); }
  };

  const PHOTO_BASE = import.meta.env.VITE_API_URL.replace('/api', '');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-semibold text-gray-900">
            {showArchives ? 'Archives des élèves' : 'Élèves'}
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            {students.length} élève{students.length > 1 ? 's' : ''} {showArchives ? 'archivé(s)' : 'inscrit(s)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowArchives(!showArchives)} className="btn-secondary text-xs sm:text-sm py-1.5 px-3">
            {showArchives ? 'Actifs' : 'Archives'}
          </button>
          {!showArchives && (
            <Link to="/students/new" className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs sm:text-sm py-1.5 px-3">
              <Plus size={16} /> Ajouter
            </Link>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom ou prénom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <UserCircle size={28} className="text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-700 mb-1">
              {showArchives ? 'Aucun élève archivé' : 'Aucun élève inscrit'}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {showArchives ? 'Il n\'y a pas d\'élèves dans les archives.' : 'Commencez par ajouter le premier élève.'}
            </p>
            {!showArchives && (
              <Link to="/students/new" className="btn-primary flex items-center gap-2">
                <Plus size={15} /> Inscrire un élève
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-medium text-gray-500 px-5 py-3.5 whitespace-nowrap">Élève</th>
                  <th className="text-left font-medium text-gray-500 px-5 py-3.5 whitespace-nowrap">Classe</th>
                  <th className="text-left font-medium text-gray-500 px-5 py-3.5 whitespace-nowrap">Naissance</th>
                  <th className="text-left font-medium text-gray-500 px-5 py-3.5 whitespace-nowrap">Parent</th>
                  <th className="text-right font-medium text-gray-500 px-5 py-3.5 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-50">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {s.photoURL && s.photoURL !== 'INDEFINI' ? (
                        <img
                          src={`${PHOTO_BASE}${s.photoURL}`}
                          alt={s.nom}
                          className="w-9 h-9 rounded-full object-cover border border-gray-100"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center text-primary-500 text-xs font-semibold">
                          {s.prenom[0]}{s.nom[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{s.prenom} {s.nom}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {s.classe_nom
                      ? <span className="badge bg-blue-50 text-blue-700">{s.classe_nom}</span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {s.date_naissance
                      ? new Date(s.date_naissance).toLocaleDateString('fr-FR')
                      : '—'
                    }
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-gray-700">{s.parent_nom || '—'}</p>
                    {s.parent_tel && <p className="text-gray-400 text-xs">{s.parent_tel}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {!showArchives && (
                        <button
                          onClick={() => setFicheMatricule(s.matricule)}
                          className="btn-icon bg-primary-50 text-primary-600 hover:bg-primary-100"
                          title="Dossier complet"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      {showArchives ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleRestore(s.matricule || s.id, `${s.prenom} ${s.nom}`)}
                            className="btn-secondary text-sm py-1 px-3"
                          >
                            Restaurer
                          </button>
                          <button
                            onClick={() => handleHardDelete(s.matricule || s.id, `${s.prenom} ${s.nom}`)}
                            className="btn-icon text-red-400 hover:bg-red-50 hover:text-red-600"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Link to={`/students/${s.matricule || s.id}/edit`} className="btn-icon">
                            <Pencil size={15} />
                          </Link>
                          <button
                            onClick={() => handleDelete(s.matricule || s.id, `${s.prenom} ${s.nom}`)}
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
        </div>
        )}
      </div>
      {ficheMatricule && (
        <EleveFicheModal 
          matricule={ficheMatricule} 
          onClose={() => setFicheMatricule(null)} 
        />
      )}
    </div>
  );
}