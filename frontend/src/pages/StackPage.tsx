import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Layers, Save, Eye, EyeOff, Key, Sparkles, Send } from 'lucide-react'

export function StackPage() {
  const [geminiKey, setGeminiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [telegramToken, setTelegramToken] = useState('')

  // Show/hide states for API keys
  const [showGemini, setShowGemini] = useState(false)
  const [showOpenai, setShowOpenai] = useState(false)
  const [showTelegram, setShowTelegram] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    const savedGemini = localStorage.getItem('GEMINI_API_KEY') || ''
    const savedOpenai = localStorage.getItem('OPENAI_API_KEY') || ''
    const savedTelegram = localStorage.getItem('TELEGRAM_BOT_TOKEN') || ''

    setGeminiKey(savedGemini)
    setOpenaiKey(savedOpenai)
    setTelegramToken(savedTelegram)
  }, [])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()

    localStorage.setItem('GEMINI_API_KEY', geminiKey.trim())
    localStorage.setItem('OPENAI_API_KEY', openaiKey.trim())
    localStorage.setItem('TELEGRAM_BOT_TOKEN', telegramToken.trim())

    toast.success('Lưu cấu hình API keys thành công!')
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary-accent" />
          <span>Cấu hình Stack Development</span>
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Quản lý các khóa bảo mật cho các mô hình ngôn ngữ lớn (LLM) và bot thông báo. Dữ liệu được lưu trữ an toàn trong LocalStorage của trình duyệt.
        </p>
      </div>

      <Card className="border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Key className="h-4.5 w-4.5 text-primary-accent" />
            <span>Thông tin API Keys & Tokens</span>
          </CardTitle>
          <p className="text-sm text-slate-500">
            Nhập khóa API cho các dịch vụ bên thứ ba để kích hoạt các Node AI và Node thông báo trong Workflow.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            
            {/* Gemini API Key */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="gemini" className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  <span>Gemini API Key</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 focus:outline-none"
                >
                  {showGemini ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showGemini ? 'Ẩn' : 'Hiện'}</span>
                </button>
              </div>
              <Input
                id="gemini"
                type={showGemini ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="rounded-xl border-slate-200 focus-visible:ring-primary-accent/20 focus-visible:ring-2 focus-visible:border-primary-accent transition-all duration-200 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 font-medium">Sử dụng cho các mô hình Google Gemini (Pro, Flash).</p>
            </div>

            {/* OpenAI API Key */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="openai" className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  <span>OpenAI API Key</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setShowOpenai(!showOpenai)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 focus:outline-none"
                >
                  {showOpenai ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showOpenai ? 'Ẩn' : 'Hiện'}</span>
                </button>
              </div>
              <Input
                id="openai"
                type={showOpenai ? 'text' : 'password'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="rounded-xl border-slate-200 focus-visible:ring-primary-accent/20 focus-visible:ring-2 focus-visible:border-primary-accent transition-all duration-200 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 font-medium">Sử dụng cho các mô hình OpenAI GPT (GPT-4o, GPT-3.5).</p>
            </div>

            {/* Telegram Bot Token */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="telegram" className="text-xs font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
                  <Send className="h-3.5 w-3.5 text-sky-500" />
                  <span>Telegram Bot Token</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setShowTelegram(!showTelegram)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 focus:outline-none"
                >
                  {showTelegram ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{showTelegram ? 'Ẩn' : 'Hiện'}</span>
                </button>
              </div>
              <Input
                id="telegram"
                type={showTelegram ? 'text' : 'password'}
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                placeholder="123456789:AABBCC..."
                className="rounded-xl border-slate-200 focus-visible:ring-primary-accent/20 focus-visible:ring-2 focus-visible:border-primary-accent transition-all duration-200 font-mono text-xs"
              />
              <p className="text-[10px] text-slate-400 font-medium">Sử dụng cho Node gửi tin nhắn / cảnh báo qua kênh Telegram.</p>
            </div>

            {/* Submit Button */}
            <div className="mt-4 border-t border-slate-100 pt-4 flex justify-end">
              <Button
                type="submit"
                className="bg-primary-accent text-white hover:bg-primary-hover py-2.5 px-6 rounded-xl shadow-[0_5px_15px_rgba(53,91,245,0.2)] active:scale-95 transition-all duration-200 text-xs font-bold flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                <span>Lưu Cấu Hình</span>
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
