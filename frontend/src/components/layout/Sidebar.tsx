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

export function Sidebar() {
  const [pendingApprovalCount, setPendingApprovalCount] = useState<number>(0)

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
        <button className="flex w-full items-center justify-between bg-primary-accent text-white px-4 py-3 rounded-xl shadow-[0_8px_20px_rgba(53,91,245,0.2)] hover:bg-primary-hover transition-all duration-200 text-sm font-medium">
          <span className="tracking-wide">Select Project</span>
          <ChevronDown className="h-4 w-4 opacity-80" />
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
        <button className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-[#00c6ff] to-[#0072ff] text-white py-3 px-4 rounded-xl shadow-[0_6px_20px_rgba(0,198,255,0.25)] hover:shadow-[0_8px_25px_rgba(0,198,255,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 text-sm font-bold">
          <Plus className="h-4 w-4 stroke-[3px]" />
          <span>Create Project</span>
        </button>
      </div>
    </aside>
  )
}
