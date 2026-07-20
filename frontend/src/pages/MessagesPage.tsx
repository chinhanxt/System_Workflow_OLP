import { useEffect, useState } from 'react'
import apiClient from '@/api/client'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { MessageSquare, Calendar, RefreshCw, AlertCircle } from 'lucide-react'

interface WorkflowRun {
  id: string
  workflow: string // UUID
  status: 'pending' | 'running' | 'success' | 'failed' | 'pending_approval'
  state_data: Record<string, any>
  started_at: string | null
  finished_at: string | null
}

interface Workflow {
  id: string
  name: string
}

export function MessagesPage() {
  const [runs, setRuns] = useState<WorkflowRun[]>([])
  const [workflowsMap, setWorkflowsMap] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch both runs and workflows to map workflow UUID -> Name
      const [runsRes, workflowsRes] = await Promise.all([
        apiClient.get('/workflow-runs/'),
        apiClient.get('/workflows/')
      ])

      const runsData = Array.isArray(runsRes.data)
        ? runsRes.data
        : runsRes.data?.results || []

      const workflowsData = Array.isArray(workflowsRes.data)
        ? workflowsRes.data
        : workflowsRes.data?.results || []

      // Create mapping: id -> name
      const wfMap: Record<string, string> = {}
      workflowsData.forEach((w: Workflow) => {
        wfMap[w.id] = w.name
      })

      setWorkflowsMap(wfMap)
      setRuns(runsData)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi tải lịch sử chạy workflows'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusBadge = (status: WorkflowRun['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            Thành công
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Thất bại
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Đang xử lý
          </span>
        )
      case 'pending_approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Chờ duyệt
          </span>
        )
      case 'running':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Đang chạy
          </span>
        )
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary-accent" />
            <span>Lịch sử Vận hành (Runs)</span>
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Theo dõi tất cả các luồng chạy thử hoặc tự động của hệ thống workflows.
          </p>
        </div>
        <Button
          onClick={fetchData}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-2 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all duration-200"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </Button>
      </div>

      {/* Main Listing Card */}
      <Card className="border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
        <CardHeader className="border-b border-slate-50/60 pb-4">
          <CardTitle className="text-base font-bold text-slate-800">
            Danh sách lượt thực thi ({runs.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-sm font-semibold text-slate-400">
              <Spinner className="h-6 w-6 text-primary-accent" />
              <span>Đang tải lịch sử runs...</span>
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-20 text-sm text-slate-400 font-semibold flex flex-col items-center gap-3">
              <AlertCircle className="h-8 w-8 text-slate-300" />
              <span>Chưa có lượt thực thi nào được ghi nhận.</span>
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-6 w-1/4">Mã Lượt chạy (Run ID)</TH>
                  <TH className="text-xs font-bold text-slate-400 uppercase tracking-wider w-1/4">Tên Workflow</TH>
                  <TH className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái</TH>
                  <TH className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bắt đầu lúc</TH>
                  <TH className="text-xs font-bold text-slate-400 uppercase tracking-wider pr-6">Kết thúc lúc</TH>
                </TR>
              </THead>
              <TBody>
                {runs.map((run) => (
                  <TR key={run.id} className="hover:bg-slate-50/50">
                    <TD className="pl-6 py-4 font-mono text-xs text-slate-500 truncate" title={run.id}>
                      {run.id}
                    </TD>
                    <TD className="py-4 font-bold text-slate-700">
                      {workflowsMap[run.workflow] || `Workflow (${run.workflow.substring(0, 8)})`}
                    </TD>
                    <TD className="py-4">
                      {getStatusBadge(run.status)}
                    </TD>
                    <TD className="py-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(run.started_at)}
                      </span>
                    </TD>
                    <TD className="pr-6 py-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatDate(run.finished_at)}
                      </span>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
