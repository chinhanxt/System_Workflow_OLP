import { LogOut, Search, FileText, Calendar, Database, Mail, Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { fullName } from '@/lib/utils'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="flex h-20 shrink-0 items-center justify-between bg-white/50 backdrop-blur-md px-8 border-b border-slate-100 z-5">
      {/* Search Input Bar (Capsule layout) */}
      <div className="relative w-72">
        <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
          <Search className="h-4 w-4" />
        </span>
        <input 
          type="text" 
          placeholder="Type in to search..." 
          className="w-full bg-slate-100/70 border-none outline-none py-2.5 pl-11 pr-4 rounded-xl text-xs font-semibold text-slate-600 placeholder-slate-400 focus:bg-slate-100/90 focus:ring-1 focus:ring-primary-accent/20 transition-all duration-200"
        />
      </div>

      {/* Header Utilities and Avatar */}
      <div className="flex items-center gap-6">
        {/* Icons row */}
        <div className="hidden sm:flex items-center gap-4 text-slate-400 mr-2 border-r border-slate-100 pr-6">
          <button className="hover:text-slate-600 transition-colors">
            <FileText className="h-4.5 w-4.5" />
          </button>
          <button className="hover:text-slate-600 transition-colors">
            <Calendar className="h-4.5 w-4.5" />
          </button>
          <button className="hover:text-slate-600 transition-colors">
            <Database className="h-4.5 w-4.5" />
          </button>
          
          <button className="relative hover:text-slate-600 transition-colors">
            <Mail className="h-4.5 w-4.5" />
            <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
          
          <button className="relative hover:text-slate-600 transition-colors">
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
        </div>

        {/* User Info & Avatar */}
        <div className="flex items-center gap-4">
          <div className="text-right leading-tight">
            <div className="text-sm font-bold text-slate-700">
              {user ? fullName(user) || user.username : ''}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">{user?.email}</div>
          </div>
          
          {/* Circular avatar wrapper */}
          <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100 border border-slate-100 shadow-sm flex items-center justify-center font-bold text-primary-accent text-sm">
            {user ? (user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase() : 'U'}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={logout} 
            className="text-slate-400 hover:text-red-500 hover:bg-red-50/50 rounded-xl"
            title="Đăng xuất"
          >
            <LogOut className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
