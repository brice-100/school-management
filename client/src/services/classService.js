import api from './api'
export const getClasses   = ()        => api.get('/classes')
export const createClass  = (data)    => api.post('/classes', data)
export const updateClass  = (id, data)=> api.put(`/classes/${id}`, data)
export const deleteClass  = (id)      => api.delete(`/classes/${id}`)

export const getCycles =  ()        => api.get('/cycles')
export const createCycle  = (data)    => api.post('/cycles', data)
export const updateCycle  = (id, data)=> api.put(`/cycles/${id}`, data)
export const deleteCycle  = (id)      => api.delete(`/cycles/${id}`)

export const getSalles =  ()        => api.get('/salles')
export const createSalle  = (data)    => api.post('/salles', data)
export const updateSalle  = (id, data)=> api.put(`/salles/${id}`, data)
export const deleteSalle  = (id)      => api.delete(`/salles/${id}`)
