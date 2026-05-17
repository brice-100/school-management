import api from './api'

export const getTeachers   = (params)   => api.get('/enseignants', { params })
export const getTeacher    = (id)       => api.get(`/enseignants/${id}`)
export const createTeacher = (formData) => api.post('/enseignants', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const updateTeacher = (id, formData) => api.put(`/enseignants/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})
export const deleteTeacher = (id) => api.delete(`/enseignants/${id}`)
export const restoreTeacher = (id) => api.patch(`/enseignants/${id}/restaurer`)
export const hardDeleteTeacher = (id) => api.delete(`/enseignants/${id}/hard`)


// Liste des élèves des classes où un enseignant enseigne
export const getTeacherStudents = (id) => api.get(`/enseignants/${id}/eleves`)