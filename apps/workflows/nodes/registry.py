from typing import Any, Type, TypeVar
from apps.workflows.nodes.base import BaseNode

T = TypeVar("T", bound=Type[BaseNode])

_registry: dict[str, Type[BaseNode]] = {}

def register_node(cls: T) -> T:
    """Decorator to register a node class in the global registry."""
    if not issubclass(cls, BaseNode):
        raise TypeError(f"Class {cls.__name__} must inherit from BaseNode")
    
    node_type = cls.__dict__.get("node_type")
    if not node_type or node_type == "base":
        raise ValueError(f"Class {cls.__name__} must define a unique 'node_type'")
    
    if node_type in _registry:
        raise ValueError(f"Node type '{node_type}' is already registered by {_registry[node_type].__name__}")
    
    _registry[node_type] = cls
    return cls

def get_node_class(node_type: str) -> Type[BaseNode]:
    """Retrieve a node class from the registry by its type name."""
    if node_type not in _registry:
        raise ValueError(f"Node type '{node_type}' not found in registry")
    return _registry[node_type]
