import api from './api'

export const getPlanningFormData   = (params)      => api.get('/planning/form-data', { params })
export const getPlanningByClasse   = (id, params)  => api.get(`/planning/classe/${id}`, { params })
export const getPlanningByTeacher  = (id, params)  => api.get(`/planning/teacher/${id}`, { params })
export const getMyPlanning         = (params)      => api.get('/planning/mine', { params })
export const createPlanning        = (data)        => api.post('/planning', data)
export const updatePlanning        = (id, data)    => api.put(`/planning/${id}`, data)
export const deletePlanning        = (id)          => api.delete(`/planning/${id}`)
export const restorePlanning      = (id)          => api.patch(`/planning/${id}/restaurer`)



export const getEmploiDuTemps          = (params)   => api.get('/emploi-du-temps', { params })
export const getEmploiDuTempsEnseignant= (params)   => api.get('/emploi-du-temps/enseignant', { params })
export const getEmploiDuTempsEleve     = (params)   => api.get('/emploi-du-temps/eleve', { params })
export const createCreneau             = (data)     => api.post('/emploi-du-temps', data)
export const updateCreneau             = (id, data) => api.put(`/emploi-du-temps/${id}`, data)
export const deleteCreneau             = (id)       => api.delete(`/emploi-du-temps/${id}`)
export const getJoursSemaine           = ()         => api.get('/jours-semaine')