# RAG Similarity Search & API Key Propagation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal**: Implement dynamic client API key propagation through HTTP headers, automatically generate document vector embeddings on chunk upload, and compute cosine similarity matching inside the RAGSearchNode.

---

## File Structure Map
- **Backend Files**:
  - `/apps/workflows/api/views.py` (Propagate headers into run.state_data and generate embeddings in DocumentChunk creation)
  - `/apps/workflows/nodes/implementations.py` (Update RAGSearchNode and LLMNode execution logic)
  - `/apps/workflows/tests/test_nodes.py` (Verify similarity calculations unit tests)
- **Frontend Files**:
  - `/frontend/src/api/client.ts` (Implement Axios request interceptor for keys)

---

## Implementation Tasks

### Task 1: Frontend Header Interceptor

**Files**:
- Modify: `/frontend/src/api/client.ts`

- [ ] **Step 1: Ingest keys dynamically in client.ts**
  Add a request interceptor inside `frontend/src/api/client.ts` (or equivalent client wrapper):
  - Read `localStorage.getItem('GEMINI_API_KEY')` -> add header `X-Gemini-API-Key`
  - Read `localStorage.getItem('OPENAI_API_KEY')` -> add header `X-OpenAI-API-Key`
  - Read `localStorage.getItem('TELEGRAM_BOT_TOKEN')` -> add header `X-Telegram-Bot-Token`
  
- [ ] **Step 2: Run build check**
  Run: `npm run build` inside `/frontend` to verify that there are no compilation errors.

---

### Task 2: Backend API Key Interception & Document Ingestion Embeddings

**Files**:
- Modify: `/apps/workflows/api/views.py`

- [ ] **Step 1: Intercept headers in Workflow run triggers**
  In `WorkflowViewSet.run_workflow` and `WorkflowViewSet.submit_form`:
  - Extract headers `X-Gemini-API-Key`, `X-OpenAI-API-Key`, and `X-Telegram-Bot-Token` from request.
  - Store them inside `state_data["__env__"]` dict before saving `WorkflowRun`.

- [ ] **Step 2: Generate Vector Embeddings on Document Chunk upload**
  In `DocumentChunkViewSet.perform_create`:
  - Fetch `X-Gemini-API-Key` from headers.
  - If present, call Google Generative Language API (`text-embedding-004`) using `requests.post`.
  - Extract the float array and save it to the `embedding` field of the created `DocumentChunk`.
  - If API key is missing or request fails, save `embedding = None` to fallback gracefully.

- [ ] **Step 3: Run pytest verification**
  Run: `docker exec -i edu_ecosystem_local_django /entrypoint pytest`
  Ensure standard tests pass cleanly.

---

### Task 3: RAG Cosine Similarity Execution & Node Key Retrieval

**Files**:
- Modify: `/apps/workflows/nodes/implementations.py`
- Modify: `/apps/workflows/tests/test_nodes.py`

- [ ] **Step 1: Read keys from state_data env**
  In `/apps/workflows/nodes/implementations.py`:
  - Modify `LLMNode` and `TelegramNotifierNode` to look up credentials inside `state_data.get("__env__", {})` first, fallback to `os.environ`.
  
- [ ] **Step 2: Implement Cosine Similarity in RAGSearchNode**
  In `RAGSearchNode.execute`:
  - Extract Gemini API key from `state_data.get("__env__", {}).get("GEMINI_API_KEY")` or `os.environ`.
  - If key is present, request query embedding vector from Gemini.
  - Perform pure Python cosine similarity calculations against database `DocumentChunk` vectors.
  - Select top 3 chunks (similarity score >= 0.35).
  - If key is missing/fails, run fallback keyword score query.

- [ ] **Step 3: Add node tests**
  In `apps/workflows/tests/test_nodes.py`, write unit tests covering:
  - Cosine similarity calculation logic.
  - RAGSearchNode fallback logic when API keys are absent.

- [ ] **Step 4: Run full Django verification**
  Run: `docker exec -i edu_ecosystem_local_django /entrypoint pytest`
  Confirm all tests pass and are green.
