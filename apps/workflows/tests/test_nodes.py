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


@pytest.mark.django_db
def test_rag_search_node_vector_similarity():
    from apps.workflows.models import DocumentChunk
    
    DocumentChunk.objects.all().delete()
    
    DocumentChunk.objects.create(
        document_name="doc1.pdf",
        text_content="Relevant Vector Match Content",
        embedding=[0.1] * 768
    )
    DocumentChunk.objects.create(
        document_name="doc2.pdf",
        text_content="Irrelevant Vector Match Content",
        embedding=[-0.1] * 768
    )
    
    node_cls = get_node_class("rag_search")
    node = node_cls(node_id="rag_test", config_data={"query": "Some query"})
    
    state_data = {
        "__env__": {
            "GEMINI_API_KEY": "test"
        }
    }
    res = node.execute(state_data)
    assert "Relevant Vector Match Content" in res["context"]
    assert "Irrelevant Vector Match Content" not in res["context"]
    assert res["count"] == 1


@pytest.mark.django_db
def test_rag_search_node_vector_similarity_failed_fallback(monkeypatch):
    from apps.workflows.models import DocumentChunk
    import requests
    
    DocumentChunk.objects.all().delete()
    
    DocumentChunk.objects.create(
        document_name="doc1.pdf",
        text_content="This is specialkeyword document content.",
        embedding=None
    )
    
    def mock_post(*args, **kwargs):
        raise requests.RequestException("API connection error")
        
    monkeypatch.setattr(requests, "post", mock_post)
    
    node_cls = get_node_class("rag_search")
    node = node_cls(node_id="rag_test", config_data={"query": "specialkeyword"})
    
    state_data = {
        "__env__": {
            "GEMINI_API_KEY": "real-key-with-failed-network"
        }
    }
    res = node.execute(state_data)
    
    assert "specialkeyword" in res["context"]
    assert res["count"] > 0


def test_llm_node_uses_env_key(monkeypatch):
    import apps.workflows.nodes.implementations as impl
    
    class MockGenai:
        def __init__(self):
            self.configured_key = None
        def configure(self, api_key):
            self.configured_key = api_key
        def GenerativeModel(self, *args, **kwargs):
            class MockModel:
                def generate_content(self, prompt):
                    class MockResponse:
                        text = "Mocked LLM response text"
                    return MockResponse()
            return MockModel()
            
    mock_genai = MockGenai()
    monkeypatch.setattr(impl, "genai", mock_genai)
    
    node_cls = get_node_class("llm")
    node = node_cls(node_id="llm_test", config_data={
        "provider": "gemini",
        "prompt": "Test Prompt"
    })
    
    state_data = {
        "__env__": {
            "GEMINI_API_KEY": "env-gemini-key"
        }
    }
    
    res = node.execute(state_data)
    assert mock_genai.configured_key == "env-gemini-key"
    assert res["text"] == "Mocked LLM response text"

    # Mock OpenAI
    class MockOpenAIClient:
        def __init__(self, api_key):
            self.api_key = api_key
            
        class Chat:
            class Completions:
                def create(self, **kwargs):
                    class MockChoice:
                        class MockMessage:
                            content = "OpenAI response content"
                        message = MockMessage()
                    class MockResponse:
                        choices = [MockChoice()]
                    return MockResponse()
            completions = Completions()
        chat = Chat()

    monkeypatch.setattr(impl, "OpenAI", MockOpenAIClient)
    
    node_openai = node_cls(node_id="llm_test_openai", config_data={
        "provider": "openai",
        "prompt": "Test Prompt"
    })
    
    state_data_openai = {
        "__env__": {
            "OPENAI_API_KEY": "env-openai-key"
        }
    }
    
    res_openai = node_openai.execute(state_data_openai)
    assert res_openai["text"] == "OpenAI response content"


def test_telegram_node_uses_env_key(monkeypatch):
    import requests
    
    posted_url = None
    def mock_post(url, *args, **kwargs):
        nonlocal posted_url
        posted_url = url
        class MockResponse:
            def raise_for_status(self):
                pass
        return MockResponse()
        
    monkeypatch.setattr(requests, "post", mock_post)
    
    node_cls = get_node_class("telegram_notify")
    node = node_cls(node_id="tg_test", config_data={
        "chat_id": "12345",
        "message": "Hello {__env__.TELEGRAM_BOT_TOKEN}"
    })
    
    state_data = {
        "__env__": {
            "TELEGRAM_BOT_TOKEN": "my-telegram-bot-token"
        }
    }
    
    node.execute(state_data)
    assert posted_url == "https://api.telegram.org/botmy-telegram-bot-token/sendMessage"
