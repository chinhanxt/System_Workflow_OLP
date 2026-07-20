import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { FileText, CheckCircle2, Send, AlertCircle } from 'lucide-react'

interface FormField {
  name: string
  type: string
  label: string
}

interface FormConfig {
  workflow_id: string
  workflow_name: string
  fields: FormField[]
}

export function PublicFormPage() {
  const { id } = useParams<{ id: string }>()
  const [config, setConfig] = useState<FormConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [error, setError] = useState<string | null>(null)

  const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

  useEffect(() => {
    if (id) {
      axios
        .get(`${BASE_URL}/workflows/${id}/form/`)
        .then((res) => {
          setConfig(res.data)
          // Initialize form state
          const initialData: Record<string, any> = {}
          res.data.fields.forEach((field: FormField) => {
            initialData[field.name] = field.type === 'number' ? '' : ''
          })
          setFormData(initialData)
          setLoading(false)
        })
        .catch((err) => {
          setError(getApiErrorMessage(err, 'Không tải được cấu hình biểu mẫu'))
          setLoading(false)
        })
    }
  }, [id, BASE_URL])

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSubmitting(true)
    
    // Parse numbers before submitting
    const parsedData = { ...formData }
    config?.fields.forEach((field) => {
      if (field.type === 'number' && parsedData[field.name] !== '') {
        parsedData[field.name] = Number(parsedData[field.name])
      }
    })

    try {
      await axios.post(`${BASE_URL}/workflows/${id}/submit-form/`, parsedData)
      toast.success('Gửi đề xuất thành công!')
      setSubmitted(true)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi gửi đề xuất'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f0f3f8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="text-sm font-bold text-slate-500">Đang tải biểu mẫu...</span>
        </div>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f0f3f8] p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-lg p-8 border border-slate-100 flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Lỗi tải biểu mẫu</h3>
            <p className="text-xs text-slate-400 font-semibold mt-2 leading-relaxed">
              {error || 'Không tìm thấy cấu hình biểu mẫu của Workflow này.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-[#f0f3f8] py-12 px-4 font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100/50 overflow-hidden flex flex-col">
        {/* Top Header Card banner */}
        <div className="bg-gradient-to-r from-blue-600 to-[#355bf5] p-8 text-white flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-inner">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">DX-OS Public Form</span>
            <h2 className="text-lg font-extrabold tracking-tight mt-0.5">{config.workflow_name}</h2>
          </div>
        </div>

        {/* Form contents */}
        <div className="p-8">
          {submitted ? (
            <div className="flex flex-col items-center text-center gap-6 py-6 animate-in fade-in zoom-in duration-350">
              <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
                <CheckCircle2 className="h-12 w-12 stroke-[1.5px]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Gửi Thành Công!</h3>
                <p className="text-xs text-slate-400 font-semibold mt-2 leading-relaxed">
                  Đề xuất của bạn đã được tiếp nhận và kích hoạt quy trình phê duyệt tự động trên hệ thống DX-OS.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {config.fields.length === 0 ? (
                <div className="py-8 text-center text-sm font-semibold text-slate-400">
                  Biểu mẫu này chưa được cấu hình trường nhập dữ liệu nào.
                </div>
              ) : (
                config.fields.map((field) => (
                  <div key={field.name} className="flex flex-col gap-1.5 text-left">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.name]}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={`Nhập ${field.label.toLowerCase()}...`}
                        className="w-full border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24 resize-none"
                        required
                      />
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={formData[field.name]}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={`Nhập ${field.label.toLowerCase()}...`}
                        className="w-full border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                    )}
                  </div>
                ))
              )}

              {config.fields.length > 0 && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 w-full bg-primary-accent text-white py-3.5 px-4 rounded-xl shadow-[0_5px_15px_rgba(53,91,245,0.2)] hover:bg-primary-hover active:scale-[0.99] disabled:opacity-50 transition-all duration-200 text-sm font-bold mt-4"
                >
                  {submitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Gửi đề xuất quy trình</span>
                    </>
                  )}
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
