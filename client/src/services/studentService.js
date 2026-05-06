import api from './api'

// ── Élèves ────────────────────────────────────────────────────────
// Champs API réels : matricule (PK), nom, prenom, dateNaissance,
// lieuNaissance, sexe, actif, idVilleNaissance
export const getStudents   = (params)        => api.get('/eleves', { params })
export const getStudent    = (matricule)     => api.get(`/eleves/${matricule}`)
export const createStudent = (data)          => api.post('/eleves', data)
export const updateStudent = (matricule, data) => api.put(`/eleves/${matricule}`, data)
export const deleteStudent = (matricule)     => api.patch(`/eleves/${matricule}/statut`, { actif: 0 })
export const restoreStudent = (matricule)    => api.patch(`/eleves/${matricule}/statut`, { actif: 1 })
export const toggleActif   = (matricule, actif) => api.patch(`/eleves/${matricule}/statut`, { actif })
export const hardDeleteStudent = (matricule) => api.delete(`/eleves/${matricule}`)