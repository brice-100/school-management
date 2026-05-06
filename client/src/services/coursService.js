import api from './api'

// ── Cours ─────────────────────────────────────────────────────────
export const getCours          = (params)   => api.get('/matieres', { params })
export const getMesCours       = ()         => api.get('/enseignant/mes-cours')
export const createCours       = (data)     => api.post('/matieres', data)
export const updateCours       = (id, data) => api.put(`/matieres/${id}`, data)
export const deleteCours       = (id)       => api.delete(`/matieres/${id}`)
export const getElevesParCours = (params)   => api.get('/eleves/par-cours', { params })

// ── Enseignants ───────────────────────────────────────────────────
export const getEnseignants    = (params)   => api.get('/enseignants', { params })
export const createEnseignant  = (data)     => api.post('/enseignants', data)
export const updateEnseignant  = (id, data) => api.put(`/enseignants/${id}`, data)
export const deleteEnseignant  = (id)       => api.delete(`/enseignants/${id}`)

// ── Cycles ────────────────────────────────────────────────────────
export const getCycles         = ()         => api.get('/cycles')
export const createCycle       = (data)     => api.post('/cycles', data)