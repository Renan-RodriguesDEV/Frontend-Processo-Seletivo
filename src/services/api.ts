import axios, { AxiosError } from 'axios'

const authBaseURL = import.meta.env.VITE_AUTH_API_URL ?? 'https://localhost:7081/api/user'
const reservationsBaseURL =
  import.meta.env.VITE_RESERVATIONS_API_URL ?? 'http://localhost:8000'

const TOKEN_KEY = 'banana.test.jwt'

function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY)
}

function decodeJwtPayload(token: string) {
  const payloadPart = token.split('.')[1]
  if (!payloadPart) return null

  const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')

  try {
    return JSON.parse(window.atob(padded)) as { exp?: number }
  } catch {
    return null
  }
}

export function isTokenExpired(token: string) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true
  return payload.exp * 1000 <= Date.now()
}

export function getValidStoredToken() {
  const token = getStoredToken()
  if (!token) return null

  if (isTokenExpired(token)) {
    try {
      window.localStorage.removeItem(TOKEN_KEY)
    } catch (error) {
      console.error('Failed to remove expired token from localStorage:', error)
    }
    return null
  }

  return token
}

function getFriendlyMessage(error: AxiosError<{ detail?: string; message?: string }>) {
  const status = error.response?.status
  const detail = error.response?.data?.detail ?? error.response?.data?.message

  if (detail) {
    return detail
  }

  if (status === 401) {
    return 'Token ausente, expirado ou inválido.'
  }

  if (status === 400) {
    return 'Não foi possível concluir a ação. Verifique os dados enviados.'
  }

  if (status === 404) {
    return 'Registro não encontrado.'
  }

  if (status === 422) {
    return 'Há campos inválidos ou obrigatórios faltando.'
  }

  return 'Falha na requisição. Tente novamente.'
}

export function normalizeError(error: unknown) {
  if (axios.isAxiosError(error)) {
    return getFriendlyMessage(error)
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Erro desconhecido.'
}

export const authApi = axios.create({
  baseURL: authBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const reservationsApi = axios.create({
  baseURL: reservationsBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

for (const api of [authApi, reservationsApi]) {
  api.interceptors.request.use((config) => {
    const requestPath = config.url ?? ''
    const token = getValidStoredToken()

    if (token && !(api === authApi && /\/(login|register)\/?$/.test(requestPath))) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })
}

reservationsApi.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = (error as AxiosError).response?.status

    if (status === 401) {
      try {
        window.localStorage.removeItem(TOKEN_KEY)
      } catch (e) {
        console.error('Failed to remove token from localStorage:', e)
      }

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login')
      }
    }

    return Promise.reject(error)
  },
)

authApi.interceptors.response.use((res) => res, (error) => Promise.reject(error))