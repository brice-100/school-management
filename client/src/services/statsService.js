// statsService.js
import api from './api'

export const getOverview              = ()       => api.get('/stats/overview')
export const getNotesByClasse         = (params) => api.get('/stats/notes-by-classe',       { params })
export const getNotesByMatiere        = (params) => api.get('/stats/notes-by-matiere',      { params })
export const getPaymentsByMonth       = (params) => api.get('/stats/payments-by-month',     { params })
export const getPaymentsByStatut      = ()       => api.get('/stats/payments-by-statut')
export const getReussiteByTrimestre   = (params) => api.get('/stats/reussite-by-trimestre', { params })
export const getTeachersRecap         = ()       => api.get('/stats/teachers-recap')