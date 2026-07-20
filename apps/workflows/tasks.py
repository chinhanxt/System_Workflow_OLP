from celery import shared_task

from apps.workflows.engine.executor import run_workflow


@shared_task
def run_workflow_task(workflow_run_id: str):
    """
    Celery task to run a workflow asynchronously.
    """
    run_workflow(workflow_run_id)
