import pytest
from django.utils import timezone

from apps.workflows.models import NodeRunLog
from apps.workflows.models import Workflow
from apps.workflows.models import WorkflowRun


@pytest.mark.django_db
class TestWorkflowModel:
    def test_workflow_creation(self):
        """Test creating a Workflow instance with default and custom values."""
        workflow = Workflow.objects.create(
            name="Test Workflow",
            description="A test workflow description",
            nodes={"start": {"type": "trigger"}},
            edges=[{"from": "start", "to": "end"}],
        )

        assert workflow.id is not None
        assert workflow.name == "Test Workflow"
        assert workflow.description == "A test workflow description"
        assert workflow.is_active is True
        assert workflow.nodes == {"start": {"type": "trigger"}}
        assert workflow.edges == [{"from": "start", "to": "end"}]
        assert workflow.created_at is not None
        assert workflow.updated_at is not None
        assert str(workflow) == "Test Workflow"

    def test_workflow_defaults(self):
        """Test Workflow default field values."""
        workflow = Workflow.objects.create(name="Minimal Workflow")
        assert workflow.description == ""
        assert workflow.is_active is True
        assert workflow.nodes == {}
        assert workflow.edges == []


@pytest.mark.django_db
class TestWorkflowRunModel:
    def test_workflow_run_creation(self):
        """Test creating a WorkflowRun instance."""
        workflow = Workflow.objects.create(name="Run Workflow")
        now = timezone.now()
        run = WorkflowRun.objects.create(
            workflow=workflow,
            status=WorkflowRun.Status.RUNNING,
            state_data={"variable": 42},
            started_at=now,
        )

        assert run.id is not None
        assert run.workflow == workflow
        assert run.status == WorkflowRun.Status.RUNNING
        assert run.state_data == {"variable": 42}
        assert run.started_at == now
        assert run.finished_at is None
        assert str(run) == f"Run Workflow - running ({run.id})"

    def test_workflow_run_defaults(self):
        """Test WorkflowRun default field values."""
        workflow = Workflow.objects.create(name="Run Defaults Workflow")
        run = WorkflowRun.objects.create(workflow=workflow)
        assert run.status == WorkflowRun.Status.PENDING
        assert run.state_data == {}
        assert run.started_at is None
        assert run.finished_at is None


@pytest.mark.django_db
class TestNodeRunLogModel:
    def test_node_run_log_creation(self):
        """Test creating a NodeRunLog instance."""
        workflow = Workflow.objects.create(name="Node Log Workflow")
        run = WorkflowRun.objects.create(workflow=workflow)
        now = timezone.now()

        log = NodeRunLog.objects.create(
            workflow_run=run,
            node_id="node_123",
            node_type="http_request",
            status=NodeRunLog.Status.SUCCESS,
            input_data={"url": "https://example.com"},
            output_data={"status_code": 200},
            error_message="",
            started_at=now,
            finished_at=now,
        )

        assert log.id is not None
        assert log.workflow_run == run
        assert log.node_id == "node_123"
        assert log.node_type == "http_request"
        assert log.status == NodeRunLog.Status.SUCCESS
        assert log.input_data == {"url": "https://example.com"}
        assert log.output_data == {"status_code": 200}
        assert log.error_message == ""
        assert log.started_at == now
        assert log.finished_at == now
        assert str(log) == "node_123 (http_request) - success"

    def test_node_run_log_defaults(self):
        """Test NodeRunLog default field values."""
        workflow = Workflow.objects.create(name="Node Log Defaults Workflow")
        run = WorkflowRun.objects.create(workflow=workflow)

        log = NodeRunLog.objects.create(
            workflow_run=run,
            node_id="node_456",
            node_type="email",
        )

        assert log.status == NodeRunLog.Status.RUNNING
        assert log.input_data == {}
        assert log.output_data == {}
        assert log.error_message == ""
        assert log.started_at is not None  # timezone.now default
        assert log.finished_at is None
