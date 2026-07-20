# Workflow Frontend UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the premium dashboard interface for managing and editing automated workflows (DX-OS) inside the React SPA frontend, matching the style tokens, layout, KPI panels, customized sparkline tables, and custom React Flow node cards of the approved design mockup.

**Architecture:** Custom Tailwind CSS v4 styling with state management driven by Zustand stores, calling REST endpoints via Axios client instances, and integrating dragging canvas operations through the `@xyflow/react` library.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Zustand, Axios, React Router v7, `@xyflow/react`, Lucide React.

---

## File Structure Map
- **Style configurations**: `/frontend/src/index.css`
- **General Layout Shell**:
  - `/frontend/src/components/layout/Sidebar.tsx`
  - `/frontend/src/components/layout/Header.tsx`
- **State Store**: `/frontend/src/stores/workflow.store.ts`
- **Pages**:
  - Workflows list page: `/frontend/src/pages/workflows/WorkflowsListPage.tsx`
  - Canvas workflow editor page: `/frontend/src/pages/workflows/WorkflowEditorPage.tsx`
  - Route configurations: `/frontend/src/routes.tsx`

---

## Implementation Tasks

### Task 1: Install Dependencies & Setup App-wide Styling

**Files:**
- Create: `/frontend/src/index.css` (Modify/Overwrite)
- Modify: `/frontend/package.json` (Add packages)

- [ ] **Step 1: Install React Flow dependency**
  Run: `npm install @xyflow/react` inside the `/frontend` workspace.
  Expected: Package is successfully installed and added to `package.json`.

- [ ] **Step 2: Add custom CSS tokens and font imports in index.css**
  Overwrite `/frontend/src/index.css` with the custom variables and global styles:
  ```css
  @import "tailwindcss";
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  @theme {
    --font-sans: "Outfit", "Inter", system-ui, sans-serif;
    
    /* Core palette */
    --color-app-bg: #f0f3f8;
    --color-primary-accent: #355bf5;
    --color-primary-hover: #1d4ed8;
    --color-border-subtle: #e2e8f0;
  }

  body {
    background-color: var(--color-app-bg);
    font-family: var(--font-sans);
    color: #1e293b;
    margin: 0;
  }
  ```

- [ ] **Step 3: Run npm run build test**
  Run: `npm run build` inside `/frontend` to verify stylesheet and assets compile successfully.
  Expected: Build succeeds with no syntax or TS compilation errors.

- [ ] **Step 4: Commit**
  Run: `git add package.json index.css` (or equivalent).

---

### Task 2: Redesign Sidebar & Header Shell

**Files:**
- Modify: `/frontend/src/components/layout/Sidebar.tsx`
- Modify: `/frontend/src/components/layout/Header.tsx`

- [ ] **Step 1: Redesign Sidebar**
  Modify `/frontend/src/components/layout/Sidebar.tsx` to implement:
  - Header: Logo badge square with `.d` letter, text `Dashboard Admin` in royal-blue accent.
  - Dropdown button: "Select Project" in a deep royal blue background (`bg-[#355bf5] text-white rounded-xl shadow-[0_5px_15px_rgba(53,91,245,0.2)]`), showing chevron icon.
  - Dimmed uppercase category separators (`"Menu"`, `"Configuration"`).
  - Navigation links: Inactive gray text, active royal blue (`text-[#355bf5]`), and add a notification badge `17` next to the `Tin nhắn` / `Messages` item.
  - Bottom CTA button: Gradient `"Create Project"` (`bg-gradient-to-r from-[#00c6ff] to-[#0072ff]`) with plus icon.

- [ ] **Step 2: Redesign Header**
  Modify `/frontend/src/components/layout/Header.tsx` to implement:
  - Search bar in pill-shape layout with light-grey background (`bg-[#f4f6fa]`).
  - Row of utility icons: document, calendar, database, mail with badge, and bell notification indicator.
  - Rounded avatar placeholder.

- [ ] **Step 3: Verify Layout rendering**
  Run development server: `npm run dev` and navigate to local address to visually inspect sidebar and header layout.
  Expected: Layout renders correctly, navigation works without crashing.

- [ ] **Step 4: Commit**
  Run: `git add src/components/layout/Sidebar.tsx src/components/layout/Header.tsx`.

---

### Task 3: Implement Zustand Store for Workflows CRUD

**Files:**
- Create: `/frontend/src/stores/workflow.store.ts`

- [ ] **Step 1: Write store state and actions**
  Create `/frontend/src/stores/workflow.store.ts` implementing store actions:
  - `workflows`: array, `activeWorkflow`: object, `runs`: array.
  - Actions calling backend REST APIs using Axios:
    - `fetchWorkflows()`, `createWorkflow(data)`, `updateWorkflow(id, data)`, `deleteWorkflow(id)`.
    - `triggerWorkflowRun(workflowId, inputData)`.
    - `fetchWorkflowRuns()`.
    - `approveWorkflowRun(runId)`.
    - `rejectWorkflowRun(runId)`.

- [ ] **Step 2: Verify type checks**
  Run: `tsc --noEmit` inside `/frontend`.
  Expected: Compilation passes with no TypeScript errors in the store definition.

- [ ] **Step 3: Commit**
  Run: `git add src/stores/workflow.store.ts`.

---

### Task 4: Develop Workflows List Page

**Files:**
- Create: `/frontend/src/pages/workflows/WorkflowsListPage.tsx`
- Modify: `/frontend/src/routes.tsx` (Add route `/workflows`)
- Modify: `/frontend/src/components/layout/Sidebar.tsx` (Add navbar item Link)

- [ ] **Step 1: Build KPI metrics display**
  At the top of `/frontend/src/pages/workflows/WorkflowsListPage.tsx`, render 3 cards (Information A, B, C) displaying total workflows, total workflow runs, and success rate using document icon widgets.

- [ ] **Step 2: Build Workflows List Table**
  - Table wrapper should be a white card with `rounded-3xl` and `shadow-[0_10px_30px_rgba(0,0,0,0.025)]`.
  - Include Checkbox, No. index, Name with colored icons, Status badge (Active/Inactive), and Success Trend graph.
  - Success Trend graph should be drawn dynamically inside table row cell using inline SVG path (resembling sparkline chart in the image).
  - Add Pagination matching mockup: `[← Previous] 1 2 3 ... 8 9 10 [Next →]`.

- [ ] **Step 3: Register route and verify**
  - Register path `/workflows` inside `/frontend/src/routes.tsx`.
  - Add a link to `/workflows` labeled `"Workflows"` with a flow/nodes icon in `Sidebar.tsx`.
  - Check in browser that the list renders correctly and successfully fetches workflow entities.

- [ ] **Step 4: Commit**
  Run: `git add src/pages/workflows/WorkflowsListPage.tsx src/routes.tsx src/components/layout/Sidebar.tsx`.

---

### Task 5: Develop React Flow Canvas Editor

**Files:**
- Create: `/frontend/src/pages/workflows/WorkflowEditorPage.tsx`
- Modify: `/frontend/src/routes.tsx` (Add route `/workflows/:id/edit`)

- [ ] **Step 1: Embed React Flow canvas**
  Inside `/frontend/src/pages/workflows/WorkflowEditorPage.tsx`, mount React Flow canvas. Add standard dot-pattern grid background inside a `#f0f3f8` container.

- [ ] **Step 2: Define Custom Nodes**
  Create custom node render functions or components inside editor:
  - `TelegramNode`: White card, `rounded-2xl`, shadow, header styled with telegram-blue and message config form inputs.
  - `ConditionNode`: White card, orange header, logic paths fields.
  - `ApprovalNode`: White card, green header, approval action configurations.
  - Handles (`Source` and `Target`) should be visible and connectable.

- [ ] **Step 3: Implement Floating Control Bar**
  Implement a floating control panel on top: backdrop blur overlay (`backdrop-blur bg-white/80 rounded-xl`), containing Save, Run, Add Node, and Go Back buttons.

- [ ] **Step 4: Register route and test**
  - Register path `/workflows/:id/edit` in `/frontend/src/routes.tsx`.
  - Test dragging nodes, establishing connections, and saving the graph back to backend API.

- [ ] **Step 5: Run full app build verify**
  Run: `npm run build` inside `/frontend` to verify all components, routes, and stores compile cleanly.
  Expected: Build finishes with 100% green compliance.

- [ ] **Step 6: Commit**
  Run: `git add src/pages/workflows/WorkflowEditorPage.tsx src/routes.tsx`.
