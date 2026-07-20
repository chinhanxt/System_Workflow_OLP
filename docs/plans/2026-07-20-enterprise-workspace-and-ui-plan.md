# Enterprise Workspace & UI Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: Implement local workspace classification filters, documents upload portal for real RAG ingestion, system logs visual list, developer key settings, and fix routing for all dead-end frontend links.

---

## File Structure Map
- **Backend Files**:
  - `/apps/workflows/models.py` (Add project_name field)
  - `/apps/workflows/api/serializers.py` (Define DocumentChunkSerializer)
  - `/apps/workflows/api/views.py` (Expose DocumentChunkViewSet and update Workflow filters)
  - `/config/api_router.py` (Register DocumentChunk endpoint)
- **Frontend Files**:
  - `/frontend/src/routes.tsx` (Register new mock navigation routes)
  - `/frontend/src/pages/DocumentsPage.tsx` (Create docs portal)
  - `/frontend/src/pages/MessagesPage.tsx` (Create runs monitor log page)
  - `/frontend/src/pages/StackPage.tsx` (Create Dev Stack config page)
  - `/frontend/src/pages/SettingsPage.tsx` (Create app settings page)
  - `/frontend/src/components/layout/Sidebar.tsx` (Add modals for project settings)

---

## Implementation Tasks

### Task 1: Backend Model Updates, Document API & ViewSet Filters

**Files**:
- Modify: `/apps/workflows/models.py` (Add `project_name`)
- Modify: `/apps/workflows/api/serializers.py` (Add DocumentChunkSerializer)
- Modify: `/apps/workflows/api/views.py` (Add DocumentChunkViewSet, add workflow project_name filtering)
- Modify: `/config/api_router.py` (Register DocumentChunk router)

- [ ] **Step 1: Add project_name field to Workflow model**
  Modify `apps/workflows/models.py` to append:
  `project_name = models.CharField(_("project name"), max_length=100, blank=True, null=True, default="Default Project")`

- [ ] **Step 2: Generate and apply Django migration**
  Run: `docker exec -i edu_ecosystem_local_django /entrypoint python manage.py makemigrations workflows`
  Run: `docker exec -i edu_ecosystem_local_django /entrypoint python manage.py migrate`

- [ ] **Step 3: Define DocumentChunkSerializer**
  In `apps/workflows/api/serializers.py`, implement `DocumentChunkSerializer` including `id`, `document_name`, `text_content`, `created_at`, `updated_at`.

- [ ] **Step 4: Expose DocumentChunkViewSet**
  In `apps/workflows/api/views.py`, implement `DocumentChunkViewSet` with standard `ModelViewSet` capabilities allowing listings and text uploads. Update `WorkflowViewSet.get_queryset` to filter by `project_name` parameter if present.

- [ ] **Step 5: Register API Router**
  In `config/api_router.py`, register `document-chunks` pointing to `DocumentChunkViewSet`.

- [ ] **Step 6: Run tests verification**
  Run: `docker exec -i edu_ecosystem_local_django /entrypoint pytest`
  Verify tests pass cleanly.

---

### Task 2: Create Mock Navigation Pages

**Files**:
- Create: `/frontend/src/pages/DocumentsPage.tsx`
- Create: `/frontend/src/pages/MessagesPage.tsx`
- Create: `/frontend/src/pages/StackPage.tsx`
- Create: `/frontend/src/pages/SettingsPage.tsx`
- Modify: `/frontend/src/routes.tsx`

- [ ] **Step 1: Create DocumentsPage**
  Build `/frontend/src/pages/DocumentsPage.tsx` showing:
  - Drag and drop file upload card.
  - REST client fetch listing loaded document chunks from `/api/v1/document-chunks/`.
  - Upload file handler sending text files via `POST` multipart.

- [ ] **Step 2: Create MessagesPage**
  Build `/frontend/src/pages/MessagesPage.tsx` showing workflow run logs table loaded from `/api/v1/workflow-runs/`.

- [ ] **Step 3: Create StackPage**
  Build `/frontend/src/pages/StackPage.tsx` containing input fields to enter `GEMINI_API_KEY`, `OPENAI_API_KEY`, and save settings in local storage.

- [ ] **Step 4: Create SettingsPage**
  Build `/frontend/src/pages/SettingsPage.tsx` showing SMTP configuration card and bot profiles.

- [ ] **Step 5: Bind new routes**
  Modify `/frontend/src/routes.tsx` to register paths: `/documents`, `/messages`, `/stack`, and `/settings` under the protected AppLayout layout wrapper.

---

### Task 3: Interactive Project Selection Modals in Sidebar

**Files**:
- Modify: `/frontend/src/components/layout/Sidebar.tsx`
- Modify: `/frontend/src/pages/workflows/WorkflowsListPage.tsx`

- [ ] **Step 1: Wire Project selector modals in Sidebar**
  In `Sidebar.tsx`:
  - Manage state for selected active project and projects list (stored in localStorage).
  - Modify "Select Project" and "Create Project" buttons to display a clean tailwind dialog modal.
  - When active project is selected, dispatch updates or toast event notification.

- [ ] **Step 2: Filter Workflows list dynamically**
  In `WorkflowsListPage.tsx`, read selected project name from localStorage or state, and append `?project_name=...` to query string when fetching workflow lists.

- [ ] **Step 3: Run final app compilation check**
  Run: `npm run build` inside `/frontend` to verify all components compile successfully.
