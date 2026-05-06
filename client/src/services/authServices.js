import api from './api';

export const login = (username, password ,userType= 'admin') =>
  api.post('/auth/login', { username, password, userType });

export const registerTeacher = (formData) =>
  api.post('/auth/register/teacher', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const registerParent = (formData) =>
  api.post('/auth/register/parent', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMe = () => api.get('/auth/me');