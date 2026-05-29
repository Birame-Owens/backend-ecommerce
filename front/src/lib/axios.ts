import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/admin/login'
    }
    return Promise.reject(error)
  },
)

export default api
