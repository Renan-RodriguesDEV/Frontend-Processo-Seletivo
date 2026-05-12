import { authApi } from './api'
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types'

export const authService = {
  async login(payload: LoginRequest) {
    const response = await authApi.post<LoginResponse>('/login', payload)
    return response.data
  },

  async register(payload: RegisterRequest) {
    const response = await authApi.post<RegisterResponse>('/register', payload)
    return response.data
  },
}