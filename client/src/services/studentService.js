import api from './api'

// ── Élèves ────────────────────────────────────────────────────────
// Champs API réels : matricule (PK), nom, prenom, dateNaissance,
// lieuNaissance, sexe, actif, idVilleNaissance
export const getStudents   = (params)        => api.get('/eleves', { params })
export const getStudent    = (matricule)     => api.get(`/eleves/${matricule}`)
export const createStudent = (data)          => api.post('/eleves', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateStudent = (matricule, data) => api.put(`/eleves/${matricule}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteStudent = (matricule)     => api.delete(`/eleves/${matricule}`)
export const restoreStudent = (matricule)    => api.patch(`/eleves/${matricule}/restaurer`)
export const toggleActif    = (matricule, actif) => api.patch(`/eleves/${matricule}/statut`, { actif })
export const getNextMatricule = (classe_id)  => api.get(`/eleves/next-matricule/generate`, { params: { classe_id } })

export const hardDeleteStudent = (matricule) => api.delete(`/eleves/${matricule}/hard`)