import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { fullName } from '@/lib/utils'

export function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6">
      <div className="text-right leading-tight">
        <div className="text-sm font-medium text-slate-900">
          {user ? fullName(user) || user.username : ''}
        </div>
        <div className="text-xs text-slate-500">{user?.email}</div>
      </div>
      <Button variant="outline" size="sm" onClick={logout}>
        <LogOut className="h-4 w-4" />
        Đăng xuất
      </Button>
    </header>
  )
}
