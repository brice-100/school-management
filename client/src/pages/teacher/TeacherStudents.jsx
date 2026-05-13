import { useState, useEffect } from 'react'
import { Users, Search, GraduationCap, ChevronRight, User, Calendar, Mail, Phone, Filter } from 'lucide-react'
import { getTeacherStudents } from '../../services/teacherService'
import { getClasses } from '../../services/classService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function TeacherStudents() {
  const { user } = useAuth()
  const [data, setData] = useState({ classes: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClasse, setSelectedClasse] = useState('all')

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const [res, classRes] = await Promise.all([
        getTeacherStudents(user.id),
        getClasses()
      ])
      setData({
        classes: res.data.classes || [],
        allClasses: classRes.data.data || [],
        total: res.data.total || 0
      })
    } catch (err) {
      toast.error('Erreur lors du chargement des élèves.')
    } finally {
      setLoading(false)
    }
  }

  // Filtrage
  const filteredClasses = data.classes
    .filter(c => selectedClasse === 'all' || c.idClasse.toString() === selectedClasse)
    .map(c => ({
      ...c,
      eleves: c.eleves.filter(s => 
        `${s.nom} ${s.prenom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.matricule.toString().includes(searchTerm)
      )
    }))
    .filter(c => c.eleves.length > 0)

  const totalFiltered = filteredClasses.reduce((acc, curr) => acc + curr.eleves.length, 0)

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200">
            <Users className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Syne, sans-serif'}}>
              Mes Élèves
            </h1>
            <p className="text-gray-500 text-sm">Liste des élèves par classe où vous enseignez.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Éffectif</p>
            <p className="text-xl font-black text-primary-600">{data.total}</p>
          </div>
          <div className="w-px h-8 bg-gray-100 mx-2" />
          <GraduationCap className="text-primary-400" />
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom ou matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all text-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 min-w-[200px]">
          <Filter className="text-gray-400" size={18} />
          <select
            value={selectedClasse}
            onChange={(e) => setSelectedClasse(e.target.value)}
            className="flex-1 bg-gray-50 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary-500 text-sm transition-all appearance-none cursor-pointer"
          >
            <option value="all">Toutes les classes</option>
            {(data.allClasses || data.classes).map(c => (
              <option key={c.idClasse} value={c.idClasse}>{c.libelle || c.classe_nom}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Récupération de vos classes...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={40} className="text-gray-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">Aucun élève trouvé</h3>
          <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos critères de recherche ou de filtre.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredClasses.map((classe) => (
            <div key={classe.idClasse} className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-2 h-8 bg-primary-500 rounded-full" />
                <h2 className="text-xl font-bold text-gray-800" style={{fontFamily: 'Syne, sans-serif'}}>
                  Classe : {classe.classe_nom}
                </h2>
                <span className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-xs font-bold">
                  {classe.eleves.length} élèves
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classe.eleves.map((eleve) => (
                  <div 
                    key={eleve.matricule}
                    className="group bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-primary-100/30 hover:border-primary-100 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Background pattern */}
                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-primary-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="shrink-0 relative">
                        {eleve.photo && eleve.photo !== 'INDEFINI' ? (
                          <img 
                            src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${eleve.photo}`}
                            alt={eleve.nom}
                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary-50 group-hover:ring-primary-400 transition-all"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 ring-2 ring-transparent group-hover:ring-primary-400 transition-all">
                            <User size={24} />
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white ${eleve.sexe === 0 ? 'bg-pink-500' : 'bg-blue-500'}`}>
                          {eleve.sexe === 0 ? 'F' : 'G'}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] text-primary-500 font-black uppercase tracking-widest mb-0.5">Matricule #{eleve.matricule}</p>
                            <h3 className="text-base font-bold text-gray-900 truncate leading-tight">
                              {eleve.prenom}
                            </h3>
                            <h4 className="text-sm font-medium text-gray-600 truncate uppercase tracking-tight">
                              {eleve.nom}
                            </h4>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-4 text-gray-400 group-hover:text-primary-600 transition-colors">
                           <div className="flex items-center gap-1.5">
                              <Calendar size={14} />
                              <span className="text-xs font-medium">
                                {eleve.dateNaissance ? new Date(eleve.dateNaissance).getFullYear() : 'N/A'}
                              </span>
                           </div>
                           <div className="w-px h-3 bg-gray-100" />
                           <span className="text-[10px] font-bold uppercase tracking-wide">
                             {eleve.sexe === 0 ? 'Fille' : 'Garçon'}
                           </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => window.location.href = `/bulletins?matricule=${eleve.matricule}`}
                          className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-1"
                        >
                          <BookOpen size={14} />
                          Bulletin
                        </button>
                        <button className="text-[11px] font-bold text-primary-500 flex items-center gap-1 group-hover:gap-2 transition-all">
                          Profil
                          <ChevronRight size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all">
                          <Mail size={14} />
                        </button>
                        <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary-50 hover:text-primary-600 transition-all">
                          <Phone size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
