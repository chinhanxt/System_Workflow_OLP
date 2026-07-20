# Tài liệu Tổng hợp Yêu cầu Hệ thống DX-OS (Khối thi OLP-35 - VFOSSA)

Tài liệu này tổng hợp các yêu cầu nghiệp vụ và kỹ thuật đối với hệ thống **Hệ điều hành Doanh nghiệp số (DX-OS)**, bám sát phương pháp luận **HPDI** được VFOSSA đề ra cho kỳ thi **Olympic Tin học Sinh viên Việt Nam lần thứ 35 (OLP-35)**. Hệ thống sẽ được phát triển trên nền tảng dự án Django & React boilerplate (`init-django-project-main`), đồng thời kế thừa ý tưởng và giao diện kéo thả của dự án `hethong_workflow`.

---

## 1. Mục tiêu và Kiến trúc Tổng quan
Hệ thống **DX-OS** nhằm giúp các doanh nghiệp SME xây dựng kỷ luật vận hành số và tự động hóa công việc qua 4 tầng tiến hóa quyền lực điều khiển: **Human (H) -> Process (P) -> Data (D) -> Intelligence (I)**.

Mô hình triển khai:
* **Backend**: Django REST Framework (DRF) xử lý API, lưu trữ cấu trúc workflow (luồng công việc), quản lý các Nodes (nút), quản lý người dùng, phân quyền RBAC và thực thi các tác vụ chạy nền qua Celery.
* **Frontend**: React SPA (kéo thả luồng tương tự `hethong_workflow`) tích hợp trực tiếp vào giao diện người dùng của dự án Django.
* **Kênh tương tác**: Telegram Bot (duyệt, thông báo), Form tự sinh.

---

## 2. Yêu cầu Chi tiết theo Phương pháp luận HPDI

### Tầng H – Human (Không gian Tương tác & Cộng tác)
*Tập trung vào thu thập thông tin chuẩn hóa và tương tác trực tiếp với con người.*
*   **Bộ tạo Biểu mẫu Động (Form Builder Node):**
    *   *Yêu cầu:* Cho phép cấu hình các trường nhập dữ liệu (Input, TextArea, Number, File Upload) trực tiếp trên Node đầu vào của luồng.
    *   *Đầu ra:* Khi luồng được kích hoạt, hệ thống sinh ra một đường dẫn công khai (Public Form URL) để nhân viên điền thông tin chuẩn hóa.
*   **Node Thông báo Telegram (Telegram Notifier Node):**
    *   *Yêu cầu:* Tích hợp Telegram Bot để gửi thông báo tức thời về trạng thái công việc, kết quả xử lý của luồng cho cá nhân hoặc nhóm liên quan.

### Tầng P – Process (Chuẩn hóa & Tự động hóa quy trình)
*Tự động hóa luồng nghiệp vụ và rẽ nhánh thông minh.*
*   **Node Rẽ nhánh Điều kiện (Condition Router Node):**
    *   *Yêu cầu:* Cho phép cấu hình rẽ nhánh logic dựa trên dữ liệu đầu vào (ví dụ: `Số tiền > 10.000.000 VNĐ` hoặc `Phòng ban == "Kinh doanh"`).
*   **Node Phê duyệt Nghiệp vụ (Approval Node):**
    *   *Yêu cầu:* Luồng chạy đến Node này sẽ tạm dừng (Status: Pending) và gửi tin nhắn phê duyệt kèm nút bấm (Approve/Reject) đến Telegram của cấp quản lý.
    *   *Đầu ra:* Khi quản lý bấm nút trên Telegram, hệ thống nhận webhook, cập nhật trạng thái luồng và tiếp tục thực thi các bước tiếp theo.
*   **Bộ Lập lịch Quy trình (Scheduler Node):**
    *   *Yêu cầu:* Cho phép luồng tự động chạy định kỳ theo lịch cấu hình sẵn (Cron Job) qua Celery Beat (ví dụ: hàng ngày lúc 17:00).

### Tầng D – Data (Đọc/Ghi & Đồng bộ dữ liệu)
*Kết nối dữ liệu đa kênh, phá vỡ ốc đảo dữ liệu.*
*   **Node Đọc/Ghi Google Sheets API:**
    *   *Yêu cầu:* Kết nối với bảng tính Google Sheets để lấy dữ liệu đầu vào hoặc tự động append kết quả xử lý của luồng vào sheet làm báo cáo.
*   **Node Gửi Request HTTP (API Request Node):**
    *   *Yêu cầu:* Cho phép cấu hình gửi request HTTP (GET, POST, PUT, DELETE) kèm Header (Auth/Token) để tích hợp với các hệ thống ERP, CRM ngoại vi.

### Tầng I – Intelligence (Trí tuệ nhân tạo hỗ trợ tự hành)
*Tích hợp AI để phân tích và hỗ trợ quyết định.*
*   **Node Cấu trúc Prompt (Prompt Template Node):**
    *   *Yêu cầu:* Cho phép định nghĩa mẫu Prompt có chứa biến động (ví dụ: `Hãy tóm tắt nội dung sau: {noi_dung}`).
*   **Node Trợ lý AI (LLM Integration Node):**
    *   *Yêu cầu:* Tích hợp gọi API mô hình ngôn ngữ lớn (Gemini, OpenAI) để xử lý ngôn ngữ tự nhiên, phân loại đề xuất hoặc gợi ý quyết định.
*   **Node Tìm kiếm Tri thức Nội bộ (RAG Search Node):**
    *   *Yêu cầu:* Tìm kiếm thông tin tương đồng trong cơ sở tri thức (tài liệu PDF quy chế nội bộ đã được vector hóa) trước khi chuyển tiếp thông tin làm ngữ cảnh cho LLM.

---

## 3. Yêu cầu Phi chức năng & Tiêu chuẩn VFOSSA
*   **Đóng gói Docker:** Khởi chạy toàn bộ hệ thống (Django, Postgres, Redis, Celery, React frontend) chỉ qua lệnh `docker compose up --build`.
*   **Giấy phép:** MIT License.
*   **Bảo mật:** Toàn bộ API keys (Gemini, OpenAI, Telegram Token) được quản lý qua biến môi trường hoặc cấu hình động bảo mật, không được hardcode.
*   **Tài liệu:** File `README.md` rõ ràng kèm sơ đồ kiến trúc và video hướng dẫn sử dụng.

---

## 4. Lộ trình Triển khai Dự kiến
1.  **Bước 1: Thiết kế Cơ sở Dữ liệu & API cho Workflow Engine (Django)**
    *   Xây dựng các Models: `Workflow` (Luồng), `Node` (Nút nghiệp vụ), `Edge` (Đường nối), `WorkflowRun` (Lượt thực thi luồng).
2.  **Bước 2: Xây dựng Giao diện Kéo thả Workflow (React SPA)**
    *   Tích hợp thư viện React Flow (hoặc tương tự) để hiển thị giao diện kéo thả trực quan.
    *   Kết nối kéo thả với API của Django để lưu/tải luồng.
3.  **Bước 3: Phát triển Bộ Thực thi Luồng (Execution Engine) với Celery**
    *   Tạo Executor chạy tuần tự hoặc rẽ nhánh các Node trong luồng công việc.
    *   Xây dựng cơ chế tạm dừng luồng để chờ phản hồi từ con người (tại nút Approval).
4.  **Bước 4: Hiện thực hóa các Nodes (Tầng H, P, D, I)**
    *   Từng bước code logic chạy cho từng loại Node (Telegram, Sheets, LLM, Approval).
5.  **Bước 5: Hoàn thiện Docker, Tài liệu & Đóng gói Nguồn mở**
