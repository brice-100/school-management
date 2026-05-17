import api from './api'
import { softDelete } from './deleteConfig'

export const getGradeFormData  = ()              => api.get('/grades/form-data')
export const getGrades         = (params)        => api.get('/grades', { params })
export const getGradesByStudent = (id, params)   => api.get(`/grades/student/${id}`, { params })
export const getGradeStats     = (classe_id, p)  => api.get(`/grades/stats/${classe_id}`, { params: p })
export const createGrade       = (data)          => api.post('/grades', data)
export const updateGrade       = (id, data)      => api.put(`/grades/${id}`, data)
export const validerGrades     = (ids)           => api.patch('/grades/valider', { ids })
export const deleteGrade       = (id)            => api.delete(`/grades/${id}`)
export const restoreGrade      = (id)            => api.patch(`/grades/${id}/restaurer`)

export const getGrade = (params) => api.get('/evaluations', { params })
export const CreateGrade = (data) => {
  // Mapping ancien → nouveau format backend
  const payload = {
    note:         data.valeur        ?? data.note,
    appreciation: data.commentaire   ?? data.appreciation ?? '',
    matricule:    data.student_id    ?? data.matricule,
    idCours:      data.matiere_id    ?? data.idCours,
    idSession:    data.idSession     ?? '',
    idEpreuve:    data.idEpreuve     ?? '',
  }
  return api.post('/evaluations', payload)
}

export const ValiderGrades = async (ids) => {
  if (!Array.isArray(ids)) return
  return Promise.all(ids.map(id => api.patch(`/evaluations/${id}/valider`, {})))
}
export const DeleteGrade = (id) => softDelete(api, '/evaluations', id)
export const getGradeFormdata = () =>
  Promise.all([
    api.get('/eleves'),
    api.get('/cours'),
    api.get('/sessions/actives'),
  ]).then(([eleves, cours, sessions]) => ({
    data: {
      data: {
        students: eleves.data.data     || eleves.data.eleves     || [],
        matieres: cours.data.data      || cours.data.cours       || [],
        sessions: sessions.data.data   || sessions.data.sessions || [],
      }
    }
  }))
