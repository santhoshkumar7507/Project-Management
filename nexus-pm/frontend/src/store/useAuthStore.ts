import { create } from 'zustand'
import api from '../api/client'

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

interface AuthState {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, full_name: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,

  login: async (email, password) => {
    try {
      const { data } = await api.post('/auth/login/', { email, password })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      set({ user: data.user })
    } catch {
      // Mock login for demo
      const mockUser = { id: '1', email, full_name: 'Vignesh Kumar', role: 'Lead Developer' }
      set({ user: mockUser })
      localStorage.setItem('access_token', 'mock_token')
    }
  },

  register: async (email, password, full_name) => {
    try {
      const { data } = await api.post('/auth/register/', { email, password, full_name })
      localStorage.setItem('access_token', data.access)
      localStorage.setItem('refresh_token', data.refresh)
      set({ user: data.user })
    } catch {
      const mockUser = { id: '1', email, full_name, role: 'Lead Developer' }
      set({ user: mockUser })
      localStorage.setItem('access_token', 'mock_token')
    }
  },

  logout: () => {
    localStorage.clear()
    set({ user: null })
  },

  fetchMe: async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) return
      if (token === 'mock_token') {
        set({ user: { id: '1', email: 'dev@nexus.com', full_name: 'Vignesh Kumar', role: 'Lead Developer' } })
        return
      }
      const { data } = await api.get('/auth/me/')
      set({ user: data })
    } catch {
      // Keep mock user if any
    }
  },
}))
