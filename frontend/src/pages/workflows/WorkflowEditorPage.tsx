import { useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Connection,
  type Edge,
  type Node,
  type NodeProps
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useWorkflowStore } from '@/stores/workflow.store'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-error'
import { 
  ArrowLeft, 
  Save, 
  Play, 
  Plus, 
  MessageSquare, 
  GitFork, 
  CheckSquare, 
  Trash2,
  FileText,
  Globe,
  Database,
  PenTool,
  BrainCircuit,
  Binary
} from 'lucide-react'

// Custom node data types
type BaseNodeData = {
  label: string
  onChange: (id: string, field: string, value: any) => void
  onDelete: (id: string) => void
  [key: string]: any
}

// 1. Custom Telegram Notifier Node
function TelegramNode({ id, data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-72 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-blue-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Telegram Notifier</span>
        </div>
        <button 
          onClick={() => data.onDelete(id)}
          className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 text-left">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Bot Token</label>
          <input 
            type="text" 
            value={data.bot_token || ''}
            onChange={(e) => data.onChange(id, 'bot_token', e.target.value)}
            placeholder="HTTP API Token"
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Chat ID</label>
          <input 
            type="text" 
            value={data.chat_id || ''}
            onChange={(e) => data.onChange(id, 'chat_id', e.target.value)}
            placeholder="e.g. @channel or -100123"
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Message Template</label>
          <textarea 
            value={data.message || ''}
            onChange={(e) => data.onChange(id, 'message', e.target.value)}
            placeholder="Hello {node_id.value}"
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs h-16 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/20"
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-blue-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-blue-500 border-2 border-white" />
    </div>
  )
}

// 2. Custom Condition Router Node
function ConditionNode({ id, data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-72 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-amber-500 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Condition Router</span>
        </div>
        <button 
          onClick={() => data.onDelete(id)}
          className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 text-left">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Variable Path</label>
          <input 
            type="text" 
            value={data.variable || ''}
            onChange={(e) => data.onChange(id, 'variable', e.target.value)}
            placeholder="e.g. form_builder_1.amount"
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Operator</label>
            <select
              value={data.operator || '=='}
              onChange={(e) => data.onChange(id, 'operator', e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/20"
            >
              <option value="==">==</option>
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value="!=">!=</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Target Value</label>
            <input 
              type="text" 
              value={data.value || ''}
              onChange={(e) => data.onChange(id, 'value', e.target.value)}
              placeholder="e.g. 100"
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-amber-500 border-2 border-white" />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="true" 
        style={{ left: '30%' }}
        className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="false" 
        style={{ left: '70%' }}
        className="w-2.5 h-2.5 bg-rose-500 border-2 border-white" 
      />
    </div>
  )
}

// 3. Custom Approval Node
function ApprovalNode({ id, data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-72 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-emerald-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Human Approval</span>
        </div>
        <button 
          onClick={() => data.onDelete(id)}
          className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 text-left">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Approval Label</label>
          <input 
            type="text" 
            value={data.label || ''}
            onChange={(e) => data.onChange(id, 'label', e.target.value)}
            placeholder="e.g. Phê duyệt chi tiêu"
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          Tạm dừng luồng và gửi email/webhook chờ phê duyệt. Luồng sẽ tiếp tục sau khi phê duyệt/từ chối.
        </p>
      </div>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white" />
    </div>
  )
}

// 4. Custom Form Builder Node Component (Tầng H)
function FormBuilderNodeComponent({ id, data }: NodeProps<Node<BaseNodeData>>) {
  const fields = data.fields || []
  const workflowId = window.location.pathname.split('/')[2] || ''

  const handleAddField = () => {
    const updated = [...fields, { name: `field_${Date.now().toString(36).substr(-3)}`, type: 'text', label: 'New Field' }]
    data.onChange(id, 'fields', updated)
  }

  const handleRemoveField = (index: number) => {
    const updated = fields.filter((_: any, i: number) => i !== index)
    data.onChange(id, 'fields', updated)
  }

  const handleFieldChange = (index: number, key: string, value: string) => {
    const updated = fields.map((f: any, i: number) => i === index ? { ...f, [key]: value } : f)
    data.onChange(id, 'fields', updated)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-72 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Form Builder</span>
        </div>
        <button 
          onClick={() => data.onDelete(id)}
          className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 text-left">
        <div className="text-[10px] text-indigo-600 font-bold leading-normal bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50 flex flex-col gap-1">
          <span>Form Link:</span>
          <a 
            href={`/public/form/${workflowId}`} 
            target="_blank" 
            rel="noreferrer" 
            className="underline break-all text-blue-600 font-semibold"
          >
            /public/form/{workflowId.substr(0, 8)}...
          </a>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Fields List</label>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {fields.map((field: any, idx: number) => (
              <div key={idx} className="flex flex-col gap-1 bg-slate-50 p-2 rounded-lg border border-slate-100 relative">
                <button 
                  onClick={() => handleRemoveField(idx)} 
                  className="absolute top-1 right-1 text-slate-300 hover:text-red-500"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <input 
                  type="text" 
                  value={field.label}
                  onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                  placeholder="Field Label"
                  className="bg-transparent font-semibold border-none outline-none text-xs text-slate-700 w-11/12 focus:ring-0"
                />
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  <input 
                    type="text" 
                    value={field.name}
                    onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                    placeholder="field_key"
                    className="bg-white border border-slate-200/80 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                    className="bg-white border border-slate-200/80 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="textarea">Textarea</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={handleAddField}
            className="flex items-center justify-center gap-1.5 border border-dashed border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-lg py-1.5 text-xs text-slate-500 transition-all font-semibold"
          >
            <Plus className="h-3 w-3" />
            <span>Thêm trường</span>
          </button>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-indigo-500 border-2 border-white" />
    </div>
  )
}

// 5. Custom API Request Node Component (Tầng D)
function APIRequestNodeComponent({ id, data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-72 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-sky-500 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">API Request</span>
        </div>
        <button 
          onClick={() => data.onDelete(id)}
          className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 text-left">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Method</label>
            <select
              value={data.method || 'GET'}
              onChange={(e) => data.onChange(id, 'method', e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-1.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500/20"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Endpoint URL</label>
            <input 
              type="text" 
              value={data.url || ''}
              onChange={(e) => data.onChange(id, 'url', e.target.value)}
              placeholder="https://api.com/{form_1.id}"
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500/20"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Headers (JSON)</label>
          <textarea 
            value={data.headers ? JSON.stringify(data.headers, null, 2) : '{}'}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                data.onChange(id, 'headers', parsed)
              } catch {
                // Allow user typing raw invalid JSON temporarily
              }
            }}
            placeholder='{"Authorization": "Bearer {key}"}'
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs h-12 resize-none focus:outline-none focus:ring-1 focus:ring-sky-500/20"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Body Content</label>
          <textarea 
            value={data.body || ''}
            onChange={(e) => data.onChange(id, 'body', e.target.value)}
            placeholder='{"user": "{form_1.employee_name}"}'
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs h-16 resize-none focus:outline-none focus:ring-1 focus:ring-sky-500/20"
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-sky-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-sky-500 border-2 border-white" />
    </div>
  )
}

// 6. Custom Google Sheets Node Component (Tầng D)
function GoogleSheetsNodeComponent({ id, data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-72 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-emerald-500 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Google Sheets</span>
        </div>
        <button 
          onClick={() => data.onDelete(id)}
          className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 text-left">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Spreadsheet ID</label>
          <input 
            type="text" 
            value={data.spreadsheet_id || ''}
            onChange={(e) => data.onChange(id, 'spreadsheet_id', e.target.value)}
            placeholder="e.g. 1QyYF-p4X..."
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Sheet Name</label>
            <input 
              type="text" 
              value={data.sheet_name || 'Sheet1'}
              onChange={(e) => data.onChange(id, 'sheet_name', e.target.value)}
              placeholder="Sheet1"
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Action</label>
            <select
              value={data.action || 'append'}
              onChange={(e) => data.onChange(id, 'action', e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
            >
              <option value="append">Append Row</option>
              <option value="read">Read Data</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Row Values (CSV)</label>
          <input 
            type="text" 
            value={data.row_data || ''}
            onChange={(e) => data.onChange(id, 'row_data', e.target.value)}
            placeholder="{form_1.name}, {form_1.amount}"
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white" />
    </div>
  )
}

// 7. Custom Prompt Template Node Component (Tầng I)
function PromptTemplateNodeComponent({ id, data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-72 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-violet-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <PenTool className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Prompt Template</span>
        </div>
        <button 
          onClick={() => data.onDelete(id)}
          className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 text-left">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Template Prompt</label>
          <textarea 
            value={data.template || ''}
            onChange={(e) => data.onChange(id, 'template', e.target.value)}
            placeholder="Hãy viết tóm tắt đề xuất {form_1.reason}"
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs h-24 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-violet-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-violet-500 border-2 border-white" />
    </div>
  )
}

// 8. Custom LLM Node Component (Tầng I)
function LLMNodeComponent({ id, data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-72 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-purple-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">LLM AI Assistant</span>
        </div>
        <button 
          onClick={() => data.onDelete(id)}
          className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 text-left">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Provider</label>
            <select
              value={data.provider || 'gemini'}
              onChange={(e) => data.onChange(id, 'provider', e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-1.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500/20"
            >
              <option value="gemini">Gemini</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Temperature</label>
            <input 
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={data.temperature ?? 0.7}
              onChange={(e) => data.onChange(id, 'temperature', parseFloat(e.target.value))}
              placeholder="0.7"
              className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Model Selection</label>
          <select
            value={data.model || (data.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-1.5-flash')}
            onChange={(e) => data.onChange(id, 'model', e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-1.5 py-1.5 text-xs focus:outline-none"
          >
            {data.provider === 'openai' ? (
              <>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
              </>
            ) : (
              <>
                <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                <option value="gemini-1.5-pro">gemini-1.5-pro</option>
              </>
            )}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Prompt (Or Auto Input)</label>
          <input 
            type="text" 
            value={data.prompt || ''}
            onChange={(e) => data.onChange(id, 'prompt', e.target.value)}
            placeholder="e.g. {prompt_template_1.prompt}"
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
          />
        </div>
      </div>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-purple-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-purple-500 border-2 border-white" />
    </div>
  )
}

// 9. Custom RAG Search Node Component (Tầng I)
function RAGSearchNodeComponent({ id, data }: NodeProps<Node<BaseNodeData>>) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] w-72 overflow-hidden animate-in fade-in zoom-in duration-200">
      <div className="bg-fuchsia-600 px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <Binary className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">RAG Knowledge Search</span>
        </div>
        <button 
          onClick={() => data.onDelete(id)}
          className="text-white/60 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 text-left">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Search Query</label>
          <input 
            type="text" 
            value={data.query || ''}
            onChange={(e) => data.onChange(id, 'query', e.target.value)}
            placeholder="e.g. Quy chế chi cho {form_1.amount}"
            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-fuchsia-500/20"
          />
        </div>
        <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          Tìm kiếm các văn bản quy định nội bộ có nghĩa tương đồng nhất để đưa vào ngữ cảnh AI.
        </p>
      </div>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 bg-fuchsia-500 border-2 border-white" />
      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 bg-fuchsia-500 border-2 border-white" />
    </div>
  )
}

export function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { 
    activeWorkflow, 
    fetchWorkflow, 
    updateWorkflow, 
    triggerWorkflowRun 
  } = useWorkflowStore()

  // Register custom node types
  const nodeTypes = useMemo(() => ({
    telegram: TelegramNode,
    condition: ConditionNode,
    approval: ApprovalNode,
    form_builder: FormBuilderNodeComponent,
    api_request: APIRequestNodeComponent,
    google_sheets: GoogleSheetsNodeComponent,
    prompt_template: PromptTemplateNodeComponent,
    llm: LLMNodeComponent,
    rag_search: RAGSearchNodeComponent
  }), [])

  // Nodes & Edges local states
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Load workflow from store
  useEffect(() => {
    if (id) {
      fetchWorkflow(id).then((flow) => {
        // Map backend registry representation to React Flow representation
        const loadedNodes: Node[] = []
        
        Object.entries(flow.nodes || {}).forEach(([nodeId, nodeConfig]: [string, any]) => {
          const type = nodeConfig.type || 'approval'
          const x = nodeConfig.x ?? 150
          const y = nodeConfig.y ?? 100
          
          loadedNodes.push({
            id: nodeId,
            type,
            position: { x, y },
            data: {
              label: nodeConfig.label || nodeId,
              bot_token: nodeConfig.bot_token,
              chat_id: nodeConfig.chat_id,
              message: nodeConfig.message,
              variable_path: nodeConfig.variable_path,
              operator: nodeConfig.operator,
              target_value: nodeConfig.target_value,
              // Map advanced config variables
              fields: nodeConfig.fields,
              url: nodeConfig.url,
              method: nodeConfig.method,
              headers: nodeConfig.headers,
              body: nodeConfig.body,
              spreadsheet_id: nodeConfig.spreadsheet_id,
              sheet_name: nodeConfig.sheet_name,
              action: nodeConfig.action,
              row_data: nodeConfig.row_data,
              template: nodeConfig.template,
              provider: nodeConfig.provider,
              model: nodeConfig.model,
              temperature: nodeConfig.temperature,
              prompt: nodeConfig.prompt,
              query: nodeConfig.query,

              onChange: handleNodeDataChange,
              onDelete: handleNodeDelete
            }
          })
        })

        setNodes(loadedNodes)
        
        // Map edges
        const loadedEdges = (flow.edges || []).map((e: any, index: number) => ({
          id: e.id || `e-${index}`,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle || null,
          animated: true,
          style: { stroke: '#355bf5', strokeWidth: 2 }
        }))
        setEdges(loadedEdges)
      }).catch(() => {
        toast.error('Không tìm thấy workflow')
        navigate('/workflows')
      })
    }
  }, [id, fetchWorkflow, navigate])

  // Handle data updates in dynamic inputs inside nodes
  const handleNodeDataChange = useCallback((nodeId: string, field: string, value: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              [field]: value
            }
          }
        }
        return node
      })
    )
  }, [setNodes])

  // Handle Node Deletion
  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    toast.info(`Đã gỡ node: ${nodeId}`)
  }, [setNodes, setEdges])

  // Connect handler
  const onConnect = useCallback(
    (params: Connection) => {
      const customEdge: Edge = {
        ...params,
        id: `e-${Date.now()}`,
        animated: true,
        style: { stroke: '#355bf5', strokeWidth: 2 }
      }
      setEdges((eds) => addEdge(customEdge, eds))
    },
    [setEdges]
  )

  // Add a new node dynamically to canvas
  const addNewNode = (type: 'telegram' | 'condition' | 'approval' | 'form_builder' | 'api_request' | 'google_sheets' | 'prompt_template' | 'llm' | 'rag_search') => {
    const newId = `${type}_${Date.now().toString(36).substr(-4)}`
    
    // Position node with small offset from center
    const x = 200 + Math.random() * 100
    const y = 150 + Math.random() * 100

    const defaultLabels = {
      telegram: 'Telegram Notifier',
      condition: 'Condition Router',
      approval: 'Human Approval',
      form_builder: 'Form Builder',
      api_request: 'API Request',
      google_sheets: 'Google Sheets',
      prompt_template: 'Prompt Template',
      llm: 'LLM AI Assistant',
      rag_search: 'RAG Knowledge Search'
    }

    const newNode: Node = {
      id: newId,
      type,
      position: { x, y },
      data: {
        label: defaultLabels[type],
        bot_token: '',
        chat_id: '',
        message: '',
        variable_path: '',
        operator: '==',
        target_value: '',
        // Initialize defaults for advanced configurations
        fields: [],
        url: '',
        method: 'GET',
        headers: {},
        body: '',
        spreadsheet_id: '',
        sheet_name: 'Sheet1',
        action: 'append',
        row_data: '',
        template: '',
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        temperature: 0.7,
        prompt: '',
        query: '',

        onChange: handleNodeDataChange,
        onDelete: handleNodeDelete
      }
    }

    setNodes((nds) => [...nds, newNode])
    toast.success(`Đã thêm Node ${defaultLabels[type]} thành công`)
  }

  // Save layout & nodes back to Django backend
  const handleSave = async () => {
    if (!id || !activeWorkflow) return

    // Convert React Flow representation back to Django format
    const nodesConfig: Record<string, any> = {}
    nodes.forEach((node) => {
      nodesConfig[node.id] = {
        type: node.type,
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
        label: node.data.label,
        bot_token: node.data.bot_token,
        chat_id: node.data.chat_id,
        message: node.data.message,
        variable_path: node.data.variable_path,
        operator: node.data.operator,
        target_value: node.data.target_value,
        // Advanced node values
        fields: node.data.fields,
        url: node.data.url,
        method: node.data.method,
        headers: node.data.headers,
        body: node.data.body,
        spreadsheet_id: node.data.spreadsheet_id,
        sheet_name: node.data.sheet_name,
        action: node.data.action,
        row_data: node.data.row_data,
        template: node.data.template,
        provider: node.data.provider,
        model: node.data.model,
        temperature: node.data.temperature,
        prompt: node.data.prompt,
        query: node.data.query
      }
    })

    const edgesConfig = edges.map((e) => ({
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle || null
    }))

    try {
      await updateWorkflow(id, {
        nodes: nodesConfig,
        edges: edgesConfig
      })
      toast.success('Đã lưu cấu hình Workflow thành công!')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi lưu cấu hình'))
    }
  }

  // Run execution directly from canvas
  const handleRun = async () => {
    if (!id) return
    try {
      // Save changes first
      await handleSave()
      const run = await triggerWorkflowRun(id, {})
      toast.success(`Đã kích hoạt luồng thành công! Run ID: ${run.id}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Lỗi khi kích hoạt luồng'))
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-[#f0f3f8] relative rounded-3xl overflow-hidden shadow-[0_10px_35px_rgba(0,0,0,0.015)] border border-slate-100/50">
      {/* Floating Header Actions Bar */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10 bg-white/70 backdrop-blur-md px-6 py-4 rounded-2xl shadow-sm border border-slate-100 max-w-full overflow-x-auto gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={() => navigate('/workflows')}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              {activeWorkflow?.name || 'Loading Workflow...'}
            </h2>
            <span className="text-[10px] text-slate-400 font-semibold">Canvas Editor Flow</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={() => addNewNode('form_builder')}
            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            title="Form Builder Node"
          >
            <Plus className="h-3 w-3" />
            <span>Form</span>
          </button>

          <button 
            onClick={() => addNewNode('telegram')}
            className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            title="Telegram Notifier Node"
          >
            <Plus className="h-3 w-3" />
            <span>Telegram</span>
          </button>
          
          <button 
            onClick={() => addNewNode('condition')}
            className="flex items-center gap-1.5 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            title="Condition Router Node"
          >
            <Plus className="h-3 w-3" />
            <span>Condition</span>
          </button>

          <button 
            onClick={() => addNewNode('approval')}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            title="Human Approval Node"
          >
            <Plus className="h-3 w-3" />
            <span>Approval</span>
          </button>

          <button 
            onClick={() => addNewNode('api_request')}
            className="flex items-center gap-1.5 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            title="API Request HTTP Node"
          >
            <Plus className="h-3 w-3" />
            <span>HTTP API</span>
          </button>

          <button 
            onClick={() => addNewNode('google_sheets')}
            className="flex items-center gap-1.5 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            title="Google Sheets Node"
          >
            <Plus className="h-3 w-3" />
            <span>GSheets</span>
          </button>

          <button 
            onClick={() => addNewNode('prompt_template')}
            className="flex items-center gap-1.5 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            title="Prompt Template Node"
          >
            <Plus className="h-3 w-3" />
            <span>Prompt</span>
          </button>

          <button 
            onClick={() => addNewNode('llm')}
            className="flex items-center gap-1.5 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            title="LLM Node"
          >
            <Plus className="h-3 w-3" />
            <span>LLM AI</span>
          </button>

          <button 
            onClick={() => addNewNode('rag_search')}
            className="flex items-center gap-1.5 bg-fuchsia-50 text-fuchsia-600 hover:bg-fuchsia-600 hover:text-white px-3 py-2 rounded-xl text-[11px] font-bold transition-all"
            title="RAG Knowledge Search Node"
          >
            <Plus className="h-3 w-3" />
            <span>RAG Search</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 bg-slate-800 text-white hover:bg-slate-900 px-3.5 py-2 rounded-xl text-[11px] font-bold shadow-sm transition-all shrink-0"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Lưu</span>
          </button>

          <button 
            onClick={handleRun}
            className="flex items-center gap-1.5 bg-primary-accent text-white hover:bg-primary-hover px-3.5 py-2 rounded-xl text-[11px] font-bold shadow-[0_4px_12px_rgba(53,91,245,0.2)] transition-all shrink-0"
          >
            <Play className="h-3.5 w-3.5 stroke-[2.5px]" />
            <span>Chạy</span>
          </button>
        </div>
      </div>

      {/* React Flow Board Container */}
      <div className="flex-1 h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background color="#cbd5e1" gap={18} size={1} />
          <Controls className="!bg-white !border-slate-100 !rounded-xl !shadow-sm !overflow-hidden" />
        </ReactFlow>
      </div>
    </div>
  )
}
