import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.tests.factories import UserFactory
from apps.workflows.models import Workflow, WorkflowRun, NodeRunLog

@pytest.mark.django_db
class TestWorkflowAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory()

    def test_workflow_list_unauthenticated_blocked(self):
        """Verify unauthenticated requests to list workflows are blocked (401)."""
        url = reverse("api:workflow-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_workflow_run_list_unauthenticated_blocked(self):
        """Verify unauthenticated requests to list workflow runs are blocked (401)."""
        url = reverse("api:workflowrun-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_workflow_list_authenticated(self):
        """Verify authenticated user can list workflows (200)."""
        self.client.force_authenticate(user=self.user)
        Workflow.objects.create(name="Flow A", description="Desc A")
        Workflow.objects.create(name="Flow B", description="Desc B")

        url = reverse("api:workflow-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2

    def test_workflow_create_authenticated(self):
        """Verify authenticated user can create a workflow (201)."""
        self.client.force_authenticate(user=self.user)
        url = reverse("api:workflow-list")
        data = {
            "name": "New Dynamic Workflow",
            "description": "My first workflow",
            "is_active": True,
            "nodes": {"start_node": {"type": "approval", "data": {}}},
            "edges": [],
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Dynamic Workflow"

    def test_workflow_run_list_authenticated(self):
        """Verify authenticated user can list workflow runs (200)."""
        self.client.force_authenticate(user=self.user)
        workflow = Workflow.objects.create(name="Flow Run Workflow")
        WorkflowRun.objects.create(workflow=workflow, status=WorkflowRun.Status.PENDING)

        url = reverse("api:workflowrun-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1

    def test_workflow_run_trigger_and_approvals(self):
        """Verify trigger run, and post approvals/rejects views flow."""
        self.client.force_authenticate(user=self.user)

        workflow = Workflow.objects.create(
            name="Approval Flow API",
            nodes={
                "n1": {"type": "approval", "data": {}}
            },
            edges=[]
        )

        # Trigger run
        run_url = reverse("api:workflow-run-workflow", kwargs={"pk": workflow.id})
        response = self.client.post(run_url, {}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        run_id = response.data["id"]

        run = WorkflowRun.objects.get(id=run_id)
        # The run should pause at approval node (pending_approval)
        assert run.status == WorkflowRun.Status.PENDING_APPROVAL

        # Log for approval node should be created as RUNNING
        n1_log = NodeRunLog.objects.get(workflow_run=run, node_id="n1")
        assert n1_log.status == NodeRunLog.Status.RUNNING

        # In view, approval callback expects a pending log status, let's set it
        n1_log.status = "pending"
        n1_log.save()

        # Approve run
        approve_url = reverse("api:workflowrun-approve", kwargs={"pk": run.id})
        response = self.client.post(approve_url, {}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "running"  # resumes

        run.refresh_from_db()
        assert run.state_data["n1"] == {"decision": "approved"}
