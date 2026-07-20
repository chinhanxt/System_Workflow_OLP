from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.workflows.api.serializers import WorkflowRunSerializer, WorkflowSerializer
from apps.workflows.models import Workflow, WorkflowRun, NodeRunLog
from apps.workflows.tasks import run_workflow_task


class WorkflowViewSet(viewsets.ModelViewSet):
    """ViewSet for Workflow model providing full CRUD capabilities."""

    queryset = Workflow.objects.all().order_by("-created_at")
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="run")
    def run_workflow(self, request, pk=None):
        workflow = self.get_object()
        state_data = request.data.get("state_data", {})
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
        active_log = NodeRunLog.objects.filter(
            workflow_run=run,
            node_type="approval",
            status=NodeRunLog.Status.RUNNING
        ).order_by("-started_at").first()

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
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update state_data
        run.state_data = {**run.state_data, approval_node_id: {"decision": decision}}
        run.status = WorkflowRun.Status.RUNNING
        run.save()

        # Schedule execution task
        run_workflow_task.delay(str(run.id))

        return Response({
            "detail": f"Workflow run {run.id} has been {decision}.",
            "status": run.status,
            "state_data": run.state_data
        }, status=status.HTTP_200_OK)

