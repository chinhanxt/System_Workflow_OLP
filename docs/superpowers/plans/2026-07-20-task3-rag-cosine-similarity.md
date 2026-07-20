# Task 3: RAG Cosine Similarity Execution & Node Key Retrieval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retrieve bot tokens and API keys from `state_data["__env__"]`, perform dynamic Google Generative Language API embeddings calls or use mock vectors, calculate cosine similarity matching in Python, and write comprehensive unit tests.

**Architecture:**
- Retrieve credentials in `LLMNode` and `TelegramNotifierNode` from the workflow state's environment block.
- Update `RAGSearchNode` to optionally invoke the Gemini embedding API, calculate cosine similarity in pure Python, sort/filter results with similarity >= 0.35, and fall back to keyword search on error or absence of keys.
- Write robust Django-DB mock-based unit tests for all implemented features.

**Tech Stack:** Django, pytest, Python math and requests modules.

---

## File Structure Map
- **Backend Files**:
  - `/apps/workflows/nodes/implementations.py` (Update RAGSearchNode, LLMNode, and TelegramNotifierNode execute methods)
  - `/apps/workflows/tests/test_nodes.py` (Add new tests for vector similarity, fallback, and environment key propagation)

---

## Implementation Tasks

### Task 1: Update Node Implementation Logic

**Files**:
- Modify: `/apps/workflows/nodes/implementations.py`

- [ ] **Step 1: Retrieve bot_token in TelegramNotifierNode**
  Read `env_data` from state_data and lookup `TELEGRAM_BOT_TOKEN`.
  ```python
  env_data = state_data.get("__env__", {})
  bot_token = self.config_data.get("bot_token") or env_data.get("TELEGRAM_BOT_TOKEN") or os.environ.get("TELEGRAM_BOT_TOKEN")
  ```

- [ ] **Step 2: Retrieve API keys in LLMNode**
  Read `env_data` and lookup `GEMINI_API_KEY` / `OPENAI_API_KEY`.
  ```python
  env_data = state_data.get("__env__", {})
  # for gemini:
  api_key = env_data.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")
  # for openai:
  api_key = env_data.get("OPENAI_API_KEY") or os.environ.get("OPENAI_API_KEY")
  ```

- [ ] **Step 3: Implement dynamic embeddings and cosine similarity in RAGSearchNode**
  Update execute to query `text-embedding-004` (using `genai` or direct API POST), compute cosine similarity in pure Python with `math`, filter by `similarity >= 0.35`, and fall back to keyword search if key is missing or request fails.

---

### Task 2: Write Unit Tests

**Files**:
- Modify: `/apps/workflows/tests/test_nodes.py`

- [ ] **Step 1: Add test_rag_search_node_vector_similarity**
  Seeds mock document chunks with predefined embedding vectors. Executes the `RAGSearchNode` with `state_data={"__env__": {"GEMINI_API_KEY": "test"}}` and asserts that it correctly uses vector similarity to score and rank documents instead of simple keyword matching.

- [ ] **Step 2: Add test_rag_search_node_vector_similarity_failed_fallback**
  Asserts that when the API fails (e.g. key is present but network fails), it falls back to the keyword matching search query cleanly.

- [ ] **Step 3: Add test_llm_node_uses_env_key and test_telegram_node_uses_env_key**
  Verify they read from state `"__env__"`.

---

### Task 3: Verify All Tests Pass

- [ ] **Step 1: Run Django local container test suite**
  Run: `docker exec -i edu_ecosystem_local_django /entrypoint pytest`
  Ensure all tests are green and pass.

- [ ] **Step 2: Commit all changes**
  Commit the modified files to Git.
