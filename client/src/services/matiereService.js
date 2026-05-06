import api from './api'

export const getMatieres   = ()          => api.get('/matieres')
export const createMatiere = (data)      => api.post('/matieres', data)
export const updateMatiere = (id, data)  => api.put(`/matieres/${id}`, data)
export const updateMatiereStatut = (id, actif) => api.patch(`/matieres/${id}/statut`, { actif })
export const deleteMatiere = (id)        => updateMatiereStatut(id, 0)