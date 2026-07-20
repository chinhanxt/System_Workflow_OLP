import pytest

from apps.workflows.engine.executor import get_topological_order
from apps.workflows.engine.executor import run_workflow
from apps.workflows.models import NodeRunLog
from apps.workflows.models import Workflow
from apps.workflows.models import WorkflowRun
from apps.workflows.nodes.base import BaseNode
from apps.workflows.nodes.registry import register_node


# Define and register test nodes
@register_node
class DummySimpleNode(BaseNode):
    node_type = "test_simple"

    def execute(self, state_data: dict) -> dict:
        val = self.config_data.get("val", 0)
        return {"result": val + 10}


# DummyConditionNode is not needed, we will use the registered ConditionRouterNode instead.


@register_node
class DummyErrorNode(BaseNode):
    node_type = "test_error"

    def execute(self, state_data: dict) -> dict:
        msg = "Intentional test error"
        raise ValueError(msg)


def test_topological_order_valid():
    nodes = {
        "n1": {"type": "test_simple"},
        "n2": {"type": "test_simple"},
        "n3": {"type": "test_simple"},
    }
    # n1 -> n2, n2 -> n3
    edges = [
        {"source": "n1", "target": "n2"},
        {"source": "n2", "target": "n3"},
    ]
    order = get_topological_order(nodes, edges)
    assert order == ["n1", "n2", "n3"]


def test_topological_order_cycle():
    nodes = {
        "n1": {"type": "test_simple"},
        "n2": {"type": "test_simple"},
    }
    # n1 -> n2, n2 -> n1 (cycle)
    edges = [
        {"source": "n1", "target": "n2"},
        {"source": "n2", "target": "n1"},
    ]
    with pytest.raises(ValueError, match="Cycle detected in workflow edges"):
        get_topological_order(nodes, edges)


@pytest.mark.django_db
def test_executor_run_success():
    # Simple valid workflow
    workflow = Workflow.objects.create(
        name="Test Successful Flow",
        nodes={
            "n1": {"type": "test_simple", "data": {"val": 5}},
            "n2": {"type": "test_simple", "data": {"val": 20}},
        },
        edges=[
            {"source": "n1", "target": "n2"},
        ],
    )
    run = WorkflowRun.objects.create(workflow=workflow, state_data={})
    run_workflow(str(run.id))

    run.refresh_from_db()
    assert run.status == WorkflowRun.Status.SUCCESS
    assert run.started_at is not None
    assert run.finished_at is not None
    assert run.state_data["n1"] == {"result": 15}
    assert run.state_data["n2"] == {"result": 30}

    # Verify logs were created
    logs = run.node_logs.all().order_by("started_at")
    assert logs.count() == 2
    assert logs[0].node_id == "n1"
    assert logs[0].status == NodeRunLog.Status.SUCCESS
    assert logs[0].output_data == {"result": 15}
    assert logs[1].node_id == "n2"
    assert logs[1].status == NodeRunLog.Status.SUCCESS
    assert logs[1].output_data == {"result": 30}


@pytest.mark.django_db
def test_executor_run_cycle_error():
    # Workflow with a cycle
    workflow = Workflow.objects.create(
        name="Test Cycle Flow",
        nodes={
            "n1": {"type": "test_simple"},
            "n2": {"type": "test_simple"},
        },
        edges=[
            {"source": "n1", "target": "n2"},
            {"source": "n2", "target": "n1"},
        ],
    )
    run = WorkflowRun.objects.create(workflow=workflow, state_data={})
    run_workflow(str(run.id))

    run.refresh_from_db()
    assert run.status == WorkflowRun.Status.FAILED
    assert "error" in run.state_data
    assert "Cycle detected" in run.state_data["error"]
    assert run.started_at is not None
    assert run.finished_at is not None


@pytest.mark.django_db
def test_executor_run_node_error():
    # Workflow containing an error node
    workflow = Workflow.objects.create(
        name="Test Error Flow",
        nodes={
            "n1": {"type": "test_simple", "data": {"val": 1}},
            "n2": {"type": "test_error"},
            "n3": {"type": "test_simple", "data": {"val": 2}},
        },
        edges=[
            {"source": "n1", "target": "n2"},
            {"source": "n2", "target": "n3"},
        ],
    )
    run = WorkflowRun.objects.create(workflow=workflow, state_data={})
    run_workflow(str(run.id))

    run.refresh_from_db()
    assert run.status == WorkflowRun.Status.FAILED
    assert "error" in run.state_data
    assert "Intentional test error" in run.state_data["error"]

    # n1 should succeed, n2 fail, n3 should not run
    n1_log = NodeRunLog.objects.get(workflow_run=run, node_id="n1")
    assert n1_log.status == NodeRunLog.Status.SUCCESS

    n2_log = NodeRunLog.objects.get(workflow_run=run, node_id="n2")
    assert n2_log.status == NodeRunLog.Status.FAILED
    assert "Intentional test error" in n2_log.error_message

    assert not NodeRunLog.objects.filter(workflow_run=run, node_id="n3").exists()


@pytest.mark.django_db
def test_executor_conditional_branching_true():
    # Condition node with branch="true"
    # n1 -> n2(cond)
    # n2 (true) -> n3 -> n5
    # n2 (false) -> n4 -> n6
    workflow = Workflow.objects.create(
        name="Test Conditional Branching",
        nodes={
            "n1": {"type": "test_simple", "data": {"val": 1}},
            "n2": {
                "type": "condition",
                "data": {
                    "variable": "branch_val",
                    "operator": "==",
                    "value": "true",
                },
            },
            "n3": {"type": "test_simple", "data": {"val": 10}},
            "n4": {"type": "test_simple", "data": {"val": 20}},
            "n5": {"type": "test_simple", "data": {"val": 100}},
            "n6": {"type": "test_simple", "data": {"val": 200}},
        },
        edges=[
            {"source": "n1", "target": "n2"},
            {"source": "n2", "target": "n3", "sourceHandle": "true"},
            {"source": "n2", "target": "n4", "sourceHandle": "false"},
            {"source": "n3", "target": "n5"},
            {"source": "n4", "target": "n6"},
        ],
    )
    run = WorkflowRun.objects.create(
        workflow=workflow, state_data={"branch_val": "true"},
    )
    run_workflow(str(run.id))

    run.refresh_from_db()
    assert run.status == WorkflowRun.Status.SUCCESS

    # n1, n2, n3, n5 should succeed and be logged
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n1").status
        == NodeRunLog.Status.SUCCESS
    )
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n2").status
        == NodeRunLog.Status.SUCCESS
    )
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n3").status
        == NodeRunLog.Status.SUCCESS
    )
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n5").status
        == NodeRunLog.Status.SUCCESS
    )

    # n4, n6 should be skipped (not logged)
    assert not NodeRunLog.objects.filter(workflow_run=run, node_id="n4").exists()
    assert not NodeRunLog.objects.filter(workflow_run=run, node_id="n6").exists()

    # state_data check
    assert "n3" in run.state_data
    assert "n5" in run.state_data
    assert "n4" not in run.state_data
    assert "n6" not in run.state_data


@pytest.mark.django_db
def test_executor_conditional_branching_false():
    # Condition node with branch="false"
    # n1 -> n2(cond)
    # n2 (true) -> n3 -> n5
    # n2 (false) -> n4 -> n6
    workflow = Workflow.objects.create(
        name="Test Conditional Branching False",
        nodes={
            "n1": {"type": "test_simple", "data": {"val": 1}},
            "n2": {
                "type": "condition",
                "data": {
                    "variable": "branch_val",
                    "operator": "==",
                    "value": "true",
                },
            },
            "n3": {"type": "test_simple", "data": {"val": 10}},
            "n4": {"type": "test_simple", "data": {"val": 20}},
            "n5": {"type": "test_simple", "data": {"val": 100}},
            "n6": {"type": "test_simple", "data": {"val": 200}},
        },
        edges=[
            {"source": "n1", "target": "n2"},
            {"source": "n2", "target": "n3", "sourceHandle": "true"},
            {"source": "n2", "target": "n4", "sourceHandle": "false"},
            {"source": "n3", "target": "n5"},
            {"source": "n4", "target": "n6"},
        ],
    )
    run = WorkflowRun.objects.create(
        workflow=workflow, state_data={"branch_val": "false"},
    )
    run_workflow(str(run.id))

    run.refresh_from_db()
    assert run.status == WorkflowRun.Status.SUCCESS

    # n1, n2, n4, n6 should succeed and be logged
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n1").status
        == NodeRunLog.Status.SUCCESS
    )
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n2").status
        == NodeRunLog.Status.SUCCESS
    )
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n4").status
        == NodeRunLog.Status.SUCCESS
    )
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n6").status
        == NodeRunLog.Status.SUCCESS
    )

    # n3, n5 should be skipped (not logged)
    assert not NodeRunLog.objects.filter(workflow_run=run, node_id="n3").exists()
    assert not NodeRunLog.objects.filter(workflow_run=run, node_id="n5").exists()

    # state_data check
    assert "n4" in run.state_data
    assert "n6" in run.state_data
    assert "n3" not in run.state_data
    assert "n5" not in run.state_data


@pytest.mark.django_db
def test_executor_conditional_join_merge():
    # n1 -> n2(cond, true)
    # n2 (true) -> n3 -> n5
    # n2 (false) -> n4 -> n5
    # n5 -> n6
    # When n2 resolves true, n3 runs, n4 is skipped, but n5 and n6 MUST run.
    workflow = Workflow.objects.create(
        name="Test Conditional Join Merge",
        nodes={
            "n1": {"type": "test_simple", "data": {"val": 1}},
            "n2": {
                "type": "condition",
                "data": {
                    "variable": "branch_val",
                    "operator": "==",
                    "value": "true",
                },
            },
            "n3": {"type": "test_simple", "data": {"val": 10}},
            "n4": {"type": "test_simple", "data": {"val": 20}},
            "n5": {"type": "test_simple", "data": {"val": 100}},
            "n6": {"type": "test_simple", "data": {"val": 200}},
        },
        edges=[
            {"source": "n1", "target": "n2"},
            {"source": "n2", "target": "n3", "sourceHandle": "true"},
            {"source": "n2", "target": "n4", "sourceHandle": "false"},
            {"source": "n3", "target": "n5"},
            {"source": "n4", "target": "n5"},
            {"source": "n5", "target": "n6"},
        ],
    )
    run = WorkflowRun.objects.create(
        workflow=workflow, state_data={"branch_val": "true"},
    )
    run_workflow(str(run.id))

    run.refresh_from_db()
    assert run.status == WorkflowRun.Status.SUCCESS

    # n1, n2, n3, n5, n6 should succeed and be logged
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n1").status
        == NodeRunLog.Status.SUCCESS
    )
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n2").status
        == NodeRunLog.Status.SUCCESS
    )
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n3").status
        == NodeRunLog.Status.SUCCESS
    )
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n5").status
        == NodeRunLog.Status.SUCCESS
    )
    assert (
        NodeRunLog.objects.get(workflow_run=run, node_id="n6").status
        == NodeRunLog.Status.SUCCESS
    )

    # n4 should be skipped
    assert not NodeRunLog.objects.filter(workflow_run=run, node_id="n4").exists()

    # state_data check
    assert "n3" in run.state_data
    assert "n5" in run.state_data
    assert "n6" in run.state_data
    assert "n4" not in run.state_data
