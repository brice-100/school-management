// evaluationService.js
import api from './api'

// ── Évaluations ───────────────────────────────────────────────────
export const getEvaluations       = (params)  => api.get('/evaluations', { params })
export const getEvaluationsClasse = (params)  => api.get('/evaluations/classe', { params })
export const createEvaluation     = (data)    => api.post('/evaluations', data)
export const updateEvaluation     = (id, data)=> api.put(`/evaluations/${id}`, data)
export const deleteEvaluation     = (id)      => api.delete(`/evaluations/${id}`)

// ── Épreuves ──────────────────────────────────────────────────────
export const getEpreuves          = (params)  => api.get('/epreuves', { params })
export const getEpreuvesClasse    = (params)  => api.get('/epreuves/classe', { params })
export const createEpreuve        = (data)    => api.post('/epreuves', data)
export const updateEpreuve        = (id, data)=> api.put(`/epreuves/${id}`, data)
export const deleteEpreuve        = (id)      => api.delete(`/epreuves/${id}`)

// ── Natures ───────────────────────────────────────────────────────
export const getNaturesEpreuve    = ()        => api.get('/natures-epreuve')

// ── Sessions ──────────────────────────────────────────────────────
export const getSessions          = (params)  => api.get('/sessions', { params })
export const getSessionsActives   = ()        => api.get('/sessions/actives')
export const createSession        = (data)    => api.post('/sessions', data)
export const updateSession        = (id, data)=> api.put(`/sessions/${id}`, data)
export const deleteSession        = (id)      => api.delete(`/sessions/${id}`)

// ── Trimestres ────────────────────────────────────────────────────
export const getTrimestres        = (params)  => api.get('/trimestres', { params })
export const createTrimestre      = (data)    => api.post('/trimestres', data)
export const updateTrimestre      = (id, data)=> api.put(`/trimestres/${id}`, data)
export const deleteTrimestre      = (id)      => api.delete(`/trimestres/${id}`)