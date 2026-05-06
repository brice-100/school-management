import api from './api'

export const getAllNotifications = ()           => api.get('/notifications')
export const getMyNotifications  = ()           => api.get('/notifications/mine')
export const sendNotification    = (data)       => api.post('/notifications/send', data)
export const markRead            = (id)         => api.patch(`/notifications/${id}/read`)
export const markAllRead         = ()           => api.patch('/notifications/mine/read-all')
export const deleteNotification  = (id)         => api.delete(`/notifications/${id}`)