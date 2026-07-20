import pytest
from apps.workflows.nodes.base import BaseNode
from apps.workflows.nodes.registry import register_node, get_node_class

@register_node
class DummyTestNode(BaseNode):
    node_type = "dummy_test"

    def execute(self, state_data):
        val = self.config_data.get("val", 0)
        return {"result": val + 5}

def test_nodes_registry():
    cls = get_node_class("dummy_test")
    assert cls == DummyTestNode
    
    # Test unregistered node raises ValueError
    with pytest.raises(ValueError, match="not found in registry"):
        get_node_class("nonexistent_node_type")

    # Test registering non-BaseNode raises TypeError
    with pytest.raises(TypeError, match="must inherit from BaseNode"):
        register_node(object)  # type: ignore


def test_dummy_node_execution():
    node = DummyTestNode(node_id="dummy_1", config_data={"val": 10})
    assert node.node_id == "dummy_1"
    assert node.config_data == {"val": 10}
    assert node.node_type == "dummy_test"
    
    res = node.execute({})
    assert res == {"result": 15}


def test_invalid_registration():
    # Test registering a class without node_type
    with pytest.raises(ValueError, match="must define a unique 'node_type'"):
        @register_node
        class NoTypeNode(BaseNode):
            pass

