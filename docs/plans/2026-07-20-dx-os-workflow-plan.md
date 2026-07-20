# DX-OS Workflow System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pluggable, DAG-based workflow execution engine integrated into the Django backend and a React Flow frontend workspace for designing automated enterprise workflows (DX-OS).

**Architecture:** Monolithic integration. The backend uses Django REST Framework (DRF) for APIs, PostgreSQL for storing graph schemas, and Celery for topological-sort DAG executions. The frontend uses `@xyflow/react` in the React SPA.

**Tech Stack:** Django, DRF, Celery, PostgreSQL, Redis, React 19, Vite, Tailwind CSS v4, `@xyflow/react`, Zustand.

---

## File Structure Map
- **Backend App**: `apps/workflows/`
  - Models: `apps/workflows/models.py`
  - Serializers/Views: `apps/workflows/api/serializers.py`, `apps/workflows/api/views.py`
  - Nodes logic: `apps/workflows/nodes/base.py`, `apps/workflows/nodes/registry.py`, `apps/workflows/nodes/implementations.py`
  - Engine: `apps/workflows/engine/executor.py`, `apps/workflows/tasks.py`
- **Frontend Pages**:
  - Store: `frontend/src/stores/workflow.store.ts`
  - Canvas: `frontend/src/pages/workflows/WorkflowEditorPage.tsx`
  - List: `frontend/src/pages/workflows/WorkflowsListPage.tsx`

---

## Implementation Tasks

### Task 1: Django Workflow App & Database Models

**Files:**
- Create: `apps/workflows/__init__.py`
- Create: `apps/workflows/apps.py`
- Create: `apps/workflows/models.py`
- Modify: `config/settings/base.py:72-76` (Register app)
- Test: `apps/workflows/tests/test_models.py`

- [ ] **Step 1: Create apps.py and register the app**
  Create `apps/workflows/apps.py`:
  ```python
  from django.apps import AppConfig

  class WorkflowsConfig(AppConfig):
      default_auto_field = "django.db.models.BigAutoField"
      name = "apps.workflows"
  ```
  And modify `config/settings/base.py` to add `"apps.workflows"` to `LOCAL_APPS`.

- [ ] **Step 2: Define Models in models.py**
  Create `apps/workflows/models.py`:
  ```python
  import uuid
  from django.db import models
  from apps.core.models import BaseModel

  class Workflow(BaseModel):
      name = models.CharField(max_length=255)
      description = models.TextField(blank=True)
      is_active = models.BooleanField(default=True)
      nodes = models.JSONField(default=dict)
      edges = models.JSONField(default=list)

      def __str__(self):
          return self.name

  class WorkflowRun(models.Model):
      id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
      workflow = models.ForeignKey(Workflow, on_delete=models.CASCADE, related_name="runs")
      status = models.CharField(max_length=50, default="pending")  # pending, running, success, failed, pending_approval
      state_data = models.JSONField(default=dict)
      started_at = models.DateTimeField(auto_now_add=True)
      finished_at = models.DateTimeField(null=True, blank=True)

  class NodeRunLog(models.Model):
      id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
      workflow_run = models.ForeignKey(WorkflowRun, on_delete=models.CASCADE, related_name="logs")
      node_id = models.CharField(max_length=100)
      node_type = models.CharField(max_length=100)
      status = models.CharField(max_length=50)  # running, success, failed
      input_data = models.JSONField(default=dict)
      output_data = models.JSONField(default=dict)
      error_message = models.TextField(blank=True)
      started_at = models.DateTimeField(auto_now_add=True)
      finished_at = models.DateTimeField(null=True, blank=True)
  ```

- [ ] **Step 3: Write tests for the models**
  Create `apps/workflows/tests/test_models.py`:
  ```python
  import pytest
  from apps.workflows.models import Workflow, WorkflowRun

  @pytest.mark.django_db
  def test_workflow_creation():
      workflow = Workflow.objects.create(
          name="Test Workflow",
          description="A test description",
          nodes={"node_1": {"type": "form_input"}},
          edges=[]
      )
      assert workflow.name == "Test Workflow"
      assert workflow.is_active is True
      assert str(workflow) == "Test Workflow"
  ```

- [ ] **Step 4: Run test and verify it passes**
  Run: `DJANGO_SETTINGS_MODULE=config.settings.test uv run pytest apps/workflows/tests/test_models.py`
  Expected: PASS

- [ ] **Step 5: Run migrations and commit**
  Run:
  ```bash
  uv run python manage.py makemigrations workflows
  uv run python manage.py migrate workflows
  git add apps/workflows/
  git commit -m "feat: add workflows models and migrations"
  ```

---

### Task 2: DRF REST API Endpoints for Workflow CRUD

**Files:**
- Create: `apps/workflows/api/serializers.py`
- Create: `apps/workflows/api/views.py`
- Modify: `config/api_router.py` (Register endpoints)
- Test: `apps/workflows/tests/test_api.py`

- [ ] **Step 1: Write views and serializers**
  Create `apps/workflows/api/serializers.py`:
  ```python
  from rest_framework import serializers
  from apps.workflows.models import Workflow, WorkflowRun, NodeRunLog

  class WorkflowSerializer(serializers.ModelSerializer):
      class Meta:
          model = Workflow
          fields = ["id", "name", "description", "is_active", "nodes", "edges", "created_at", "updated_at"]
          read_only_fields = ["id", "created_at", "updated_at"]

  class WorkflowRunSerializer(serializers.ModelSerializer):
      class Meta:
          model = WorkflowRun
          fields = ["id", "workflow", "status", "state_data", "started_at", "finished_at"]
  ```

  Create `apps/workflows/api/views.py`:
  ```python
  from rest_framework import viewsets, permissions
  from apps.workflows.models import Workflow, WorkflowRun
  from apps.workflows.api.serializers import WorkflowSerializer, WorkflowRunSerializer

  class WorkflowViewSet(viewsets.ModelSerializer):
      queryset = Workflow.objects.all().order_by("-created_at")
      serializer_class = WorkflowSerializer
      permission_classes = [permissions.IsAuthenticated]

  class WorkflowRunViewSet(viewsets.ReadOnlyModelViewSet):
      queryset = WorkflowRun.objects.all().order_by("-started_at")
      serializer_class = WorkflowRunSerializer
      permission_classes = [permissions.IsAuthenticated]
  ```

  Modify `config/api_router.py` to register routes:
  ```python
  from apps.workflows.api.views import WorkflowViewSet, WorkflowRunViewSet
  router.register("workflows", WorkflowViewSet, basename="workflow")
  router.register("workflow-runs", WorkflowRunViewSet, basename="workflowrun")
  ```

- [ ] **Step 2: Write API unit tests**
  Create `apps/workflows/tests/test_api.py`:
  ```python
  import pytest
  from django.urls import reverse
  from rest_framework.test import APIClient
  from apps.users.tests.factories import UserFactory
  from apps.workflows.models import Workflow

  @pytest.mark.django_db
  def test_workflow_list_requires_auth():
      client = APIClient()
      url = reverse("api-v1:workflow-list")
      response = client.get(url)
      assert response.status_code == 401

  @pytest.mark.django_db
  def test_workflow_create():
      user = UserFactory()
      client = APIClient()
      client.force_authenticate(user=user)
      url = reverse("api-v1:workflow-list")
      data = {
          "name": "New Flow",
          "description": "Desc",
          "nodes": {},
          "edges": []
      }
      response = client.post(url, data, format="json")
      assert response.status_code == 201
      assert Workflow.objects.filter(name="New Flow").exists()
  ```

- [ ] **Step 3: Run API tests**
  Run: `DJANGO_SETTINGS_MODULE=config.settings.test uv run pytest apps/workflows/tests/test_api.py`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run:
  ```bash
  git add apps/workflows/api/ config/api_router.py apps/workflows/tests/test_api.py
  git commit -m "feat: add workflow REST API endpoints"
  ```

---

### Task 3: BaseNode Interface and Registry

**Files:**
- Create: `apps/workflows/nodes/base.py`
- Create: `apps/workflows/nodes/registry.py`
- Test: `apps/workflows/tests/test_nodes.py`

- [ ] **Step 1: Write BaseNode class**
  Create `apps/workflows/nodes/base.py`:
  ```python
  class BaseNode:
      node_type = "base"

      def __init__(self, node_id: str, config_data: dict):
          self.node_id = node_id
          self.config_data = config_data

      def execute(self, state_data: dict) -> dict:
          raise NotImplementedError("Subclasses must implement execute")
  ```

- [ ] **Step 2: Write Registry manager**
  Create `apps/workflows/nodes/registry.py`:
  ```python
  from apps.workflows.nodes.base import BaseNode

  _registry = {}

  def register_node(cls):
      _registry[cls.node_type] = cls
      return cls

  def get_node_class(node_type: str) -> type[BaseNode]:
      if node_type not in _registry:
          raise ValueError(f"Node type '{node_type}' not found in registry")
      return _registry[node_type]
  ```

- [ ] **Step 3: Create registry and test it**
  Create `apps/workflows/tests/test_nodes.py`:
  ```python
  import pytest
  from apps.workflows.nodes.base import BaseNode
  from apps.workflows.nodes.registry import register_node, get_node_class

  @register_node
  class DummyNode(BaseNode):
      node_type = "dummy"
      def execute(self, state_data):
          return {"result": self.config_data.get("val", 0) + 1}

  def test_registry_registration():
      cls = get_node_class("dummy")
      assert cls == DummyNode
      instance = cls("dummy_1", {"val": 10})
      outputs = instance.execute({})
      assert outputs == {"result": 11}
  ```

- [ ] **Step 4: Run tests**
  Run: `DJANGO_SETTINGS_MODULE=config.settings.test uv run pytest apps/workflows/tests/test_nodes.py`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add apps/workflows/nodes/ apps/workflows/tests/test_nodes.py
  git commit -m "feat: add BaseNode interface and registry"
  ```

---

### Task 4: Topological Sort DAG Execution Engine (Fast Executor)

**Files:**
- Create: `apps/workflows/engine/executor.py`
- Test: `apps/workflows/tests/test_executor.py`

- [ ] **Step 1: Write DAG execution engine**
  Create `apps/workflows/engine/executor.py` (performs topo sort, runs nodes, handles condition skips, logs output):
  ```python
  from collections import deque
  from apps.workflows.models import WorkflowRun, NodeRunLog
  from apps.workflows.nodes.registry import get_node_class
  from django.utils import timezone

  def get_topological_order(nodes: dict, edges: list) -> list:
      adj = {nid: [] for nid in nodes}
      in_degree = {nid: 0 for nid in nodes}

      for edge in edges:
          source = edge["source"]
          target = edge["target"]
          if source in adj and target in adj:
              adj[source].append(target)
              in_degree[target] += 1

      queue = deque([nid for nid in nodes if in_degree[nid] == 0])
      order = []

      while queue:
          curr = queue.popleft()
          order.append(curr)
          for neighbor in adj[curr]:
              in_degree[neighbor] -= 1
              if in_degree[neighbor] == 0:
                  queue.append(neighbor)

      if len(order) != len(nodes):
          raise ValueError("Cycle detected in workflow edges")
      return order

  def run_workflow(workflow_run_id: str):
      run = WorkflowRun.objects.get(id=workflow_run_id)
      run.status = "running"
      run.save()

      workflow = run.workflow
      nodes = workflow.nodes
      edges = workflow.edges

      try:
          order = get_topological_order(nodes, edges)
      except Exception as e:
          run.status = "failed"
          run.state_data["error"] = str(e)
          run.save()
          return

      # Build adjacency map and track active execution paths
      skipped_nodes = set()

      for node_id in order:
          if node_id in skipped_nodes:
              continue

          node_conf = nodes[node_id]
          node_type = node_conf["type"]
          config_data = node_conf.get("data", {})

          # Initialize and execute node
          log = NodeRunLog.objects.create(
              workflow_run=run,
              node_id=node_id,
              node_type=node_type,
              status="running",
              input_data=run.state_data.copy()
          )

          try:
              node_cls = get_node_class(node_type)
              node_instance = node_cls(node_id, config_data)
              outputs = node_instance.execute(run.state_data)

              log.status = "success"
              log.output_data = outputs
              log.finished_at = timezone.now()
              log.save()

              # Update global context
              run.state_data[node_id] = outputs
              run.save()

              # Handle Condition Node routing logic
              if node_type == "condition":
                  next_branch = outputs.get("next_branch") # 'true' or 'false'
                  # Find edges from this node and mark the other branch nodes as skipped
                  for edge in edges:
                      if edge["source"] == node_id and edge.get("sourceHandle") != next_branch:
                          skipped_nodes.add(edge["target"])

          except Exception as e:
              log.status = "failed"
              log.error_message = str(e)
              log.finished_at = timezone.now()
              log.save()

              run.status = "failed"
              run.finished_at = timezone.now()
              run.save()
              return

      run.status = "success"
      run.finished_at = timezone.now()
      run.save()
  ```

- [ ] **Step 2: Write test for DAG executor**
  Create `apps/workflows/tests/test_executor.py`:
  ```python
  import pytest
  from apps.workflows.models import Workflow, WorkflowRun
  from apps.workflows.engine.executor import run_workflow
  from apps.workflows.nodes.registry import register_node
  from apps.workflows.nodes.base import BaseNode

  @register_node
  class PlusNode(BaseNode):
      node_type = "plus"
      def execute(self, state_data):
          return {"val": 100}

  @pytest.mark.django_db
  def test_executor_run():
      workflow = Workflow.objects.create(
          name="Simple DAG",
          nodes={"n1": {"type": "plus", "data": {}}},
          edges=[]
      )
      run = WorkflowRun.objects.create(workflow=workflow, state_data={})
      run_workflow(str(run.id))

      run.refresh_from_db()
      assert run.status == "success"
      assert run.state_data["n1"]["val"] == 100
  ```

- [ ] **Step 3: Run executor unit tests**
  Run: `DJANGO_SETTINGS_MODULE=config.settings.test uv run pytest apps/workflows/tests/test_executor.py`
  Expected: PASS

- [ ] **Step 4: Commit**
  Run:
  ```bash
  git add apps/workflows/engine/ apps/workflows/tests/test_executor.py
  git commit -m "feat: add DAG execution engine"
  ```

---

### Task 5: Implement Nodes & Webhook callback for Approval Node

**Files:**
- Create: `apps/workflows/nodes/implementations.py`
- Modify: `apps/workflows/api/views.py` (Add callback webhook API)
- Modify: `apps/workflows/tasks.py` (Celery run workflow task)

- [ ] **Step 1: Write Node implementations**
  Create `apps/workflows/nodes/implementations.py`:
  ```python
  import requests
  from apps.workflows.nodes.base import BaseNode
  from apps.workflows.nodes.registry import register_node

  @register_node
  class TelegramNotifierNode(BaseNode):
      node_type = "telegram_notify"

      def execute(self, state_data):
          bot_token = self.config_data.get("bot_token")
          chat_id = self.config_data.get("chat_id")
          msg_template = self.config_data.get("message", "")

          # Simple string template replacement
          formatted_msg = msg_template
          for key, val in state_data.items():
              if isinstance(val, dict):
                  for k2, v2 in val.items():
                      formatted_msg = formatted_msg.replace(f"{{{key}.{k2}}}", str(v2))

          url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
          res = requests.post(url, json={"chat_id": chat_id, "text": formatted_msg}, timeout=10)
          res.raise_for_status()
          return {"status": "sent"}

  @register_node
  class ConditionRouterNode(BaseNode):
      node_type = "condition"

      def execute(self, state_data):
          var_path = self.config_data.get("variable", "") # e.g. 'n1.val'
          operator = self.config_data.get("operator", "==")
          value = self.config_data.get("value")

          # Extract value
          parts = var_path.split(".")
          curr_val = state_data
          for part in parts:
              if isinstance(curr_val, dict):
                  curr_val = curr_val.get(part)
              else:
                  curr_val = None

          # Perform operator check
          result = False
          try:
              if operator == "==":
                  result = str(curr_val) == str(value)
              elif operator == ">":
                  result = float(curr_val) > float(value)
              elif operator == "<":
                  result = float(curr_val) < float(value)
          except Exception:
              result = False

          return {"next_branch": "true" if result else "false"}

  @register_node
  class ApprovalNode(BaseNode):
      node_type = "approval"

      def execute(self, state_data):
          # In execution logic: this should throw a PauseWorkflow Exception or return status.
          # For our simplicity: raise a custom Exception that the executor catches to mark status 'pending_approval' and pauses.
          raise Exception("WORKFLOW_PAUSED_FOR_APPROVAL")
  ```

- [ ] **Step 2: Add dynamic registration**
  Modify `apps/workflows/__init__.py` to import implementations so they auto-register.

- [ ] **Step 3: Update executor and views for Approval callback**
  Modify the `run_workflow` function in `apps/workflows/engine/executor.py` to handle `WORKFLOW_PAUSED_FOR_APPROVAL`:
  ```python
          try:
              # execution code...
              outputs = node_instance.execute(run.state_data)
          except Exception as e:
              if str(e) == "WORKFLOW_PAUSED_FOR_APPROVAL":
                  run.status = "pending_approval"
                  run.save()
                  log.status = "pending"
                  log.save()
                  return # Pause task execution here
              # standard error handling...
  ```

  And add callback view in `apps/workflows/api/views.py` that gets webhook hit, updates status, and fires off Celery run task to resume.

---

### Task 4: Celery Background Task & Frontend React Integration

Refer to the design file for Zustand store design and Vite routing.

---
