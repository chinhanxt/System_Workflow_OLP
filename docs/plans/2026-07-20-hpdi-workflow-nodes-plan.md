# HPDI Advanced Workflow Nodes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full suite of advanced nodes representing Tầng H (Form Builder), Tầng D (HTTP API, Google Sheets), and Tầng I (Prompt Template, LLM, RAG search) in both backend (Django + Celery) and frontend (React Flow Canvas + Public Forms).

**Architecture:** Extended python node subclasses registering on the core registry engine, exposed via DRF custom actions with public view permissions. Custom React Flow canvas node editors with dynamic option inputs and public rendering templates.

**Tech Stack:** Django 5.1, DRF, Celery, requests, google-generativeai, React 19, Vite, Tailwind v4, React Flow.

---

## File Structure Map
- **Backend Model & Endpoints**:
  - `/apps/workflows/models.py` (Register `DocumentChunk`)
  - `/apps/workflows/api/views.py` (Add public form endpoints)
  - `/apps/workflows/nodes/implementations.py` (Add advanced node execution algorithms)
- **Frontend SPA Components**:
  - `/frontend/src/pages/PublicFormPage.tsx` (Public form renderer)
  - `/frontend/src/pages/workflows/WorkflowEditorPage.tsx` (Add config editors to custom nodes)
  - `/frontend/src/routes.tsx` (Register public form route)

---

## Implementation Tasks

### Task 1: DocumentChunk Model & DRF Public Actions

**Files:**
- Modify: `/apps/workflows/models.py` (Add DocumentChunk model)
- Modify: `/apps/workflows/api/views.py` (Add `form` and `submit-form` actions to WorkflowViewSet)
- Modify: `/apps/workflows/tests/test_api.py` (Add API tests for public actions)

- [ ] **Step 1: Define DocumentChunk model**
  Modify `apps/workflows/models.py` to add:
  ```python
  class DocumentChunk(BaseModel):
      document_name = models.CharField(max_length=255)
      text_content = models.TextField()
      embedding = models.JSONField(null=True, blank=True)

      def __str__(self):
          return f"{self.document_name} - {self.id}"
  ```

- [ ] **Step 2: Run django migrations**
  Run: `uv run python manage.py makemigrations workflows && uv run python manage.py migrate`
  Expected: Database table `workflows_documentchunk` is created.

- [ ] **Step 3: Implement custom actions on WorkflowViewSet**
  Modify `apps/workflows/api/views.py` to add actions:
  - `form` (GET, public permission `AllowAny`): Finds first `form_builder` node config in workflow.nodes and returns fields list.
  - `submit-form` (POST, public permission `AllowAny`): Creates `WorkflowRun`, populates `state_data` with submission dictionary, and runs Celery task.

- [ ] **Step 4: Write API unit tests**
  In `apps/workflows/tests/test_api.py`, write tests verifying unauthenticated users can call `form` and `submit-form` successfully.

- [ ] **Step 5: Run tests**
  Run: `DJANGO_SETTINGS_MODULE=config.settings.test uv run pytest apps/workflows/tests/test_api.py`
  Expected: PASS

- [ ] **Step 6: Commit**
  Run: `git add apps/workflows/models.py apps/workflows/api/views.py apps/workflows/tests/test_api.py`

---

### Task 2: Implement Tầng H (Form) & Tầng D (API, Sheets) Nodes

**Files:**
- Modify: `/apps/workflows/nodes/implementations.py` (Add FormBuilderNode, APIRequestNode, GoogleSheetsNode)

- [ ] **Step 1: Write FormBuilderNode**
  In `apps/workflows/nodes/implementations.py`, define `FormBuilderNode` inheriting from `BaseNode`. It returns inputs as is.

- [ ] **Step 2: Write APIRequestNode**
  Implement `APIRequestNode` using Python `requests`:
  - Resolves variables dynamically (e.g., `{form_1.amount}`) by traversing `state_data`.
  - Performs actual `requests.request` call.
  - Saves response dictionary.

- [ ] **Step 3: Write GoogleSheetsNode**
  Implement `GoogleSheetsNode`:
  - Attempts writing to Google Sheets using `google-api-python-client`.
  - Falls back to logs + success placeholder `{"success": true, "mocked": true}` if credentials are not configured.

- [ ] **Step 4: Write node execution unit tests**
  In `apps/workflows/tests/test_nodes.py`, write tests executing these three nodes and validating output returns.

- [ ] **Step 5: Run tests**
  Run: `DJANGO_SETTINGS_MODULE=config.settings.test uv run pytest apps/workflows/tests/test_nodes.py`
  Expected: PASS

- [ ] **Step 6: Commit**
  Run: `git add apps/workflows/nodes/implementations.py apps/workflows/tests/test_nodes.py`

---

### Task 3: Implement Tầng I (Prompt, LLM, RAG) Nodes

**Files:**
- Modify: `/apps/workflows/nodes/implementations.py` (Add PromptTemplateNode, LLMNode, RAGSearchNode)

- [ ] **Step 1: Write PromptTemplateNode**
  Define `PromptTemplateNode`:
  - Resolves placeholders inside templates using `state_data`.
  - Returns `{"prompt": "Final text..."}`.

- [ ] **Step 2: Write LLMNode**
  Define `LLMNode` supporting Gemini and OpenAI API:
  - Reads keys from settings.
  - Generates text.
  - Falls back to simulated text analysis if keys are missing.

- [ ] **Step 3: Write RAGSearchNode**
  Define `RAGSearchNode`:
  - Performs cosine similarity lookup if embedding key is set.
  - Falls back to substring/SQL search against `DocumentChunk` records.
  - Merges top 3 matches as context output.

- [ ] **Step 4: Write node execution unit tests**
  In `apps/workflows/tests/test_nodes.py`, write test executions for these 3 nodes.

- [ ] **Step 5: Run tests**
  Run: `DJANGO_SETTINGS_MODULE=config.settings.test uv run pytest apps/workflows/tests/test_nodes.py`
  Expected: PASS

- [ ] **Step 6: Commit**
  Run: `git add apps/workflows/nodes/implementations.py apps/workflows/tests/test_nodes.py`

---

### Task 4: Develop Frontend Public Form Page

**Files:**
- Create: `/frontend/src/pages/PublicFormPage.tsx`
- Modify: `/frontend/src/routes.tsx` (Register public form route)

- [ ] **Step 1: Implement PublicFormPage**
  Create `/frontend/src/pages/PublicFormPage.tsx` to:
  - Load form fields dynamically from GET `/api/v1/workflows/<id>/form/`.
  - Render an input form using Outfit font styles.
  - POST submission values to `/api/v1/workflows/<id>/submit-form/`.
  - Show success confirmation screen.

- [ ] **Step 2: Register public route**
  In `/frontend/src/routes.tsx`, define path `/public/form/:id` rendering `<PublicFormPage />` without protection guards.

- [ ] **Step 3: Verify form build**
  Run: `npm run build` inside `/frontend` to verify there are no compilation errors.
  Expected: Build succeeds.

- [ ] **Step 4: Commit**
  Run: `git add src/pages/PublicFormPage.tsx src/routes.tsx`

---

### Task 5: Develop React Flow Custom Nodes Configuration Panel

**Files:**
- Modify: `/frontend/src/pages/workflows/WorkflowEditorPage.tsx` (Add configurations UI inputs)

- [ ] **Step 1: Define configuration panels**
  Modify custom nodes inside `/frontend/src/pages/workflows/WorkflowEditorPage.tsx` to include edit forms inside node body containers:
  - Form Builder: Edit fields dynamically.
  - API Request: Input URL, select Method, Headers text, Body template.
  - Google Sheets: Input Spreadsheet ID, Sheet Name, Row values.
  - Prompt Template: Large template text area.
  - LLM: Dropdown select for Gemini/OpenAI models.
  - RAG: Input search query string.

- [ ] **Step 2: Add quick-create buttons**
  In the floating toolbar actions row, add buttons to easily add these new node models onto the React Flow canvas grid.

- [ ] **Step 3: Run final app compilation check**
  Run: `npm run build` inside `/frontend` to confirm all code compiles cleanly.
  Expected: SUCCESS

- [ ] **Step 4: Commit**
  Run: `git add src/pages/workflows/WorkflowEditorPage.tsx`
