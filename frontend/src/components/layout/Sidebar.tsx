import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  GitFork, 
  MessageSquare, 
  FileText, 
  Layers, 
  Settings as SettingsIcon, 
  Plus,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import apiClient from '@/api/client'
import { useWorkflowStore } from '@/stores/workflow.store'

export function Sidebar() {
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number>(0)

  const {
    activeProject,
    projects,
    setActiveProject,
    addProject,
    loadProjectsFromStorage
  } = useWorkflowStore()

  const [showSelectModal, setShowSelectModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')

  useEffect(() => {
    loadProjectsFromStorage()
  }, [loadProjectsFromStorage])

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await apiClient.get('/workflow-runs/')
        const runs = Array.isArray(res.data) ? res.data : res.data?.results || []
        const count = runs.filter((run: any) => run.status === 'pending_approval').length
        setPendingApprovalCount(count)
      } catch (err) {
        console.error('Error fetching workflow runs count for sidebar badge:', err)
      }
    }
    fetchPendingCount()
  }, [])

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-white border-r border-slate-100 shadow-[10px_0_30px_rgba(0,0,0,0.01)] z-10">
      {/* Brand logo header */}
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white text-lg shadow-[0_5px_15px_rgba(37,99,235,0.3)]">
          .d
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800 tracking-wide">Dashboard</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Admin</span>
        </div>
      </div>

      {/* Select Project Dropdown */}
      <div className="px-4 mb-6">
        <button
          onClick={() => setShowSelectModal(true)}
          className="flex w-full items-center justify-between bg-primary-accent text-white px-4 py-3 rounded-xl shadow-[0_8px_20px_rgba(53,91,245,0.2)] hover:bg-primary-hover transition-all duration-200 text-sm font-medium cursor-pointer"
        >
          <span className="tracking-wide truncate pr-2">{activeProject}</span>
          <ChevronDown className="h-4 w-4 opacity-80 shrink-0" />
        </button>
      </div>

      {/* Nav Menu items */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Menu category */}
        <div className="mb-4">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Menu
          </div>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive 
                    ? 'text-primary-accent bg-blue-50/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-4 w-4" />
                <span>Tổng quan</span>
              </div>
            </NavLink>

            <NavLink
              to="/workflows"
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive 
                    ? 'text-primary-accent bg-blue-50/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              <div className="flex items-center gap-3">
                <GitFork className="h-4 w-4" />
                <span>Workflows</span>
              </div>
            </NavLink>

            <NavLink
              to="/runs"
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive 
                    ? 'text-primary-accent bg-blue-50/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4" />
                <span>Lịch sử chạy</span>
              </div>
              {pendingApprovalCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                  {pendingApprovalCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/documents"
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive 
                    ? 'text-primary-accent bg-blue-50/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4" />
                <span>Tài liệu</span>
              </div>
            </NavLink>

            <NavLink
              to="/users"
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive 
                    ? 'text-primary-accent bg-blue-50/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                <span>Người dùng</span>
              </div>
            </NavLink>
          </nav>
        </div>

        {/* Configuration category */}
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Configuration
          </div>
          <nav className="flex flex-col gap-1">
            <NavLink
              to="/stack"
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive 
                    ? 'text-primary-accent bg-blue-50/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              <div className="flex items-center gap-3">
                <Layers className="h-4 w-4" />
                <span>Stack dev</span>
              </div>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  isActive 
                    ? 'text-primary-accent bg-blue-50/50' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-4 w-4" />
                <span>Cấu hình</span>
              </div>
            </NavLink>
          </nav>
        </div>
      </div>

      {/* Bottom CTA Project Button */}
      <div className="p-4 border-t border-slate-50 bg-slate-50/30">
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-[#00c6ff] to-[#0072ff] text-white py-3 px-4 rounded-xl shadow-[0_6px_20px_rgba(0,198,255,0.25)] hover:shadow-[0_8px_25px_rgba(0,198,255,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-sm font-bold cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3px]" />
          <span>Create Project</span>
        </button>
      </div>

      {/* Select Project Modal */}
      {showSelectModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-8 border border-slate-100 flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Select Project</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Choose a project workspace to display workflows</p>
            </div>
            
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {projects.map((proj) => (
                <button
                  key={proj}
                  onClick={() => {
                    setActiveProject(proj)
                    setShowSelectModal(false)
                  }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border cursor-pointer",
                    activeProject === proj
                      ? "bg-blue-50/50 border-primary-accent text-primary-accent shadow-sm"
                      : "bg-slate-50/50 border-slate-100 hover:border-slate-300 text-slate-600 hover:text-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{proj}</span>
                    {activeProject === proj && (
                      <span className="h-2 w-2 rounded-full bg-primary-accent"></span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-50 pt-4">
              <button 
                type="button" 
                onClick={() => setShowSelectModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-8 border border-slate-100 flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Create New Project</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Add a new project workspace</p>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const trimmedName = newProjectName.trim()
                if (trimmedName) {
                  addProject(trimmedName)
                  setActiveProject(trimmedName)
                  setNewProjectName('')
                  setShowCreateModal(false)
                }
              }} 
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Project Name</label>
                <input 
                  type="text" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Marketing Automation" 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-50 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewProjectName('')
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-accent text-white hover:bg-primary-hover text-xs font-bold shadow-[0_4px_12px_rgba(53,91,245,0.2)] transition-all cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}
