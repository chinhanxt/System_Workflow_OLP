import axios from 'axios'
import { useAuthStore } from '@/stores/auth.store'
import { queryClient } from '@/lib/query-client'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT access token on every request.
apiClient.interceptors.request.use((config) => {
  const isInternal = !config.url?.startsWith('http') || config.url.startsWith(BASE_URL)
  if (isInternal) {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const geminiKey = localStorage.getItem('GEMINI_API_KEY')
    if (geminiKey) {
      config.headers['X-Gemini-API-Key'] = geminiKey
    }

    const openaiKey = localStorage.getItem('OPENAI_API_KEY')
    if (openaiKey) {
      config.headers['X-OpenAI-API-Key'] = openaiKey
    }

    const telegramToken = localStorage.getItem('TELEGRAM_BOT_TOKEN')
    if (telegramToken) {
      config.headers['X-Telegram-Bot-Token'] = telegramToken
    }
  }

  return config
})

// On 401, try a single refresh against /auth/refresh/, then retry once.
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })
          useAuthStore.getState().setAccessToken(data.access)
          original.headers.Authorization = `Bearer ${data.access}`
          return apiClient(original)
        } catch {
          await resetAndLogout()
        }
      } else {
        await resetAndLogout()
      }
    }
    return Promise.reject(error)
  },
)

async function resetAndLogout() {
  await queryClient.cancelQueries()
  queryClient.clear()
  useAuthStore.getState().logout()
}

export default apiClient
