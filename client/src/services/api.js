import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT automatiquement et l'idAnnee
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    
    // Injecter l'année sélectionnée (sauf pour certaines routes)
    const selectedYearId = localStorage.getItem('selectedYearId');
    if (selectedYearId && config.method === 'get') {
      config.params = { ...config.params, idAnnee: selectedYearId };
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Gérer les erreurs globalement
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data
    const enrichedError = new Error(data?.message || 'Erreur réseau.')
    enrichedError.code = data?.code  // 'PENDING', 'SUSPENDED', etc.
    enrichedError.status = error.response?.status
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const isLoginAttempt = url.includes('/auth/login')
      if (!isLoginAttempt) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(enrichedError)
  }
)

export default api;