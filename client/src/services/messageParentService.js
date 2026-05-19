import api from './api'

export const getMessagesParents    = ()           => api.get('/messages-parents')
export const createMessageParent   = (data)       => api.post('/messages-parents', data)
export const repondreMessageParent = (id, reponse) => api.post(`/messages-parents/${id}/repondre`, { reponse })
export const markMessageParentLu   = (id)         => api.patch(`/messages-parents/${id}/lu`)
