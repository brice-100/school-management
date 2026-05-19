// ─────────────────────────────────────────────────────────────────
// reportService.js
// ─────────────────────────────────────────────────────────────────
import api from './api'

export const getRapports         = (params)   => api.get('/rapports', { params })
export const getRapportsCours    = (params)   => api.get('/rapports/cours', { params })
export const createRapport       = (data)     => api.post('/rapports', data)
export const updateRapport       = (id, data) => api.put(`/rapports/${id}`, data)
export const getJustificatifs    = (params)   => api.get('/justificatifs', { params })
export const createJustificatif  = (data)     => api.post('/justificatifs', data)
export const validerJustificatif = (id)       => api.put(`/justificatifs/${id}/valider`)
export const getDisciplines      = ()         => api.get('/disciplines')