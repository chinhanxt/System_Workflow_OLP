import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Settings, 
  Mail, 
  Webhook, 
  Database, 
  Cpu, 
  Plus, 
  Trash2, 
  Save, 
  Activity
} from 'lucide-react'

interface WebhookItem {
  id: string
  name: string
  url: string
  active: boolean
}

export function SettingsPage() {
  // SMTP Outgoing Settings State
  const [smtpHost, setSmtpHost] = useState('smtp.mailgun.org')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpUser, setSmtpUser] = useState('postmaster@sandbox.mailgun.org')
  const [smtpPass, setSmtpPass] = useState('••••••••••••••••••••••••')
  const [smtpSender, setSmtpSender] = useState('notifications@dx-os.net')

  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([
    { id: '1', name: 'Slack Alerts Channel', url: 'https://example.com/slack-webhook-placeholder', active: true },
    { id: '2', name: 'Discord Webhook Logs', url: 'https://discord.com/api/webhooks/123456789012345678/XXXXXXXXXXXXXXXXXXXXXX', active: true }
  ])
  const [newWebhookName, setNewWebhookName] = useState('')
  const [newWebhookUrl, setNewWebhookUrl] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    const savedHost = localStorage.getItem('smtp_host')
    if (savedHost !== null) setSmtpHost(savedHost)
    
    const savedPort = localStorage.getItem('smtp_port')
    if (savedPort !== null) setSmtpPort(savedPort)
    
    const savedUser = localStorage.getItem('smtp_user')
    if (savedUser !== null) setSmtpUser(savedUser)
    
    const savedPass = localStorage.getItem('smtp_pass')
    if (savedPass !== null) setSmtpPass(savedPass)
    
    const savedSender = localStorage.getItem('smtp_sender')
    if (savedSender !== null) setSmtpSender(savedSender)

    const savedWebhooks = localStorage.getItem('webhooks')
    if (savedWebhooks !== null) {
      try {
        setWebhooks(JSON.parse(savedWebhooks))
      } catch (err) {
        console.error('Error parsing webhooks from localStorage:', err)
      }
    }
  }, [])

  const handleSaveSmtp = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('smtp_host', smtpHost)
    localStorage.setItem('smtp_port', smtpPort)
    localStorage.setItem('smtp_user', smtpUser)
    localStorage.setItem('smtp_pass', smtpPass)
    localStorage.setItem('smtp_sender', smtpSender)
    toast.success('Đã cập nhật cấu hình máy chủ SMTP thành công!')
  }

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      toast.error('Vui lòng nhập tên webhook và URL đích')
      return
    }

    const newItem: WebhookItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: newWebhookName,
      url: newWebhookUrl,
      active: true
    }

    const updatedWebhooks = [...webhooks, newItem]
    setWebhooks(updatedWebhooks)
    localStorage.setItem('webhooks', JSON.stringify(updatedWebhooks))
    setNewWebhookName('')
    setNewWebhookUrl('')
    toast.success('Đã thêm webhook destination mới!')
  }

  const handleRemoveWebhook = (id: string) => {
    const updatedWebhooks = webhooks.filter(w => w.id !== id)
    setWebhooks(updatedWebhooks)
    localStorage.setItem('webhooks', JSON.stringify(updatedWebhooks))
    toast.success('Đã xóa webhook destination')
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary-accent" />
          <span>Cấu hình Hệ thống</span>
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Thiết lập cấu hình SMTP, quản lý webhook tích hợp, và theo dõi trạng thái vận hành của máy chủ doanh nghiệp.
        </p>
      </div>

      {/* Row 1: System Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Runs Stats */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tiến trình Hoạt động</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              5 runs
              <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />
            </span>
            <span className="text-[9px] text-blue-500 font-bold mt-2 bg-blue-50 px-2 py-0.5 rounded-full w-fit">Đang chạy ngầm</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary-accent shadow-inner">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* Database Health */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cơ sở dữ liệu</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 text-emerald-600">
              Khỏe mạnh
            </span>
            <span className="text-[9px] text-emerald-500 font-bold mt-2 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">Độ trễ 12ms</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
            <Database className="h-5 w-5" />
          </div>
        </div>

        {/* System Load */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tài nguyên CPU / RAM</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">18.4%</span>
            <span className="text-[9px] text-[#355bf5] font-bold mt-2 bg-blue-50 px-2 py-0.5 rounded-full w-fit">1.5 / 8.0 GB RAM</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-inner">
            <Cpu className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: SMTP Settings Form */}
        <Card className="border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Mail className="h-4.5 w-4.5 text-primary-accent" />
              <span>Cấu hình SMTP Outgoing Email</span>
            </CardTitle>
            <p className="text-sm text-slate-500">
              Thiết lập cổng email gửi đi phục vụ cho các thông báo giao dịch hoặc yêu cầu phê duyệt qua thư điện tử.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSmtp} className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label htmlFor="smtpHost" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Host</Label>
                  <Input
                    id="smtpHost"
                    value={smtpHost}
                    onChange={(e) => {
                      setSmtpHost(e.target.value)
                      localStorage.setItem('smtp_host', e.target.value)
                    }}
                    placeholder="smtp.example.com"
                    className="rounded-xl"
                  />
                </div>
                <div className="col-span-1 flex flex-col gap-1.5">
                  <Label htmlFor="smtpPort" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Port</Label>
                  <Input
                    id="smtpPort"
                    value={smtpPort}
                    onChange={(e) => {
                      setSmtpPort(e.target.value)
                      localStorage.setItem('smtp_port', e.target.value)
                    }}
                    placeholder="587"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="smtpUser" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tài khoản (Username)</Label>
                <Input
                  id="smtpUser"
                  value={smtpUser}
                  onChange={(e) => {
                    setSmtpUser(e.target.value)
                    localStorage.setItem('smtp_user', e.target.value)
                  }}
                  placeholder="user@example.com"
                  className="rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="smtpPass" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mật khẩu (Password)</Label>
                <Input
                  id="smtpPass"
                  type="password"
                  value={smtpPass}
                  onChange={(e) => {
                    setSmtpPass(e.target.value)
                    localStorage.setItem('smtp_pass', e.target.value)
                  }}
                  placeholder="••••••••••••"
                  className="rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="smtpSender" className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email người gửi mặc định (Sender)</Label>
                <Input
                  id="smtpSender"
                  value={smtpSender}
                  onChange={(e) => {
                    setSmtpSender(e.target.value)
                    localStorage.setItem('smtp_sender', e.target.value)
                  }}
                  placeholder="noreply@example.com"
                  className="rounded-xl"
                />
              </div>

              <div className="flex justify-end mt-2">
                <Button
                  type="submit"
                  className="bg-primary-accent text-white hover:bg-primary-hover px-5 py-2 rounded-xl shadow-md text-xs font-bold flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  <span>Lưu SMTP</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Panel 2: Webhooks destinations & Stats */}
        <Card className="border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Webhook className="h-4.5 w-4.5 text-primary-accent" />
              <span>Webhooks Destination</span>
            </CardTitle>
            <p className="text-sm text-slate-500">
              Khi workflow hoàn tất hoặc gặp lỗi, hệ thống sẽ trigger một POST request chứa log tới các URL bên dưới.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            
            {/* Form to add webhook */}
            <form onSubmit={handleAddWebhook} className="flex flex-col gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-700">Đăng ký Webhook mới</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Input
                    value={newWebhookName}
                    onChange={(e) => setNewWebhookName(e.target.value)}
                    placeholder="Tên gợi nhớ (ví dụ: Slack Log Channel)"
                    className="rounded-xl bg-white text-xs h-8"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Input
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    placeholder="Webhook URL (https://...)"
                    className="rounded-xl bg-white text-xs h-8"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  className="bg-primary-accent text-white hover:bg-primary-hover px-4 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm Webhook</span>
                </Button>
              </div>
            </form>

            {/* List of active webhooks */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Danh sách destinations ({webhooks.length})</span>
              {webhooks.length === 0 ? (
                <span className="text-xs text-slate-400 font-medium py-4 text-center">Chưa cấu hình webhook nào.</span>
              ) : (
                <div className="flex flex-col gap-2">
                  {webhooks.map((w) => (
                    <div 
                      key={w.id}
                      className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl hover:shadow-[0_5px_15px_rgba(0,0,0,0.015)] transition-all duration-150"
                    >
                      <div className="flex flex-col gap-0.5 max-w-[80%]">
                        <span className="text-xs font-bold text-slate-700">{w.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono truncate">{w.url}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" title="Active" />
                        <button
                          type="button"
                          onClick={() => handleRemoveWebhook(w.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Gỡ webhook"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
