import { useEffect, useState, useRef } from 'react'
import apiClient from '@/api/client'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { FileText, Upload, Calendar, Trash2, FileUp } from 'lucide-react'

interface DocumentChunk {
  id: string
  document_name: string
  text_content: string
  created_at: string
  updated_at: string
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentChunk[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form states
  const [documentName, setDocumentName] = useState('')
  const [textContent, setTextContent] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.get('/document-chunks/')
      // Handle standard DRF list or paginated response format
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.results || []
      setDocuments(data)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Không tải được danh sách tài liệu'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước tệp vượt quá giới hạn cho phép (tối đa 5MB)')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setDocumentName(file.name)
      setTextContent(content)
      toast.success(`Đã đọc nội dung file: ${file.name}`)
    }
    reader.onerror = () => {
      toast.error('Lỗi khi đọc file')
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!documentName.trim() || !textContent.trim()) {
      toast.error('Vui lòng điền đầy đủ tên tài liệu và nội dung')
      return
    }

    setIsSubmitting(true)
    try {
      await apiClient.post('/document-chunks/', {
        document_name: documentName,
        text_content: textContent,
      })
      toast.success('Tải lên tài liệu thành công!')
      setDocumentName('')
      setTextContent('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      fetchDocuments()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi tải lên tài liệu'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) return
    try {
      await apiClient.delete(`/document-chunks/${id}/`)
      toast.success('Đã xóa tài liệu')
      fetchDocuments()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi xóa tài liệu'))
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary-accent" />
          <span>Quản lý Tài liệu</span>
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Tải lên và xem trước các phân đoạn tài liệu dùng cho hệ thống tìm kiếm ngữ cảnh RAG.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Card */}
        <Card className="lg:col-span-1 border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] h-fit">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileUp className="h-4 w-4 text-primary-accent" />
              <span>Tải lên tài liệu</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* File upload zone */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Chọn từ tệp tin (.txt)
                </Label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-primary-accent hover:bg-blue-50/10 transition-all duration-200"
                >
                  <Upload className="h-6 w-6 text-slate-400 mb-2" />
                  <span className="text-xs text-slate-500 font-medium">Click để chọn file text</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="docName" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Tên tài liệu
                </Label>
                <Input
                  id="docName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Ví dụ: huong_dan_su_dung.txt"
                  className="rounded-xl border-slate-200 focus-visible:ring-primary-accent/20 focus-visible:ring-2 focus-visible:border-primary-accent transition-all duration-200"
                  required
                />
              </div>

              {/* Text content textarea */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="textContent" className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Nội dung tài liệu
                </Label>
                <textarea
                  id="textContent"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Nhập hoặc dán nội dung văn bản thô vào đây..."
                  className="w-full min-h-[200px] border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent/20 focus:border-primary-accent transition-all duration-200 resize-y"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-accent text-white hover:bg-primary-hover py-2.5 rounded-xl shadow-[0_5px_15px_rgba(53,91,245,0.2)] active:scale-95 transition-all duration-200 text-xs font-bold"
              >
                {isSubmitting && <Spinner className="h-4.5 w-4.5 text-white" />}
                <span>{isSubmitting ? 'Đang gửi...' : 'Tải lên Hệ thống'}</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: Listing Card */}
        <Card className="lg:col-span-2 border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden">
          <CardHeader className="border-b border-slate-50/60 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-800">
                Tài liệu đã tải lên ({documents.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchDocuments} className="rounded-xl text-xs font-semibold">
                Làm mới
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-sm font-semibold text-slate-400">
                <Spinner className="h-6 w-6 text-primary-accent" />
                <span>Đang tải danh sách tài liệu...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-20 text-sm text-slate-400 font-semibold">
                Chưa có tài liệu nào được tải lên.
              </div>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-6">Tên tài liệu</TH>
                    <TH className="text-xs font-bold text-slate-400 uppercase tracking-wider">Xem trước nội dung</TH>
                    <TH className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày tải lên</TH>
                    <TH className="text-xs font-bold text-slate-400 uppercase tracking-wider text-right pr-6">Thao tác</TH>
                  </TR>
                </THead>
                <TBody>
                  {documents.map((doc) => (
                    <TR key={doc.id} className="hover:bg-slate-50/50">
                      <TD className="pl-6 py-4 font-bold text-slate-700 max-w-[180px] truncate" title={doc.document_name}>
                        {doc.document_name}
                      </TD>
                      <TD className="py-4 text-xs text-slate-500 max-w-[280px] truncate" title={doc.text_content}>
                        {doc.text_content}
                      </TD>
                      <TD className="py-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(doc.created_at)}
                        </span>
                      </TD>
                      <TD className="pr-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-white transition-all duration-200"
                          title="Xóa tài liệu"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
