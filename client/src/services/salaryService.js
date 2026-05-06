import api from './api'

// ── Vue Admin ─────────────────────────────────────────────────────
// Correspond à SalaryList.jsx (existant) + nouveaux endpoints
export const getSalaries          = (params)   => api.get('/salaires', { params })
export const getSalaryRecap       = (params)   => api.get('/salaires/recap', { params })
export const createSalary         = (data)     => api.post('/fiches-enseignant', data)
export const updateSalary         = (id, data) => api.put(`/fiches-enseignant/${id}`, data)
export const validerSalaire       = (id, data) => api.patch(`/salaires/${id}/valider`, data)
// Génération en masse (si ton backend le supporte)
export const genererMois          = (data)     => api.post('/salaires/generer', data)
export const payerSalaire         = (id)       => api.patch(`/salaires/${id}/payer`)

// ── Vue Enseignant ────────────────────────────────────────────────
// Utilisés dans SalaryTeacherPage.jsx
export const getSalaireHistorique = ()         => api.get('/enseignant/salaire')
export const getSalaireStatut     = ()         => api.get('/enseignant/salaire/statut')
export const demanderDecaissement = (data)     => api.post('/enseignant/salaire/decaissement', data)