import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.users.tests.factories import UserFactory
from apps.workflows.models import Workflow, WorkflowRun


@pytest.mark.django_db
class TestWorkflowAPI:
    def setup_method(self):
        self.client = APIClient()
        self.user = UserFactory()

    def test_workflow_list_unauthenticated_blocked(self):
        """Verify unauthenticated requests to list workflows are blocked (401)."""
        url = reverse("api:workflow-list")
        response = self.client.get(url)
        assert response.status_code == 401

    def test_workflow_run_list_unauthenticated_blocked(self):
        """Verify unauthenticated requests to list workflow runs are blocked (401)."""
        url = reverse("api:workflowrun-list")
        response = self.client.get(url)
        assert response.status_code == 401

    def test_workflow_list_authenticated(self):
        """Verify authenticated user can list workflows (200)."""
        self.client.force_authenticate(user=self.user)
        Workflow.objects.create(name="Flow A", description="Desc A")
        Workflow.objects.create(name="Flow B", description="Desc B")

        url = reverse("api:workflow-list")
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 2
        assert response.data["results"][0]["name"] in ["Flow A", "Flow B"]

    def test_workflow_create_authenticated(self):
        """Verify authenticated user can create a workflow (201)."""
        self.client.force_authenticate(user=self.user)
        url = reverse("api:workflow-list")
        data = {
            "name": "New Dynamic Workflow",
            "description": "My first workflow",
            "is_active": True,
            "nodes": {"start_node": {"type": "trigger", "data": {}}},
            "edges": [],
        }
        response = self.client.post(url, data, format="json")
        assert response.status_code == 201
        assert response.data["name"] == "New Dynamic Workflow"
        assert response.data["description"] == "My first workflow"
        assert response.data["nodes"] == {"start_node": {"type": "trigger", "data": {}}}
        assert Workflow.objects.filter(name="New Dynamic Workflow").exists()

    def test_workflow_run_list_authenticated(self):
        """Verify authenticated user can list workflow runs (200)."""
        self.client.force_authenticate(user=self.user)
        workflow = Workflow.objects.create(name="Flow Run Workflow")
        WorkflowRun.objects.create(workflow=workflow, status=WorkflowRun.Status.PENDING)

        url = reverse("api:workflowrun-list")
        response = self.client.get(url)
        assert response.status_code == 200
        assert len(response.data["results"]) == 1
        assert str(response.data["results"][0]["workflow"]) == str(workflow.id)
