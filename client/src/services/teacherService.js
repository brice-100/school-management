import api from './api'

export const getTeachers   = (params)   => api.get('/enseignants', { params })
export const getTeacher    = (id)       => api.get(`/enseignants/${id}`)
export const createTeacher = (formData) => api.post('/enseignants', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const updateTeacher = (id, formData) => api.put(`/enseignants/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const deleteTeacher = (id) => api.patch(`/enseignants/${id}/statut`, { actif: 0 })
export const restoreTeacher = (id) => api.patch(`/enseignants/${id}/statut`, { actif: 1 })
export const hardDeleteTeacher = (id) => api.delete(`/enseignants/${id}`)