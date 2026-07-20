import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from apps.users.tests.factories import UserFactory
from apps.workflows.models import DocumentChunk
from apps.workflows.models import NodeRunLog
from apps.workflows.models import Workflow
from apps.workflows.models import WorkflowRun


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
        assert len(response.data["results"]) == 2  # noqa: PLR2004

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
                "n1": {"type": "approval", "data": {}},
            },
            edges=[],
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

        # In view, approval callback expects a running log status, let's set it
        n1_log.status = NodeRunLog.Status.RUNNING
        n1_log.save()

        # Approve run
        approve_url = reverse("api:workflowrun-approve", kwargs={"pk": run.id})
        response = self.client.post(approve_url, {}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "running"  # resumes

        run.refresh_from_db()
        assert run.state_data["n1"] == {"decision": "approved"}
        assert run.status == WorkflowRun.Status.SUCCESS

        # Verify active_log is marked as SUCCESS and output updated
        n1_log.refresh_from_db()
        assert n1_log.status == NodeRunLog.Status.SUCCESS
        assert n1_log.output_data == {"decision": "approved"}
        assert n1_log.finished_at is not None

    def test_public_form_endpoints(self):
        """Verify unauthenticated access to form configs and form submission works."""
        workflow = Workflow.objects.create(
            name="Public Submission Workflow",
            nodes={
                "form_1": {
                    "type": "form_builder",
                    "fields": [
                        {"name": "full_name", "type": "text", "label": "Full name"},
                        {"name": "amount", "type": "number", "label": "Amount"},
                    ],
                },
            },
            edges=[],
        )

        # GET config
        form_url = reverse("api:workflow-get-form-config", kwargs={"pk": workflow.id})
        response = self.client.get(form_url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["workflow_name"] == "Public Submission Workflow"
        assert len(response.data["fields"]) == 2  # noqa: PLR2004

        # POST submission (unauthenticated)
        submit_url = reverse("api:workflow-submit-form", kwargs={"pk": workflow.id})
        payload = {"full_name": "Nguyen Van A", "amount": 1500000}
        response = self.client.post(submit_url, payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

        # Verify run was created and state_data has the input
        run_id = response.data["id"]
        run = WorkflowRun.objects.get(id=run_id)
        assert run.state_data["form_1"] == payload

    def test_workflow_list_filter_by_project_name(self):
        """Verify that workflow list can be filtered by project_name."""
        self.client.force_authenticate(user=self.user)
        Workflow.objects.create(name="Flow X", project_name="Project X")
        Workflow.objects.create(name="Flow Y", project_name="Project Y")

        # No filter
        url = reverse("api:workflow-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK

        # Filter by Project X
        response = self.client.get(url, {"project_name": "Project X"})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 1
        assert response.data["results"][0]["name"] == "Flow X"

    def test_document_chunks_api(self):
        """Verify unauthenticated access to DocumentChunk API endpoints (AllowAny)."""

        DocumentChunk.objects.create(document_name="Doc 1", text_content="Content 1")
        DocumentChunk.objects.create(document_name="Doc 2", text_content="Content 2")

        url = reverse("api:documentchunk-list")
        response = self.client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) == 2  # noqa: PLR2004
        # Ordered by descending created_at
        assert response.data["results"][0]["document_name"] == "Doc 2"
        assert response.data["results"][1]["document_name"] == "Doc 1"

    def test_document_chunks_write_unauthenticated_blocked(self):
        """Verify write operations to DocumentChunk API endpoints require auth."""
        # Unauthenticated client
        url = reverse("api:documentchunk-list")
        data = {"document_name": "Doc 3", "text_content": "Content 3"}
        response = self.client.post(url, data, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        # Create one to test detail write endpoints

        chunk = DocumentChunk.objects.create(
            document_name="Doc 1",
            text_content="Content 1",
        )
        detail_url = reverse("api:documentchunk-detail", kwargs={"pk": chunk.id})

        response = self.client.put(
            detail_url,
            {"document_name": "Updated"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

        response = self.client.delete(detail_url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_workflow_run_and_submit_form_inactive_blocked(self):
        """Verify inactive workflows cannot be run or submitted to."""
        self.client.force_authenticate(user=self.user)
        workflow = Workflow.objects.create(
            name="Inactive Workflow",
            is_active=False,
            nodes={
                "form_1": {
                    "type": "form_builder",
                    "fields": [],
                },
            },
            edges=[],
        )

        # Trigger run on inactive workflow
        run_url = reverse("api:workflow-run-workflow", kwargs={"pk": workflow.id})
        response = self.client.post(run_url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["detail"] == "Workflow is inactive."

        # Submit form to inactive workflow
        submit_url = reverse("api:workflow-submit-form", kwargs={"pk": workflow.id})
        response = self.client.post(submit_url, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["detail"] == "Workflow is inactive."
