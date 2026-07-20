class PauseWorkflow(Exception):
    """Exception raised when a workflow execution needs to be paused (e.g. for approval)."""
    pass
