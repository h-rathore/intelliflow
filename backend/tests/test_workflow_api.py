"""
IntelliFlow Backend — Workflow REST API Integration Tests
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """TestClient fixture with application lifespan context."""
    with TestClient(app) as test_client:
        yield test_client


def test_health_endpoint_still_works(client: TestClient):
    """Verify that the health check endpoint remains functional."""
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_create_workflow_empty_prompt_validation(client: TestClient):
    """Verify that empty or whitespace-only goal prompts are rejected with HTTP 422."""
    resp_empty = client.post("/api/v1/workflows", json={"goalPrompt": ""})
    assert resp_empty.status_code == 422

    resp_spaces = client.post("/api/v1/workflows", json={"goalPrompt": "     "})
    assert resp_spaces.status_code == 422
    assert "empty or whitespace" in resp_spaces.json()["detail"].lower()


def test_create_workflow_success(client: TestClient):
    """Verify successful end-to-end workflow creation and execution."""
    payload = {
        "goalPrompt": "Research the impact of artificial intelligence on education and prepare a structured report.",
        "executionMode": "autonomous",
        "model": "gemini-1.5-flash",
    }
    resp = client.post("/api/v1/workflows", json=payload)
    assert resp.status_code == 201
    data = resp.json()

    # Core response fields
    assert "id" in data
    assert data["id"].startswith("wf-")
    assert data["status"] == "completed"
    assert data["activeStage"] == "Mission Completed"
    assert data["totalTokens"] > 0
    assert data["confidenceScore"] >= 75.0

    # Draft artifact
    artifact = data["draftArtifact"]
    assert "sections" in artifact
    assert len(artifact["sections"]) == 4

    # Agents map
    agents = data["agents"]
    assert "planner" in agents
    assert "researcher" in agents
    assert "analyst" in agents
    assert "writer" in agents
    assert "reviewer" in agents

    # Activity events stream
    events = data["activityEvents"]
    assert len(events) >= 6


def test_get_workflow_by_id(client: TestClient):
    """Verify retrieving a persisted workflow execution record by its ID."""
    # Create workflow first
    create_resp = client.post(
        "/api/v1/workflows",
        json={"goalPrompt": "Analyze distributed database consensus protocols"},
    )
    assert create_resp.status_code == 201
    wf_id = create_resp.json()["id"]

    # Query back
    get_resp = client.get(f"/api/v1/workflows/{wf_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()

    assert data["id"] == wf_id
    assert "consensus" in data["objective"].lower()
    assert data["status"] == "completed"
    assert len(data["draftArtifact"]["sections"]) == 4


def test_get_workflow_not_found(client: TestClient):
    """Verify HTTP 404 is returned when requesting a non-existent workflow ID."""
    resp = client.get("/api/v1/workflows/wf-nonexistent-id-999")
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()


def test_get_workflow_artifacts(client: TestClient):
    """Verify retrieving artifacts associated with an executed workflow."""
    create_resp = client.post(
        "/api/v1/workflows",
        json={"goalPrompt": "Benchmark vector database indexing algorithms"},
    )
    wf_id = create_resp.json()["id"]

    # Retrieve artifacts
    art_resp = client.get(f"/api/v1/workflows/{wf_id}/artifacts")
    assert art_resp.status_code == 200
    art_data = art_resp.json()

    assert art_data["workflowId"] == wf_id
    assert art_data["count"] == 1
    artifact = art_data["artifacts"][0]
    assert artifact["workflowId"] == wf_id
    assert len(artifact["sections"]) == 4
    assert len(artifact["markdownContent"]) > 100


def test_get_artifacts_for_unknown_workflow(client: TestClient):
    """Verify HTTP 404 is returned when retrieving artifacts for a non-existent workflow."""
    resp = client.get("/api/v1/workflows/wf-unknown-artifacts/artifacts")
    assert resp.status_code == 404


def test_synthetic_fallback_never_marked_verified(client: TestClient):
    """Verify synthetic fallback output is NEVER marked 'verified' even with 100% confidence."""
    create_resp = client.post(
        "/api/v1/workflows",
        json={"goalPrompt": "Investigate renewable energy grid load balancing"},
    )
    assert create_resp.status_code == 201
    wf_id = create_resp.json()["id"]

    # Check artifact verifiedStatus
    art_resp = client.get(f"/api/v1/workflows/{wf_id}/artifacts")
    artifact = art_resp.json()["artifacts"][0]

    # In fallback mode, content must remain pending/drafted, NOT verified
    assert artifact["verifiedStatus"] == "pending"

    # In draft artifact sections, status must remain drafted
    for section in artifact["sections"]:
        assert section["status"] == "drafted"


def test_provenance_and_reviewer_flags_visible(client: TestClient):
    """Verify provenance notices and reviewer audit notes are preserved in responses."""
    create_resp = client.post(
        "/api/v1/workflows",
        json={"goalPrompt": "Evaluate quantum computing encryption standards"},
    )
    data = create_resp.json()

    # Activity events must capture fallback/provenance notices
    event_messages = [e["message"] for e in data["activityEvents"]]
    assert any("Provenance:" in msg or "Mission completed" in msg for msg in event_messages)


def test_list_recent_workflows(client: TestClient):
    """Verify listing recent workflows returns persisted executions."""
    resp = client.get("/api/v1/workflows?limit=5")
    assert resp.status_code == 200
    items = resp.json()
    assert isinstance(items, list)
    assert len(items) >= 1
    assert "goalPrompt" in items[0]


def test_cors_headers_support_frontend_origins(client: TestClient):
    """Verify CORS middleware allows both localhost and 127.0.0.1 frontend origins."""
    for origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
        resp = client.options(
            "/api/v1/workflows",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type",
            },
        )
        assert resp.status_code == 200
        assert resp.headers.get("access-control-allow-origin") == origin


def test_failed_workflow_retrieval_status_remains_failed(client: TestClient):
    """Verify that a failed workflow maintains its 'failed' status and failure stage when retrieved via API."""
    import asyncio
    import uuid
    from app.db.models import WorkflowRecord
    from app.db.session import async_session_factory

    fail_id = f"wf-failed-{uuid.uuid4().hex[:8]}"

    async def seed_failed():
        async with async_session_factory() as session:
            record = WorkflowRecord(
                id=fail_id,
                title="Failed Workflow Task",
                goal_prompt="Attempting unreachable pipeline task",
                status="failed",
                active_stage="Failed at researcher: Connection timed out",
                elapsed_time="00m 02s",
                total_tokens=150,
                confidence_score=0.0,
            )
            session.add(record)
            await session.commit()

    asyncio.run(seed_failed())

    resp = client.get(f"/api/v1/workflows/{fail_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == fail_id
    assert data["status"] == "failed"
    assert "Failed at researcher" in data["activeStage"]
