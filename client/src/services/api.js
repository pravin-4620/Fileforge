import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api' })
api.interceptors.request.use((config) => { const token=localStorage.getItem('fileforge_token'); if(token) config.headers.Authorization=`Bearer ${token}`; return config })
api.interceptors.response.use(r=>r, e=>{ if(e.response?.status===401){ localStorage.removeItem('fileforge_token'); localStorage.removeItem('fileforge_user') } return Promise.reject(e) })

let lastHealthCheck = 0
let healthRequest
export async function ensureApiReady() {
  if (Date.now() - lastHealthCheck < 4 * 60_000) return
  if (!healthRequest) {
    healthRequest = api.get('/health', { timeout: 90_000 })
      .then(() => { lastHealthCheck = Date.now() })
      .finally(() => { healthRequest = null })
  }
  return healthRequest
}

export function apiErrorMessage(error, fallback = 'Request failed') {
  if (error.code === 'ERR_CANCELED') return 'Cancelled'
  if ([502, 503, 504].includes(error.response?.status) || !error.response) {
    return 'The conversion server is starting or temporarily unavailable. Wait a moment, then retry.'
  }
  return error.response?.data?.message || fallback
}

export default api
