import api from './api';

// Endpoints corrigés → /annees-academiques (correspond au backend)
export const getAnnees       = ()        => api.get('/annees-academiques');
export const getActiveAnnee  = ()        => api.get('/annees-academiques/active');
export const setActiveAnnee  = (id)      => api.put(`/annees-academiques/${id}/active`);
export const createAnnee     = (data)    => api.post('/annees-academiques', data);
export const updateAnnee     = (id, data)=> api.put(`/annees-academiques/${id}`, data);
export const deleteAnnee     = (id)      => api.delete(`/annees-academiques/${id}`);
