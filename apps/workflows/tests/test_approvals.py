from unittest.mock import patch

import pytest

from apps.workflows.engine.executor import run_workflow
from apps.workflows.models import NodeRunLog
from apps.workflows.models import Workflow
from apps.workflows.models import WorkflowRun


@pytest.mark.django_db
def test_approval_flow_pause_resume():
    # 1. Create a workflow: n1(approval) -> n2(telegram_notify)
    workflow = Workflow.objects.create(
        name="Approval Run Flow",
        nodes={
            "n1": {"type": "approval", "data": {}},
            "n2": {
                "type": "telegram_notify",
                "data": {
                    "bot_token": "mock_token",
                    "chat_id": "123",
                    "message": "Approved value: {n1.decision}",
                },
            },
        },
        edges=[
            {"source": "n1", "target": "n2"},
        ],
    )

    # 2. Run workflow. It should stop at n1 and set run status to pending_approval.
    run = WorkflowRun.objects.create(workflow=workflow, state_data={})
    run_workflow(str(run.id))

    run.refresh_from_db()
    assert run.status == WorkflowRun.Status.PENDING_APPROVAL
    assert "n2" not in run.state_data

    # Log for n1 should be running (pending)
    n1_log = NodeRunLog.objects.get(workflow_run=run, node_id="n1")
    assert n1_log.status == NodeRunLog.Status.RUNNING

    # 3. Simulate human approval decision: update state_data and mark node log success
    n1_log.status = NodeRunLog.Status.SUCCESS
    n1_log.output_data = {"decision": "approved"}
    n1_log.save()

    run.state_data = {"n1": {"decision": "approved"}}
    run.status = WorkflowRun.Status.RUNNING
    run.save()

    # 4. Resume execution. It should skip n1 since its log is success, and run n2.
    with patch("requests.post") as mock_post:
        # Mock telegram api response
        mock_post.return_value.status_code = 200
        run_workflow(str(run.id))

        run.refresh_from_db()
        assert run.status == WorkflowRun.Status.SUCCESS
        assert run.state_data["n2"] == {
            "status": "sent",
            "message": "Approved value: approved",
        }
        mock_post.assert_called_once()


@pytest.mark.django_db
def test_condition_router_logical_execution():
    # n1(condition: is amount > 50)
    # true -> n2(telegram_notify)
    # false -> n3(telegram_notify)
    workflow = Workflow.objects.create(
        name="Condition Flow",
        nodes={
            "n1": {
                "type": "condition",
                "data": {
                    "variable": "input_val.amount",
                    "operator": ">",
                    "value": 50,
                },
            },
            "n2": {
                "type": "telegram_notify",
                "data": {
                    "bot_token": "mock_token",
                    "chat_id": "123",
                    "message": "True branch",
                },
            },
            "n3": {
                "type": "telegram_notify",
                "data": {
                    "bot_token": "mock_token",
                    "chat_id": "123",
                    "message": "False branch",
                },
            },
        },
        edges=[
            {"source": "n1", "target": "n2", "sourceHandle": "true"},
            {"source": "n1", "target": "n3", "sourceHandle": "false"},
        ],
    )

    # Run 1: amount is 100 -> should go to True branch (n2)
    run1 = WorkflowRun.objects.create(
        workflow=workflow, state_data={"input_val": {"amount": 100}},
    )
    with patch("requests.post"):
        run_workflow(str(run1.id))
        run1.refresh_from_db()
        assert run1.status == WorkflowRun.Status.SUCCESS
        assert "n2" in run1.state_data
        assert "n3" not in run1.state_data
        assert NodeRunLog.objects.filter(workflow_run=run1, node_id="n2").exists()
        assert not NodeRunLog.objects.filter(workflow_run=run1, node_id="n3").exists()

    # Run 2: amount is 10 -> should go to False branch (n3)
    run2 = WorkflowRun.objects.create(
        workflow=workflow, state_data={"input_val": {"amount": 10}},
    )
    with patch("requests.post"):
        run_workflow(str(run2.id))
        run2.refresh_from_db()
        assert run2.status == WorkflowRun.Status.SUCCESS
        assert "n3" in run2.state_data
        assert "n2" not in run2.state_data
        assert NodeRunLog.objects.filter(workflow_run=run2, node_id="n3").exists()
        assert not NodeRunLog.objects.filter(workflow_run=run2, node_id="n2").exists()
