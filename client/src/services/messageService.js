import api from './api'

// ── Lecture ───────────────────────────────────────────────────────
export const getMessages        = (params)  => api.get('/messages', { params })
export const getAllMessages      = (params)  => api.get('/messages', { params })
export const getMessagesRecents = (params)  => api.get('/messages', { params })
export const getMessagesRecus   = (params)  => api.get('/messages', { params })
export const getUnreadCount     = ()        => Promise.resolve({ data: { count: 0 } })

// ── Envoi ─────────────────────────────────────────────────────────
export const sendMessage        = (data)    => api.post('/messages', data)
export const replyMessage       = (data)    => api.post('/messages', data)
export const sendMessageMasse   = (data)    => api.post('/messages', data)

// ── Actions ───────────────────────────────────────────────────────
export const validerMessage     = (id)      => api.put(`/messages/${id}`, { valider: 1 })
export const lireMessage        = (id)      => api.put(`/messages/${id}`, { valider: 1 })

// ── Messagerie Interne (Enseignant <-> Admin) ─────────────────────
export const getInternalMessages      = (params) => api.get('/messages-internes', { params })
export const sendInternalMessage     = (data)   => api.post('/messages-internes', data)
export const replyInternalMessage    = (id, reponse) => api.post(`/messages-internes/${id}/repondre`, { reponse })
export const markInternalAsLu        = (id)      => api.patch(`/messages-internes/${id}/lu`)
export const deleteInternalMessage   = (id)      => api.delete(`/messages-internes/${id}`)