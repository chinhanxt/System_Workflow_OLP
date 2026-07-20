from typing import Any

class BaseNode:
    node_type = "base"

    def __init__(self, node_id: str, config_data: dict[str, Any]):
        self.node_id = node_id
        self.config_data = config_data

    def execute(self, state_data: dict[str, Any]) -> dict[str, Any]:
        """
        Execute the node logic.
        Must return a dict of output variables or raise an exception.
        """
        raise NotImplementedError("Subclasses must implement execute")
