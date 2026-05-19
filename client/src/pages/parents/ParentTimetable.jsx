import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Clock, BookOpen, User, MapPin, ChevronLeft, ChevronRight,
  RefreshCw, AlertCircle, CheckCircle
} from 'lucide-react'
import { getMesEnfants } from '../../services/parentService'
import { getPlanningByClasse } from '../../services/planningService'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

// Jours de la semaine
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export default function ParentTimetable() {
  const { user } = useAuth()

  const [enfants, setEnfants] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadPlanning, setLoadPlanning] = useState(false)
  const [planning, setPlanning] = useState([])

  // Charger mes enfants
  useEffect(() => {
    setLoading(true)
    getMesEnfants()
      .then(({ data }) => {
        const list = data.enfants || data.data || []
        setEnfants(list)
        if (list.length > 0) setSelectedChild(list[0])
      })
      .catch(() => toast.error('Impossible de charger vos enfants.'))
      .finally(() => setLoading(false))
  }, [])

  // Charger l'emploi du temps
  const fetchPlanning = useCallback(() => {
    if (!selectedChild?.idClasse) return
    setLoadPlanning(true)
    getPlanningByClasse(selectedChild.idClasse)
      .then(({ data }) => {
        setPlanning(data.data || data.plannings || [])
      })
      .catch(() => toast.error('Erreur lors du chargement de l\'emploi du temps.'))
      .finally(() => setLoadPlanning(false))
  }, [selectedChild?.idClasse])

  useEffect(() => {
    fetchPlanning()
  }, [fetchPlanning])

  // Organiser le planning par jour de la semaine
  const planningByDay = DAYS.reduce((acc, d) => {
    acc[d] = planning.filter(p => p.jour === d)
      .sort((a, b) => (a.heureDeb || '').localeCompare(b.heureFin || ''))
    return acc
  }, {})

  return (
    <div className="page-container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900" style={{fontFamily: 'Syne, sans-serif'}}>
            Emploi du Temps
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {selectedChild
              ? `Planning de cours hebdomadaire de ${selectedChild.prenom} ${selectedChild.nom}`
              : 'Choisissez un enfant'}
          </p>
        </div>
        {selectedChild && (
          <button onClick={fetchPlanning} className="btn-icon" title="Actualiser">
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-14 w-full rounded-2xl" />
          <div className="skeleton h-48 w-full rounded-3xl" />
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
                    ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center
                  text-xs font-bold ${
                  selectedChild?.matricule === e.matricule
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {e.prenom?.[0]}{e.nom?.[0]}
                </div>
                {e.prenom} {e.nom}
              </button>
            ))}
          </div>

          {/* Affichage emploi du temps */}
          {loadPlanning ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-5 space-y-4">
                  <div className="skeleton h-6 w-1/3 rounded" />
                  <div className="skeleton h-12 w-full rounded" />
                  <div className="skeleton h-12 w-full rounded" />
                </div>
              ))}
            </div>
          ) : planning.length === 0 ? (
            <div className="card py-16 text-center bg-white border border-gray-100">
              <Calendar size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucun cours planifié pour {selectedChild?.prenom} dans sa classe de {selectedChild?.classe || 'salle'}.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DAYS.map(day => {
                const list = planningByDay[day] || []
                
                return (
                  <div key={day} className="card p-5 bg-white border border-gray-100 flex flex-col">
                    <h2 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-50 pb-2 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      {day}
                      <span className="text-xs font-normal text-gray-400">({list.length} cours)</span>
                    </h2>

                    {list.length === 0 ? (
                      <div className="py-8 text-center text-gray-300 text-xs font-medium my-auto">
                        Pas de cours planifié
                      </div>
                    ) : (
                      <div className="space-y-4 flex-1">
                        {list.map(p => (
                          <div key={p.idPlan} className="p-3 bg-gray-50/50 hover:bg-indigo-50/30 rounded-2xl border border-gray-100 hover:border-indigo-100 transition-all space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="flex items-center gap-1 text-indigo-700 font-bold">
                                <Clock size={12} />
                                {p.heureDeb} - {p.heureFin}
                              </span>
                              <span className="badge bg-white text-gray-600 font-bold border border-gray-100">
                                <MapPin size={10} className="inline mr-1 text-gray-400" />
                                {p.salle_nom || p.salle || 'Salle'}
                              </span>
                            </div>

                            <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                              <BookOpen size={13} className="text-indigo-500" />
                              {p.cours_nom || p.cours || 'Matière'}
                            </h3>

                            {p.enseignant_nom && (
                              <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                <User size={11} />
                                Enseignant : {p.enseignant_nom}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
