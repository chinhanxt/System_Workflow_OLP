import { create } from 'zustand'
import apiClient from '@/api/client'

export interface Workflow {
  id: string
  name: string
  description: string
  is_active: boolean
  nodes: Record<string, any>
  edges: any[]
  created_at: string
  updated_at: string
}

export interface WorkflowRun {
  id: string
  workflow: string | Workflow
  status: 'pending' | 'running' | 'success' | 'failed' | 'pending_approval'
  state_data: Record<string, any>
  started_at: string | null
  finished_at: string | null
}

interface WorkflowState {
  workflows: Workflow[]
  activeWorkflow: Workflow | null
  workflowRuns: WorkflowRun[]
  isLoading: boolean
  error: string | null

  fetchWorkflows: () => Promise<void>
  fetchWorkflow: (id: string) => Promise<Workflow>
  createWorkflow: (data: Partial<Workflow>) => Promise<Workflow>
  updateWorkflow: (id: string, data: Partial<Workflow>) => Promise<Workflow>
  deleteWorkflow: (id: string) => Promise<void>
  triggerWorkflowRun: (workflowId: string, inputData?: Record<string, any>) => Promise<WorkflowRun>
  fetchWorkflowRuns: (workflowId?: string) => Promise<void>
  approveWorkflowRun: (runId: string) => Promise<WorkflowRun>
  rejectWorkflowRun: (runId: string) => Promise<WorkflowRun>
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflows: [],
  activeWorkflow: null,
  workflowRuns: [],
  isLoading: false,
  error: null,

  fetchWorkflows: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get('/workflows/')
      // Django standard pagination has results list inside response.data.results or response.data
      const data = response.data.results !== undefined ? response.data.results : response.data
      set({ workflows: data, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  fetchWorkflow: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.get(`/workflows/${id}/`)
      set({ activeWorkflow: response.data, isLoading: false })
      return response.data
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  createWorkflow: async (data: Partial<Workflow>) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post('/workflows/', data)
      const newWorkflow = response.data
      set((state) => ({
        workflows: [newWorkflow, ...state.workflows],
        isLoading: false
      }))
      return newWorkflow
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  updateWorkflow: async (id: string, data: Partial<Workflow>) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.put(`/workflows/${id}/`, data)
      const updated = response.data
      set((state) => ({
        workflows: state.workflows.map((w) => (w.id === id ? updated : w)),
        activeWorkflow: state.activeWorkflow?.id === id ? updated : state.activeWorkflow,
        isLoading: false
      }))
      return updated
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  deleteWorkflow: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await apiClient.delete(`/workflows/${id}/`)
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== id),
        activeWorkflow: state.activeWorkflow?.id === id ? null : state.activeWorkflow,
        isLoading: false
      }))
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  triggerWorkflowRun: async (workflowId: string, inputData?: Record<string, any>) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post(`/workflows/${workflowId}/run/`, {
        input_data: inputData || {}
      })
      const newRun = response.data
      set((state) => ({
        workflowRuns: [newRun, ...state.workflowRuns],
        isLoading: false
      }))
      return newRun
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  fetchWorkflowRuns: async (workflowId?: string) => {
    set({ isLoading: true, error: null })
    try {
      const url = workflowId ? `/workflow-runs/?workflow=${workflowId}` : '/workflow-runs/'
      const response = await apiClient.get(url)
      const data = response.data.results !== undefined ? response.data.results : response.data
      set({ workflowRuns: data, isLoading: false })
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
    }
  },

  approveWorkflowRun: async (runId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post(`/workflow-runs/${runId}/approve/`)
      const updatedRun = response.data
      set((state) => ({
        workflowRuns: state.workflowRuns.map((r) => (r.id === runId ? updatedRun : r)),
        isLoading: false
      }))
      return updatedRun
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  rejectWorkflowRun: async (runId: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await apiClient.post(`/workflow-runs/${runId}/reject/`)
      const updatedRun = response.data
      set((state) => ({
        workflowRuns: state.workflowRuns.map((r) => (r.id === runId ? updatedRun : r)),
        isLoading: false
      }))
      return updatedRun
    } catch (err: any) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  }
}))
