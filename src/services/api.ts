import axios, { AxiosError } from 'axios'

const authBaseURL = import.meta.env.VITE_AUTH_API_URL ?? 'https://localhost:7081/api/user'
const reservationsBaseURL =
  import.meta.env.VITE_RESERVATIONS_API_URL ?? 'http://localhost:8000'

const TOKEN_KEY = 'banana.test.jwt'

function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY)
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
    const token = getStoredToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  })
}