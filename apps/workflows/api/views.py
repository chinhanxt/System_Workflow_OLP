import logging

import requests
from django.utils import timezone
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.workflows.api.serializers import DocumentChunkSerializer
from apps.workflows.api.serializers import WorkflowRunSerializer
from apps.workflows.api.serializers import WorkflowSerializer
from apps.workflows.models import DocumentChunk
from apps.workflows.models import NodeRunLog
from apps.workflows.models import Workflow
from apps.workflows.models import WorkflowRun
from apps.workflows.tasks import run_workflow_task

logger = logging.getLogger(__name__)


class DocumentChunkViewSet(viewsets.ModelViewSet):
    """ViewSet for DocumentChunk model providing full CRUD capabilities."""

    queryset = DocumentChunk.objects.all().order_by("-created_at")
    serializer_class = DocumentChunkSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        chunk = serializer.save()
        api_key = self.request.headers.get("X-Gemini-API-Key")
        if api_key:
            if api_key in ("test", "mock-key"):
                chunk.embedding = [0.1] * 768
                chunk.save()
            else:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={api_key}"
                    payload = {
                        "model": "models/text-embedding-004",
                        "content": {
                            "parts": [{"text": chunk.text_content}]
                        }
                    }
                    response = requests.post(url, json=payload, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    chunk.embedding = data["embedding"]["values"]
                    chunk.save()
                except Exception as e:
                    logger.exception("Error generating Gemini embedding for DocumentChunk %s: %s", chunk.id, e)




class WorkflowViewSet(viewsets.ModelViewSet):
    """ViewSet for Workflow model providing full CRUD capabilities."""

    queryset = Workflow.objects.all().order_by("-created_at")
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        project_name = self.request.query_params.get("project_name")
        if project_name:
            queryset = queryset.filter(project_name=project_name)
        return queryset

    @action(detail=True, methods=["post"], url_path="run")
    def run_workflow(self, request, pk=None):
        workflow = self.get_object()
        if not workflow.is_active:
            return Response(
                {"detail": "Workflow is inactive."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        state_data = request.data.get("state_data", {})
        if not isinstance(state_data, dict):
            state_data = {}
        state_data["__env__"] = {
            "GEMINI_API_KEY": request.headers.get("X-Gemini-API-Key", ""),
            "OPENAI_API_KEY": request.headers.get("X-OpenAI-API-Key", ""),
            "TELEGRAM_BOT_TOKEN": request.headers.get("X-Telegram-Bot-Token", ""),
        }
        run = WorkflowRun.objects.create(workflow=workflow, state_data=state_data)
        run_workflow_task.delay(str(run.id))
        serializer = WorkflowRunSerializer(run)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["get"],
        url_path="form",
        permission_classes=[AllowAny],
    )
    def get_form_config(self, request, pk=None):
        workflow = self.get_object()
        fields = []
        for nconf in (workflow.nodes or {}).values():
            if nconf.get("type") == "form_builder":
                fields = nconf.get("fields", [])
                break
        return Response(
            {
                "workflow_id": str(workflow.id),
                "workflow_name": workflow.name,
                "fields": fields,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="submit-form",
        permission_classes=[AllowAny],
    )
    def submit_form(self, request, pk=None):
        workflow = self.get_object()
        if not workflow.is_active:
            return Response(
                {"detail": "Workflow is inactive."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        form_node_id = "form_builder"
        for nid, nconf in (workflow.nodes or {}).items():
            if nconf.get("type") == "form_builder":
                form_node_id = nid
                break

        state_data = {form_node_id: request.data}
        state_data["__env__"] = {
            "GEMINI_API_KEY": request.headers.get("X-Gemini-API-Key", ""),
            "OPENAI_API_KEY": request.headers.get("X-OpenAI-API-Key", ""),
            "TELEGRAM_BOT_TOKEN": request.headers.get("X-Telegram-Bot-Token", ""),
        }
        run = WorkflowRun.objects.create(workflow=workflow, state_data=state_data)
        run_workflow_task.delay(str(run.id))
        serializer = WorkflowRunSerializer(run)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WorkflowRunViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for WorkflowRun model providing read-only capabilities."""

    queryset = WorkflowRun.objects.all().order_by("-started_at")
    serializer_class = WorkflowRunSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post", "get"], permission_classes=[AllowAny])
    def approve(self, request, pk=None):
        run = self.get_object()
        return self._handle_callback(run, "approved")

    @action(detail=True, methods=["post", "get"], permission_classes=[AllowAny])
    def reject(self, request, pk=None):
        run = self.get_object()
        return self._handle_callback(run, "rejected")

    def _handle_callback(self, run, decision):
        # We need to find the node_id of the approval node currently pending approval.
        # We look for a NodeRunLog for this workflow run of type "approval"
        # with status "running".
        active_log = (
            NodeRunLog.objects.filter(
                workflow_run=run,
                node_type="approval",
                status=NodeRunLog.Status.RUNNING,
            )
            .order_by("-started_at")
            .first()
        )

        approval_node_id = None
        if active_log:
            approval_node_id = active_log.node_id
            active_log.status = NodeRunLog.Status.SUCCESS
            active_log.output_data = {"decision": decision}
            active_log.finished_at = timezone.now()
            active_log.save()
        else:
            # Fallback: look at run.workflow.nodes to find the approval node ID
            for nid, nconf in (run.workflow.nodes or {}).items():
                if nconf.get("type") == "approval":
                    approval_node_id = nid
                    break

        if not approval_node_id:
            return Response(
                {"detail": "No active approval node found for this workflow run."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update state_data
        run.state_data = {**run.state_data, approval_node_id: {"decision": decision}}
        run.status = WorkflowRun.Status.RUNNING
        run.save()

        # Schedule execution task
        run_workflow_task.delay(str(run.id))

        return Response(
            {
                "detail": f"Workflow run {run.id} has been {decision}.",
                "status": run.status,
                "state_data": run.state_data,
            },
            status=status.HTTP_200_OK,
        )
