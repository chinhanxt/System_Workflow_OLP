from typing import TypeVar

from apps.workflows.nodes.base import BaseNode

T = TypeVar("T", bound=type[BaseNode])

_registry: dict[str, type[BaseNode]] = {}


def register_node[T: type[BaseNode]](cls: T) -> T:
    """Decorator to register a node class in the global registry."""
    if not issubclass(cls, BaseNode):
        msg = f"Class {cls.__name__} must inherit from BaseNode"
        raise TypeError(msg)

    node_type = cls.__dict__.get("node_type")
    if not node_type or node_type == "base":
        msg = f"Class {cls.__name__} must define a unique 'node_type'"
        raise ValueError(msg)

    if node_type in _registry:
        msg = f"Node type '{node_type}' is already registered by {_registry[node_type].__name__}"
        raise ValueError(
            msg,
        )

    _registry[node_type] = cls
    return cls


def get_node_class(node_type: str) -> type[BaseNode]:
    """Retrieve a node class from the registry by its type name."""
    if node_type not in _registry:
        msg = f"Node type '{node_type}' not found in registry"
        raise ValueError(msg)
    return _registry[node_type]
