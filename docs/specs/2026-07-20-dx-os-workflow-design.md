# Tài liệu Thiết kế Hệ thống Workflow DX-OS (Khối thi OLP-35 - VFOSSA)

*   **Ngày tạo:** 20-07-2026
*   **Trạng thái:** Bản thiết kế đã được phê duyệt (Approved Spec)
*   **Tác giả:** Antigravity AI & Đội ngũ Phát triển

---

## 1. Kiến trúc Hệ thống (System Architecture)
Hệ thống được phát triển tích hợp hoàn toàn trong dự án Django + React SPA hiện tại (`init-django-project-main`) theo mô hình Monolithic để đảm bảo việc triển khai và cài đặt đơn giản nhất cho ban giám khảo OLP-35.

```
+-----------------------------------------------------------------------------------+
|                              REACT SPA (Vite/React 19)                             |
|  - Giao diện kéo thả luồng kéo bằng thư viện @xyflow/react                         |
|  - Zustand quản lý state của đồ thị (Nodes & Edges)                                |
+----------------------------------------+------------------------------------------+
                                         | REST API (JWT Bearer Token)
                                         v
+-----------------------------------------------------------------------------------+
|                              DJANGO API (Backend app)                              |
|  - App: apps.workflows (Cung cấp các API lưu/tải luồng)                             |
|  - Quản lý phân quyền người dùng (RBAC)                                           |
+----------------------------------------+------------------------------------------+
                                         | ORM / Task Trigger
                                         v
+----------------------------------------+------------------------------------------+
|                             CELERY WORKER & REDIS                                  |
|  - Động cơ chạy luồng (DAG Executor) chạy bất đồng bộ                              |
|  - Celery Beat xử lý lập lịch định kỳ (Scheduler)                                 |
+----------------------------------------+------------------------------------------+
                                         | Lưu trữ dữ liệu
                                         v
+-----------------------------------------------------------------------------------+
|                               POSTGRESQL DATABASE                                 |
|  - Bảng: Workflow, WorkflowRun, NodeRunLog                                        |
+-----------------------------------------------------------------------------------+
```

---

## 2. Thiết kế Cơ sở Dữ liệu (Database Schema)
Các model được thiết kế kế thừa từ `BaseModel` của boilerplate để có sẵn UUID làm Primary Key và tự động lưu vết thời gian khởi tạo.

### 2.1. Model `Workflow`
Lưu trữ định nghĩa cấu trúc của đồ thị luồng công việc.
*   `id`: UUID (Primary Key)
*   `name`: CharField(max_length=255) - Tên luồng công việc
*   `description`: TextField(blank=True) - Mô tả luồng công việc
*   `is_active`: BooleanField(default=True) - Trạng thái hoạt động
*   `nodes`: JSONField(default=dict) - Danh sách các Nodes vẽ trên UI kèm cấu hình chi tiết của từng Node
*   `edges`: JSONField(default=list) - Danh sách các đường nối nối giữa các Node
*   `created_at`: DateTimeField(auto_now_add=True)
*   `updated_at`: DateTimeField(auto_now=True)

### 2.2. Model `WorkflowRun`
Lưu vết trạng thái thực thi của từng lượt chạy luồng.
*   `id`: UUID (Primary Key)
*   `workflow`: ForeignKey("Workflow", on_delete=models.CASCADE)
*   `status`: CharField(max_length=50) - Trạng thái: `pending`, `running`, `success`, `failed`, `pending_approval`
*   `state_data`: JSONField(default=dict) - Context tích lũy dữ liệu truyền qua các Node
*   `started_at`: DateTimeField(auto_now_add=True)
*   `finished_at`: DateTimeField(null=True, blank=True)

### 2.3. Model `NodeRunLog`
Lưu nhật ký chi tiết chạy của từng Node độc lập trong một lượt chạy luồng.
*   `id`: UUID (Primary Key)
*   `workflow_run`: ForeignKey("WorkflowRun", on_delete=models.CASCADE, related_name="logs")
*   `node_id`: CharField(max_length=100) - ID của node trên giao diện (ví dụ: `node_123`)
*   `node_type`: CharField(max_length=100) - Loại node (ví dụ: `telegram_notify`)
*   `status`: CharField(max_length=50) - Trạng thái chạy của nút (`running`, `success`, `failed`)
*   `input_data`: JSONField(default=dict) - Đầu vào thực tế của Node nhận từ context
*   `output_data`: JSONField(default=dict) - Đầu ra thực tế do Node trả ra
*   `error_message`: TextField(blank=True) - Thông báo lỗi nếu chạy thất bại
*   `started_at`: DateTimeField(auto_now_add=True)
*   `finished_at`: DateTimeField(null=True, blank=True)

---

## 3. Kiến trúc Component Nodes trên Backend (Pluggable Nodes)
Sử dụng mô hình hướng đối tượng để dễ bảo trì và mở rộng thêm các Node mới mà không ảnh hưởng tới lõi Executor.

### 3.1. Lớp base Node (`apps/workflows/nodes/base.py`)
```python
class BaseNode:
    node_type = "base"

    def __init__(self, node_id: str, config_data: dict):
        self.node_id = node_id
        self.config_data = config_data  # Cấu hình tĩnh lưu trong Workflow.nodes

    def execute(self, state_data: dict) -> dict:
        """
        Nhận vào bộ nhớ context của lượt chạy, thực thi nghiệp vụ,
        và trả ra dict chứa dữ liệu outputs.
        """
        raise NotImplementedError()
```

### 3.2. Hiện thực hóa các Node Nghiệp vụ
*   **FormInputNode**: Đầu vào của luồng. Định nghĩa danh sách fields. Khi người dùng submit Form tại trang `/forms/<uuid>`, Django API lưu dữ liệu submit vào `state_data` và kích hoạt Celery Task chạy luồng.
*   **TelegramNotifierNode**: Đọc cấu hình `bot_token`, `chat_id` và `message_template`. Nội suy chuỗi thông báo từ `state_data` (ví dụ: `"Duyệt chi: {form_input.amount}"`) và gửi API Telegram.
*   **ConditionRouterNode**: Đọc biểu thức điều kiện (ví dụ: `form_input.amount > 10000000`). Trả ra `{"next_branch": "true"}` hoặc `{"next_branch": "false"}` để hướng luồng.
*   **ApprovalNode**:
    *   Gửi tin nhắn kèm 2 Inline buttons **[Đồng ý]** và **[Từ chối]** đến Telegram của cấp duyệt.
    *   Lưu trạng thái lượt chạy thành `pending_approval`.
    *   Tạm dừng Celery Task (không chạy tiếp).
    *   Django mở một API Endpoint Webhook `/api/v1/workflows/callback/telegram/` để Telegram Bot gọi về khi người dùng bấm nút trên điện thoại. Khi có sự kiện duyệt, Django cập nhật kết quả duyệt vào `state_data` và gọi Celery để chạy tiếp luồng.
*   **GoogleSheetsNode**: Đọc Sheet ID, Sheet Name và dữ liệu mapping. Sử dụng thư viện Python `google-auth` và `gspread` để ghi dữ liệu cuối cùng vào Google Sheet.
*   **GeminiLLMNode**: Gọi API Gemini sử dụng thư viện `google-genai` của Google để dịch, tóm tắt hoặc phân tích nội dung dữ liệu đầu vào.

---

## 4. Bộ Thực thi Đồ thị Luồng (DAG Executor)
Bộ thực thi luồng được viết dưới dạng một Celery Task chạy nền:
```python
@shared_task
def run_workflow_task(workflow_run_id: str):
    # 1. Tải WorkflowRun và Workflow
    # 2. Xây dựng đồ thị từ nodes và edges
    # 3. Phân tích Topological Sort để tìm thứ tự thực thi
    # 4. Duyệt chạy qua từng Node trong danh sách sắp xếp topo:
    #    - Kiểm tra xem Node này có nằm trong nhánh bị từ chối do Condition Router hay không
    #    - Tạo instance Node: node_instance = get_node_instance(node_type, config_data)
    #    - Ghi log NodeRunLog ở trạng thái running
    #    - Gọi node_instance.execute(state_data)
    #    - Ghi nhận output vào state_data toàn cục và đổi trạng thái NodeRunLog thành success
    #    - Nếu gặp ApprovalNode, dừng thực thi và thoát task (chờ callback telegram)
    #    - Nếu gặp lỗi, ghi log failed, đánh dấu WorkflowRun thất bại và thoát task.
```

---

## 5. Thiết kế Giao diện Người dùng (React SPA Frontend)
Sử dụng Vite, React 19, Tailwind CSS v4 và Zustand:

### 5.1. Thư viện Kéo thả
*   Cài đặt thư viện `@xyflow/react` để hiển thị Canvas vẽ luồng trực quan.

### 5.2. Zustand Store quản lý đồ thị luồng (`frontend/src/stores/workflow.store.ts`)
*   Lưu danh sách `nodes` và `edges` hiện tại trên canvas.
*   Xử lý các sự kiện kéo thả: `onNodesChange`, `onEdgesChange`, `onConnect`.
*   Quản lý Node đang được chọn để hiển thị Properties Form chỉnh sửa cấu hình tĩnh ở Sidebar phải.

### 5.3. Các Màn hình Chức năng
*   `WorkflowsListPage`: Màn hình danh sách luồng công việc hiện tại.
*   `WorkflowEditorPage`: Màn hình vẽ luồng (Canvas ở giữa, Palette Node ở bên trái phân nhóm theo HPDI, và Properties Panel ở bên phải).
*   `WorkflowRunDetailPage`: Hiển thị sơ đồ luồng tĩnh để giám sát vết chạy thực tế (tô màu xanh/đỏ cho các nút chạy xong/lỗi).
*   `PublicFormPage`: Màn hình Form nhập liệu công khai dành cho nhân viên.

---

## 6. Đóng gói & Triển khai (Docker & Security)
*   **Đóng gói:** Tận dụng file `docker-compose.local.yml` sẵn có của boilerplate để tích hợp cả ứng dụng Django, Postgres, Redis và Celery Worker.
*   **Bảo mật:** API Keys của OpenAI, Gemini và Bot Token Telegram được định cấu hình thông qua biến môi trường trong file `.env` hoặc cấu hình động qua Database, không được viết cứng trong code.
