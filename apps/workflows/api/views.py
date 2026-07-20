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


class DocumentChunkViewSet(viewsets.ModelViewSet):
    """ViewSet for DocumentChunk model providing full CRUD capabilities."""

    queryset = DocumentChunk.objects.all().order_by("-created_at")
    serializer_class = DocumentChunkSerializer
    permission_classes = [AllowAny]


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
        state_data = request.data.get("state_data", {})
        run = WorkflowRun.objects.create(workflow=workflow, state_data=state_data)
        run_workflow_task.delay(str(run.id))
        serializer = WorkflowRunSerializer(run)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True, methods=["get"], url_path="form", permission_classes=[AllowAny]
    )
    def get_form_config(self, request, pk=None):
        workflow = self.get_object()
        fields = []
        for nid, nconf in workflow.nodes.items():
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
        form_node_id = "form_builder"
        for nid, nconf in workflow.nodes.items():
            if nconf.get("type") == "form_builder":
                form_node_id = nid
                break

        state_data = {form_node_id: request.data}
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
        # We look for a NodeRunLog for this workflow run of type "approval" with status "running".
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
        else:
            # Fallback: look at run.workflow.nodes to find the approval node ID
            for nid, nconf in run.workflow.nodes.items():
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
