import { create } from 'zustand'
import api from '../api/client'

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee_id: string | null
  sprint_id: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  owner_id: string
  status: string
  created_at: string
}

interface TaskState {
  projects: Project[]
  tasks: Task[]
  activeProject: Project | null
  loadProjects: () => Promise<void>
  loadTasks: (projectId: string) => Promise<void>
  createProject: (name: string, description: string, ownerId: string) => Promise<Project>
  createTask: (data: Partial<Task>) => Promise<Task>
  updateTask: (id: string, data: Partial<Task>) => Promise<void>
  assignTask: (id: string, userId: string) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  setActiveProject: (p: Project | null) => void
  applyLiveEvent: (event: Task & { _topic: string }) => void
}

const MOCK_PROJECTS: Project[] = [
  { id: '1', name: 'Nexus PM — Core Platform', description: 'Main microservices architecture development', owner_id: '1', status: 'active', created_at: new Date().toISOString() },
  { id: '2', name: 'Cloud Migration', description: 'Moving from on-prem to AWS infrastructure', owner_id: '1', status: 'active', created_at: new Date().toISOString() },
]

const MOCK_TASKS: Task[] = [
  { id: '101', project_id: '1', title: 'Implement Kafka Consumer', description: 'Need to handle task.updated events in notification service', status: 'in_progress', priority: 'high', assignee_id: '1', sprint_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '102', project_id: '1', title: 'Design System Update', description: 'Improve CSS variables for the board', status: 'todo', priority: 'critical', assignee_id: '1', sprint_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '103', project_id: '1', title: 'Setup Redis Caching', description: 'Optimize user session lookups', status: 'done', priority: 'medium', assignee_id: '2', sprint_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

export const useTaskStore = create<TaskState>((set, get) => ({
  projects: [],
  tasks: [],
  activeProject: null,

  setActiveProject: (p) => set({ activeProject: p }),

  loadProjects: async () => {
    try {
      const { data } = await api.get('/projects/')
      set({ projects: data.length ? data : MOCK_PROJECTS })
    } catch {
      set({ projects: MOCK_PROJECTS })
    }
  },

  loadTasks: async (projectId) => {
    try {
      const { data } = await api.get(`/tasks/?project_id=${projectId}`)
      set({ tasks: data.length ? data : MOCK_TASKS.filter(t => t.project_id === projectId) })
    } catch {
      set({ tasks: MOCK_TASKS.filter(t => t.project_id === projectId) })
    }
  },

  createProject: async (name, description, ownerId) => {
    try {
      const { data } = await api.post('/projects/', { name, description, owner_id: ownerId })
      set(s => ({ projects: [data, ...s.projects] }))
      return data
    } catch {
      const mockProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        description,
        owner_id: ownerId,
        status: 'active',
        created_at: new Date().toISOString()
      }
      set(s => ({ projects: [mockProject, ...s.projects] }))
      return mockProject
    }
  },

  createTask: async (payload) => {
    try {
      const { data } = await api.post('/tasks/', payload)
      set(s => ({ tasks: [data, ...s.tasks] }))
      return data
    } catch {
      const mockTask: Task = {
        id: Math.random().toString(36).substr(2, 9),
        project_id: payload.project_id!,
        title: payload.title!,
        description: payload.description || '',
        status: (payload.status as any) || 'todo',
        priority: (payload.priority as any) || 'medium',
        assignee_id: payload.assignee_id || null,
        sprint_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      set(s => ({ tasks: [mockTask, ...s.tasks] }))
      return mockTask
    }
  },

  updateTask: async (id, payload) => {
    try {
      const { data } = await api.patch(`/tasks/${id}`, payload)
      set(s => ({ tasks: s.tasks.map(t => t.id === id ? data : t) }))
    } catch {
      set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, ...payload, updated_at: new Date().toISOString() } : t)
      }))
    }
  },

  assignTask: async (id, userId) => {
    try {
      const { data } = await api.patch(`/tasks/${id}/assign`, { user_id: userId })
      set(s => ({ tasks: s.tasks.map(t => t.id === id ? data : t) }))
    } catch {
      set(s => ({
        tasks: s.tasks.map(t => t.id === id ? { ...t, assignee_id: userId, updated_at: new Date().toISOString() } : t)
      }))
    }
  },

  deleteTask: async (id) => {
    try {
      await api.delete(`/tasks/${id}`)
      set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
    } catch {
      set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
    }
  },

  applyLiveEvent: (event) => {
    const { _topic, ...task } = event
    if (_topic === 'task.created') {
      const exists = get().tasks.find(t => t.id === task.id)
      if (!exists) set(s => ({ tasks: [task as Task, ...s.tasks] }))
    } else {
      set(s => ({ tasks: s.tasks.map(t => t.id === task.id ? { ...t, ...task } : t) }))
    }
  },
}))
