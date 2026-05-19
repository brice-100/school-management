import api from './api'

export const getDevoirs    = (params)   => api.get('/devoirs', { params })
export const createDevoir  = (formData) => api.post('/devoirs', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const updateDevoir  = (id, formData) => api.put(`/devoirs/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteDevoir  = (id)       => api.delete(`/devoirs/${id}`)
