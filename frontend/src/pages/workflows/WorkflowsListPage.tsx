import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkflowStore } from '@/stores/workflow.store'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { 
  Plus, 
  Play, 
  Trash2, 
  Edit2, 
  FileText, 
  Activity, 
  CheckCircle
} from 'lucide-react'

// Simple SVG sparkline renderer for trends
function Sparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const width = 100
  const height = 30
  const points = values.map((val, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - 2 - (val * (height - 4))
    return `${x},${y}`
  }).join(' ')

  const strokeColor = positive ? '#10b981' : '#ef4444'
  const gradId = `spark-grad-${Math.random().toString(36).substr(2, 9)}`

  return (
    <svg className="w-24 h-8 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={`M 0,${height} L ${points} L ${width},${height} Z`} fill={`url(#${gradId})`} />
      <polyline fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

export function WorkflowsListPage() {
  const { 
    workflows, 
    fetchWorkflows, 
    createWorkflow, 
    deleteWorkflow, 
    triggerWorkflowRun,
    isLoading 
  } = useWorkflowStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    try {
      await createWorkflow({
        name: newTitle,
        description: newDesc,
        is_active: true,
        nodes: {
          "start_1": { "type": "approval", "data": {} }
        },
        edges: []
      })
      toast.success('Đã tạo workflow thành công')
      setIsModalOpen(false)
      setNewTitle('')
      setNewDesc('')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không tạo được workflow'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa workflow này không?')) return
    try {
      await deleteWorkflow(id)
      toast.success('Xóa workflow thành công')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi xóa workflow'))
    }
  }

  const handleTrigger = async (id: string) => {
    try {
      const run = await triggerWorkflowRun(id, {})
      toast.success(`Workflow run triggered successfully! Run ID: ${run.id}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không kích hoạt được workflow'))
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Data Company Progress</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">Lorem ipsum dolor sit amet</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary-accent text-white px-5 py-3 rounded-xl shadow-[0_5px_15px_rgba(53,91,245,0.2)] hover:bg-primary-hover active:scale-95 transition-all duration-200 text-xs font-bold"
        >
          <Plus className="h-4 w-4" />
          <span>New Workflow</span>
        </button>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Metric A */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100/50">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Workflows</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">{workflows.length}</span>
            <span className="text-[9px] text-[#355bf5] font-bold mt-2 bg-blue-50 px-2 py-0.5 rounded-full w-fit">Active Systems</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-primary-accent shadow-inner">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        {/* Metric B */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100/50">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Completed Runs</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">1,842</span>
            <span className="text-[9px] text-emerald-500 font-bold mt-2 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">98.4% Success</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-inner">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Metric C */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.02)] border border-slate-100/50">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Average Run Duration</span>
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">4.2s</span>
            <span className="text-[9px] text-cyan-500 font-bold mt-2 bg-cyan-50 px-2 py-0.5 rounded-full w-fit">Optimal Speed</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-500 shadow-inner">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.025)] border border-slate-100/30 overflow-hidden">
        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100/60">
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 text-center">No.</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trạng thái</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Trend (24h)</th>
                <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm font-semibold text-slate-400">
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : workflows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm font-semibold text-slate-400">
                    Chưa có workflow nào được cấu hình. Nhấp "New Workflow" để bắt đầu.
                  </td>
                </tr>
              ) : (
                workflows.map((flow, index) => {
                  // Simulate random sparklines
                  const seed = flow.name.charCodeAt(0) % 2
                  const trendValues = seed === 0 
                    ? [0.3, 0.45, 0.4, 0.6, 0.55, 0.7, 0.65, 0.85] 
                    : [0.8, 0.75, 0.6, 0.65, 0.5, 0.45, 0.35, 0.2]
                  const positive = seed === 0

                  return (
                    <tr 
                      key={flow.id} 
                      className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors duration-150"
                    >
                      <td className="py-5 px-6 text-sm font-bold text-slate-400 text-center">
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{flow.name}</span>
                          <span className="text-xs text-slate-400 mt-0.5">{flow.description || 'Không có mô tả'}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          flow.is_active 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${flow.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {flow.is_active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-5 px-6 flex items-center justify-center gap-4">
                        <Sparkline values={trendValues} positive={positive} />
                        <span className={`text-[10px] font-bold tracking-wide ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                          {positive ? '+18.4%' : '-4.2%'}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleTrigger(flow.id)}
                            className="p-2 rounded-xl bg-blue-50 text-primary-accent hover:bg-primary-accent hover:text-white transition-all duration-200"
                            title="Chạy thử nghiệm"
                          >
                            <Play className="h-4 w-4 stroke-[2.5px]" />
                          </button>
                          <Link 
                            to={`/workflows/${flow.id}/edit`}
                            className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all duration-200"
                            title="Thiết kế Canvas"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(flow.id)}
                            className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200"
                            title="Xóa luồng"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Pagination */}
        <div className="flex items-center justify-between border-t border-slate-50 px-6 py-4 bg-slate-50/20 text-xs font-semibold text-slate-500">
          <button className="px-4 py-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
            Previous
          </button>
          <div className="flex items-center gap-1.5">
            <span className="h-7 w-7 flex items-center justify-center rounded-lg bg-primary-accent text-white font-bold shadow-sm">1</span>
            <span className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-50 cursor-pointer">2</span>
            <span className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-50 cursor-pointer">3</span>
            <span>...</span>
            <span className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-slate-50 cursor-pointer">10</span>
          </div>
          <button className="px-4 py-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
            Next
          </button>
        </div>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-8 border border-slate-100 flex flex-col gap-6 animate-in fade-in zoom-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Tạo Workflow Mới</h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">Cấu hình các thông tin ban đầu</p>
            </div>
            
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tên luồng công việc</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Auto Notifier Telegram" 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Mô tả ngắn</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mô tả tóm tắt vai trò của workflow..." 
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-500 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-accent text-white hover:bg-primary-hover text-xs font-bold shadow-[0_4px_12px_rgba(53,91,245,0.2)] transition-all"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
