import pytest

from apps.workflows.nodes.base import BaseNode
from apps.workflows.nodes.registry import get_node_class
from apps.workflows.nodes.registry import register_node


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


def test_form_builder_node():
    node_cls = get_node_class("form_builder")
    node = node_cls(node_id="form_1", config_data={})
    state = {"form_1": {"full_name": "Nguyen Van A", "amount": 1000}}
    res = node.execute(state)
    assert res == {"full_name": "Nguyen Van A", "amount": 1000}


def test_api_request_node_mock():
    node_cls = get_node_class("api_request")
    node = node_cls(node_id="api_1", config_data={
        "url": "http://example.com/api/{form_1.id}",
        "method": "POST",
        "headers": {"Authorization": "Bearer {form_1.token}"},
        "body": "{\"user\": \"{form_1.full_name}\"}"
    })
    state = {
        "form_1": {
            "id": "123",
            "token": "secret_token",
            "full_name": "Nguyen Van A"
        }
    }
    res = node.execute(state)
    assert res["status_code"] == 200
    assert res["response"]["success"] is True


def test_google_sheets_node():
    node_cls = get_node_class("google_sheets")
    node = node_cls(node_id="sheets_1", config_data={
        "spreadsheet_id": "sheet_123",
        "sheet_name": "List",
        "action": "append",
        "row_data": "{form_1.full_name}, {form_1.amount}"
    })
    state = {
        "form_1": {
            "full_name": "Nguyen Van A",
            "amount": 1500000
        }
    }
    res = node.execute(state)
    assert res["success"] is True
    assert res["written_values"] == ["Nguyen Van A", "1500000"]


def test_prompt_template_node():
    node_cls = get_node_class("prompt_template")
    node = node_cls(node_id="prompt_1", config_data={
        "template": "Hello {form_1.name}, you proposed {form_1.amount}."
    })
    state = {"form_1": {"name": "Nguyen Van A", "amount": 2000000}}
    res = node.execute(state)
    assert res["prompt"] == "Hello Nguyen Van A, you proposed 2000000."


def test_llm_node_mock():
    node_cls = get_node_class("llm")
    node = node_cls(node_id="llm_1", config_data={
        "provider": "gemini",
        "model": "gemini-1.5-flash",
        "temperature": 0.5,
        "prompt": "Analyze: {prompt_1.prompt}"
    })
    state = {"prompt_1": {"prompt": "Request for budget increase."}}
    res = node.execute(state)
    assert res["provider"] == "gemini"
    assert "Request for budget increase" in res["text"]
    assert res["mocked"] is True


@pytest.mark.django_db
def test_rag_search_node():
    node_cls = get_node_class("rag_search")
    node = node_cls(node_id="rag_1", config_data={
        "query": "Hạn mức phê duyệt chi tiêu là bao nhiêu?"
    })
    res = node.execute({})
    assert "Hạn mức phê duyệt" in res["context"]
    assert res["count"] > 0
