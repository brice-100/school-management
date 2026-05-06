import api from './api'

// ── Paiements ─────────────────────────────────────────────────────
export const getPaiements        = (params)    => api.get('/paiements', { params })
export const getPaiementsParent  = (params)    => api.get('/paiements/mon-compte', { params })
export const getPaiementSummary = (params)    => api.get('/paiements/summary', { params })
export const getPaiementsRecents = (params)    => api.get('/paiements/recents', { params })
export const getPaiement         = (idPaie)    => api.get(`/paiements/${idPaie}`)
export const createPaiement      = (data)      => api.post('/paiements', data)
export const initierPaiement     = (data)      => api.post('/paiements/initier', data)
export const validerPaiement     = (idPaie, data) => api.patch(`/paiements/${idPaie}/valider`, data)

// ── Scolarité ─────────────────────────────────────────────────────
export const getScolarite        = (params)    => api.get('/scolarite', { params })
export const createScolarite     = (data)      => api.post('/scolarite', data)
export const updateScolarite     = (id, data)  => api.put(`/scolarite/${id}`, data)

// ── Tranches ──────────────────────────────────────────────────────
export const getTranches         = (params)    => api.get('/tranches', { params })
export const createTranche       = (data)      => api.post('/tranches', data)
export const updateTranche       = (id, data)  => api.put(`/tranches/${id}`, data)
export const deleteTranche       = (id)        => api.delete(`/tranches/${id}`)

// ── Modes de paiement ─────────────────────────────────────────────
export const getModesPaiement    = (params)    => api.get('/modes-paiement', { params })
export const createModePaiement  = (data)      => api.post('/modes-paiement', data)
export const toggleModePaiement  = (id, data)  => api.patch(`/modes-paiement/${id}`, data)

// ── Années académiques ────────────────────────────────────────────
export const getAnneesAcademiques  = ()        => api.get('/annees-academiques')
export const getAnneeActive        = ()        => api.get('/annees-academiques/active')
export const createAnneeAcademique = (data)    => api.post('/annees-academiques', data)
export const deleteAnneeAcademique = (id)      => api.delete(`/annees-academiques/${id}`)
export const setActiveAnnee        = (id)      => api.put(`/annees-academiques/${id}/active`)

// ── Fiche élève (admin) ───────────────────────────────────────────
export const getFicheEleve = (matricule) => api.get(`/eleves/${matricule}/fiche`)