import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => {
    try {
      const raw = JSON.stringify(response.data)
      const cleaned = raw.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '')
      response.data = JSON.parse(cleaned)
    } catch { /* ignore non-serializable responses */ }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ndeya-admin-auth')
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  },
)

export default api
