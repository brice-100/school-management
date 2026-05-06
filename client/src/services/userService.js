import api from './api'
import { softDelete } from './deleteConfig'

const ROLE_TO_TYPE = { teacher: 1, parent: 4 }
 
export const getUsers = ({ role, statut, search } = {}) => {
  const params = {}
  if (role)   params.typePersonne = ROLE_TO_TYPE[role] ?? undefined
  if (search) params.search       = search
  // statut (en_attente|actif|suspendu) est géré par le frontend via userService
  // Le backend ne filtre pas encore par statut → on passe le param quand même
  if (statut) params.statut = statut
  return api.get('/users', { params })
}


export const getusers        = (params)         => api.get('/users', { params })
export const updateStatut    = (id, statut)     => api.patch(`/users/${id}/statut`, { statut })
export const updateUser      = (id, formData)   => api.put(`/users/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const deleteUser   = (id)         => softDelete(api, '/personnes', id)
export const getPendingCount = ()               => api.get('/users/pending-count')