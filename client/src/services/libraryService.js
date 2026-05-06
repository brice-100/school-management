import api from './api'

export const getLivres       = (params)   => api.get('/livres', { params })
export const getLivre        = (id)       => api.get(`/livres/${id}`)
export const createLivre     = (data)     => api.post('/livres', data)
export const updateLivre     = (id, data) => api.put(`/livres/${id}`, data)
export const deleteLivre     = (id)       => api.delete(`/livres/${id}`)
export const getSpecialites  = ()         => api.get('/specialites')
export const createSpecialite= (data)     => api.post('/specialites', data)