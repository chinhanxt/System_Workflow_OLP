import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { fullName } from '@/lib/utils'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Tổng quan</h1>
        <p className="text-sm text-slate-500">
          Xin chào, {user ? fullName(user) || user.username : ''}.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bắt đầu</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          Đây là khung React SPA kết nối tới API <code>/api/v1/</code>. Mọi tính năng người dùng
          được xây ở đây thay cho Django Admin. Vào mục <strong>Người dùng</strong> để xem ví dụ
          gọi API end-to-end.
        </CardContent>
      </Card>
    </div>
  )
}
