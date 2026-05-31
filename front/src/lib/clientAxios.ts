import axios from 'axios'

const clientApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
})

clientApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('client_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Convertit les URLs absolues du backend en chemins relatifs
// pour que le proxy Vite les serve quel que soit l'appareil (mobile, etc.)
clientApi.interceptors.response.use((response) => {
  try {
    const raw = JSON.stringify(response.data)
    const cleaned = raw.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/g, '')
    response.data = JSON.parse(cleaned)
  } catch { /* ne pas bloquer si JSON non sérialisable */ }
  return response
})

export default clientApi
