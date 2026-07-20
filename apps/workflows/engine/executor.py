from collections import deque

from django.utils import timezone

from apps.workflows.exceptions import PauseWorkflow
from apps.workflows.models import NodeRunLog
from apps.workflows.models import WorkflowRun
from apps.workflows.nodes.registry import get_node_class


def get_topological_order(nodes: dict, edges: list) -> list:
    """
    Performs a topological sort on nodes using Kahn's algorithm.
    Detects cycles and raises ValueError if a cycle is present.
    """
    adj = {nid: [] for nid in nodes}
    in_degree = dict.fromkeys(nodes, 0)

    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
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
        msg = "Cycle detected in workflow edges"
        raise ValueError(msg)
    return order


def run_workflow(workflow_run_id: str):
    """
    Runs a workflow instance sequentially based on its topological sort.
    """
    run = WorkflowRun.objects.get(id=workflow_run_id)
    run.status = WorkflowRun.Status.RUNNING
    if not run.started_at:
        run.started_at = timezone.now()
    run.save()

    workflow = run.workflow
    nodes = workflow.nodes
    edges = workflow.edges

    try:
        order = get_topological_order(nodes, edges)
    except Exception as e:
        run.status = WorkflowRun.Status.FAILED
        run.finished_at = timezone.now()
        run.state_data["error"] = str(e)
        run.save()
        return

    # Find incoming edges for each node
    incoming_edges = {nid: [] for nid in nodes}
    for edge in edges:
        target = edge.get("target")
        if target in incoming_edges:
            incoming_edges[target].append(edge)

    skipped_nodes = set()

    for node_id in order:
        # Determine if this node should be skipped
        incoming = incoming_edges.get(node_id, [])
        if incoming:
            all_inactive = True
            for edge in incoming:
                src = edge.get("source")
                # Edge is active if:
                # 1. Source is not skipped
                # 2. If source is a condition, the edge handle must match condition outcome
                if src in skipped_nodes:
                    continue

                src_conf = nodes.get(src, {})
                if src_conf.get("type") == "condition":
                    # Get condition node output
                    src_output = run.state_data.get(src, {})
                    next_branch = src_output.get("next_branch")
                    if edge.get("sourceHandle") != next_branch:
                        continue

                all_inactive = False
                break

            if all_inactive:
                skipped_nodes.add(node_id)

        if node_id in skipped_nodes:
            continue

        # Check if node was already executed successfully (e.g. when resuming)
        existing_log = NodeRunLog.objects.filter(
            workflow_run=run,
            node_id=node_id,
            status=NodeRunLog.Status.SUCCESS,
        ).first()

        if existing_log:
            # Already run successfully, skip re-execution but keep output
            continue

        node_conf = nodes[node_id]
        node_type = node_conf.get("type")
        config_data = node_conf.get("data", {})

        # Create/Get NodeRunLog
        log, created = NodeRunLog.objects.get_or_create(
            workflow_run=run,
            node_id=node_id,
            defaults={
                "node_type": node_type,
                "status": NodeRunLog.Status.RUNNING,
                "input_data": run.state_data.copy(),
                "started_at": timezone.now(),
            },
        )
        if not created:
            log.status = NodeRunLog.Status.RUNNING
            log.input_data = run.state_data.copy()
            log.started_at = timezone.now()
            log.save()

        try:
            node_cls = get_node_class(node_type)
            node_instance = node_cls(node_id, config_data)
            outputs = node_instance.execute(run.state_data)

            # Validate condition output
            if node_type == "condition":
                next_branch = outputs.get("next_branch")
                if next_branch not in ["true", "false"]:
                    msg = f"Condition node must return 'true' or 'false' in 'next_branch', got: {next_branch}"
                    raise ValueError(
                        msg,
                    )

            log.status = NodeRunLog.Status.SUCCESS
            log.output_data = outputs
            log.finished_at = timezone.now()
            log.save()

            # Mutate state_data ensuring dirty-tracking detects changes
            run.state_data = {**run.state_data, node_id: outputs}
            run.save()

        except PauseWorkflow:
            # ApprovalNode pauses
            log.status = NodeRunLog.Status.RUNNING
            log.save()
            run.status = WorkflowRun.Status.PENDING_APPROVAL
            run.save()
            return

        except Exception as e:
            log.status = NodeRunLog.Status.FAILED
            log.error_message = str(e)
            log.finished_at = timezone.now()
            log.save()

            run.status = WorkflowRun.Status.FAILED
            run.finished_at = timezone.now()
            run.state_data = {
                **run.state_data,
                "error": f"Error in node {node_id}: {e!s}",
            }
            run.save()
            return

    run.status = WorkflowRun.Status.SUCCESS
    run.finished_at = timezone.now()
    run.save()
