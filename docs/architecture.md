# IntelliFlow — System Architecture & Design Specification

> **Platform Version:** 0.1.0
> **Engineering Phase:** Verified Mid-Term Implementation Checkpoint
> **Repository:** `https://github.com/h-rathore/intelliflow`

---

## 1. Architectural Philosophy & Design Principles

IntelliFlow is designed to bridge the gap between experimental single-turn LLM prompts and deterministic, verifiable multi-agent workflows. The system adheres to four foundational engineering principles:

1. **Separation of Concerns:**
   Agent decision logic, LLM inference providers, orchestration scheduling, state persistence, and client presentation are decoupled into discrete layers. Agents never directly call SQLite or manage HTTP connections; the orchestration engine mediates all state and persistence.
2. **Deterministic Offline Baselines & Fault Isolation:**
   Cloud LLM providers are susceptible to rate limits, network outages, and token quota exhaustion. IntelliFlow implements a dual-mode LLM abstraction (`DeterministicFallbackEngine` alongside `GeminiLLMClient`). If an API key is missing or an upstream request fails, the engine gracefully falls back to deterministic, offline execution with zero pipeline crashes.
3. **Auditable Relational Persistence:**
   Transient agent thoughts and intermediate findings are systematically persisted to an asynchronous SQLite relational store (`WorkflowRecord` and `ArtifactRecord`). Every run can be inspected, reloaded, or audited by workflow ID.
4. **Truthful Evidence Certification:**
   Synthetic fallback generation is clearly differentiated from verified external fact-checking. When running in offline or draft mode, generated artifacts are tagged as `"drafted"` and flagged with `"Draft Unverified"` in the user interface. Verification certification (`"Execution Certified"`) is strictly reserved for artifacts where every section has passed authentic, external fact auditing.

---

## 2. High-Level System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Presentation Layer (Next.js 16 + React 19)"]
        UI["CommandWorkspace UI"]
        Hook["useWorkflowRunner Hook"]
        APIClient["Typed API Client (src/lib/api.ts)"]
        Canvas["Workflow Canvas (5 Agents)"]
        Feed["Activity Feed & Telemetry"]
        Viewer["Artifact Viewer & Truth Badge"]
        UI --> Hook
        Hook --> APIClient
        Hook --> Canvas
        Hook --> Feed
        Hook --> Viewer
    end

    subgraph APILayer ["API Gateway Layer (FastAPI 0.111)"]
        CORS["CORS Middleware (localhost:3000 & 127.0.0.1:3000)"]
        Router["Workflows Router (/api/v1/workflows)"]
        Schemas["Pydantic v2 Schemas (to_camel aliasing)"]
        CORS --> Router
        Router --> Schemas
    end

    subgraph CoreLayer ["Orchestration Engine Layer (app/orchestration)"]
        Engine["WorkflowEngine"]
        TimeoutGuard["Timeout Guard (asyncio.wait_for)"]
        TraceLogger["Trace & Token Accumulator"]
        Engine --> TimeoutGuard
        Engine --> TraceLogger
    end

    subgraph AgentLayer ["Specialized Multi-Agent Workforce"]
        A1["Architect (PlannerAgent)"]
        A2["Explorer (ResearcherAgent)"]
        A3["Quant (AnalystAgent)"]
        A4["Scribe (WriterAgent)"]
        A5["Validator (ReviewerAgent)"]
        A1 --> A2 --> A3 --> A4 --> A5
    end

    subgraph LLMLayer ["LLM Provider Boundary (app/services/llm)"]
        BaseLLM["BaseLLMClient Interface"]
        FallbackEngine["DeterministicFallbackEngine (mock_fallback)"]
        GeminiClient["GeminiLLMClient (gemini-1.5-flash)"]
        BaseLLM --> FallbackEngine
        BaseLLM --> GeminiClient
    end

    subgraph PersistenceLayer ["Persistence Layer: SQLite (app/db)"]
        AsyncEngine["SQLAlchemy 2.0 AsyncEngine (aiosqlite)"]
        WfTable[("workflows Table")]
        ArtTable[("artifacts Table (1:1 Cascade)")]
        AsyncEngine --> WfTable
        AsyncEngine --> ArtTable
    end

    APIClient -- "POST /api/v1/workflows (JSON)" --> CORS
    Schemas --> Engine
    Engine --> AgentLayer
    AgentLayer --> BaseLLM
    Engine --> AsyncEngine
    Engine -- "WorkflowStatusResponse (camelCase)" --> APIClient
```

---

## 3. Component Deep Dive

### 3.1 Client Presentation Layer (`frontend/`)

- **Framework:** Next.js 16.3.1 (Turbopack) with React 19 and TypeScript in strict mode.
- **Styling:** Tailwind CSS with atomic utility classes and dynamic status color tokens.
- **`src/lib/api.ts`:** Typed HTTP client utilizing native `fetch`. Implements:
  - `createWorkflow(goalPrompt: string)`: Submits execution requests to `POST /api/v1/workflows`.
  - `getWorkflow(id: string)`: Retrieves state from `GET /api/v1/workflows/{id}`.
  - `getWorkflowArtifacts(id: string)`: Fetches full markdown from `GET /api/v1/workflows/{id}/artifacts`.
  - `listRecentWorkflows(limit?: number)`: Queries recent execution history.
- **`src/lib/useWorkflowRunner.ts`:** React state management hook orchestrating:
  - Input validation (rejects empty or whitespace-only submissions before network dispatch).
  - Network state dispatch and loading state propagation.
  - Staggered presentation transitions (~400ms per agent) so evaluators observe the visual progression from Planner through Reviewer.
  - Dynamic telemetry mapping: token counts, wall-clock elapsed time, and confidence scoring.
- **`src/components/command/CommandWorkspace.tsx`:** Primary operator console containing:
  - Natural language goal input and starter enterprise templates.
  - Dual-mode verification badge logic:
    ```typescript
    const isArtifactVerified =
      (taskContext.draftArtifact?.sections?.length ?? 0) > 0 &&
      taskContext.draftArtifact?.sections?.every((s) => s.status === 'verified');
    ```
    - Renders `"Execution Completed — Draft Unverified"` (`warning` amber badge) when sections are in fallback or unverified draft state.
    - Renders `"Execution Certified"` (`success` emerald badge) strictly when all sections are verified.

### 3.2 API Gateway Layer (`backend/app/api/`)

- **Framework:** FastAPI 0.111 running on Uvicorn ASGI.
- **Lifespan Management (`app/main.py`):**
  - Initializes database schema idempotently (`await init_db()`) during application startup.
  - Configures structured logging.
  - Gracefully disposes connection pools upon server shutdown (`await engine.dispose()`).
- **CORS Configuration:**
  - Whitelists both `http://localhost:3000` and `http://127.0.0.1:3000` to prevent cross-origin preflight rejections.
- **Serialization & Schema Mapping:**
  - Pydantic v2 models with `alias_generator=to_camel` and `populate_by_name=True`.
  - Eliminates manual field translation between backend Python snake_case and frontend TypeScript camelCase.

### 3.3 Orchestration Engine Layer (`backend/app/orchestration/`)

- **`WorkflowEngine` (`engine.py`):**
  - Manages sequential pipeline execution across the 5 specialized agents.
  - Enforces execution timeout via `asyncio.wait_for(..., timeout=timeout_seconds)` (default: 60s).
  - Tracks monotonic wall-clock duration via `time.perf_counter()`.
  - Dynamically updates agent states (`waiting` → `working` → `completed` or `failed`).
  - Records granular, timestamped `ActivityEvent` records for the UI activity feed.
  - Accumulates total token counts across all agent execution stages.
  - Handles agent failure isolation: if any agent fails, the pipeline halts gracefully, persists the partial failure trace, and returns a structured failure response rather than crashing the server.

---

## 4. Multi-Agent Pipeline & Data Flow

The five agents operate as a sequential dependency chain where each agent enriches the shared execution context:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Operator
    participant UI as Next.js Workspace
    participant API as FastAPI Router
    participant Engine as WorkflowEngine
    participant P as Planner (PL-01)
    participant R as Researcher (RS-02)
    participant A as Analyst (AN-03)
    participant W as Writer (WR-04)
    participant RV as Reviewer (RV-05)
    participant DB as SQLite Persistence

    User->>UI: Enter prompt & submit
    UI->>API: POST /api/v1/workflows { goalPrompt }
    API->>Engine: engine.run(clean_goal, persist=True)

    activate Engine
    Note over Engine,P: Stage 1: Intent & Task Decomposition
    Engine->>P: execute({ goal_prompt })
    P-->>Engine: plan_data (DAG subtasks, execution stages)

    Note over Engine,R: Stage 2: Domain Evidence & Context Ingestion
    Engine->>R: execute({ goal_prompt, plan_data })
    R-->>Engine: research_data (domain context, evidence baselines)

    Note over Engine,A: Stage 3: Quantitative & Comparative Benchmarking
    Engine->>A: execute({ goal_prompt, plan_data, research_data })
    A-->>Engine: analysis_data (metrics, comparative matrix)

    Note over Engine,W: Stage 4: Synthesis & Section Compilation
    Engine->>W: execute({ goal_prompt, plan_data, research_data, analysis_data })
    W-->>Engine: writer_data (title, 4 report sections, full markdown)

    Note over Engine,RV: Stage 5: Verification & Fact Audit
    Engine->>RV: execute({ goal_prompt, report_text, writer_data })
    RV-->>Engine: reviewer_data (objective checks, confidence, verified_sections)

    Engine->>DB: Persist WorkflowRecord + ArtifactRecord (1:1)
    DB-->>Engine: Commit OK
    Engine-->>API: Return WorkflowStatusResponse
    deactivate Engine

    API-->>UI: HTTP 201 Created (JSON)
    UI->>User: Render real-time completed workforce & truthful draft badge
```

### Agent Specification Matrix

| Agent | Codename | Role | Input Contract | Output Payload |
| :--- | :--- | :--- | :--- | :--- |
| **Planner** | `PL-01` | `planner` | `{"goal_prompt": str}` | Subtask DAG, target stages, execution priority |
| **Researcher** | `RS-02` | `researcher` | `{"goal_prompt": str, "plan_data": dict}` | Domain literature, reference baselines, key entities |
| **Analyst** | `AN-03` | `analyst` | `{"goal_prompt": str, "plan_data": dict, "research_data": dict}` | Quantitative indicators, comparative capability matrix |
| **Writer** | `WR-04` | `writer` | `{"goal_prompt": str, "plan_data": dict, "research_data": dict, "analysis_data": dict}` | 4 report sections, title, full markdown compilation |
| **Reviewer** | `RV-05` | `reviewer` | `{"goal_prompt": str, "report_text": str, "writer_data": dict}` | Objective checks (completeness, format, provenance), confidence score (0–100%), verified sections |

---

## 5. Persistence Layer & Entity-Relationship Schema

The database layer utilizes **SQLAlchemy 2.0 Async** coupled with **`aiosqlite`**. Table structures are defined in `backend/app/db/models.py`.

```mermaid
erDiagram
    WORKFLOWS ||--|| ARTIFACTS : "generates (1:1 cascade)"

    WORKFLOWS {
        string id PK "Unique workflow UUID (wf-xxxx)"
        string title "Descriptive workflow title"
        string goal_prompt "Original user prompt"
        string status "completed | failed | in_progress | paused | idle"
        string active_stage "Current or final stage description"
        string elapsed_time "Formatted wall-clock duration (00m 00s)"
        integer total_tokens "Sum of tokens consumed across all agents"
        float confidence_score "Reviewer-audited confidence percentage"
        json execution_trace_json "Granular per-agent timing & tokens"
        json agents_state_json "Snapshot of all 5 agent states"
        json activity_events_json "Timestamped event stream for UI"
        datetime created_at "UTC creation timestamp"
        datetime updated_at "UTC update timestamp"
    }

    ARTIFACTS {
        string id PK "Unique artifact UUID (art-xxxx)"
        string workflow_id FK "Foreign key -> workflows.id (UNIQUE, ON DELETE CASCADE)"
        string title "Artifact document title"
        json sections_json "Structured list of TaskSection objects"
        text markdown_content "Full compiled GitHub Flavored Markdown"
        string verified_status "verified | pending | flagged"
        datetime created_at "UTC creation timestamp"
        datetime updated_at "UTC update timestamp"
    }
```

### Relational Invariants
1. **1:1 Strict Cascade Relationship:** Every `ArtifactRecord` is tied to a single `WorkflowRecord` via `workflow_id (unique=True)`. Deleting a workflow automatically cascades to its associated artifact.
2. **JSON Snapshotting:** To eliminate complex joins during real-time UI polling, agent snapshots and activity feeds are serialized as structured JSON directly within the `WorkflowRecord`.
3. **Idempotent Initialization:** The `init_db()` function executes `create_all()` asynchronously on startup, ensuring local development databases are provisioned automatically without manual migration scripts.

---

## 6. LLM Provider Layer & Fallback Engine

```mermaid
flowchart TD
    Agent["Specialized Agent (e.g. WriterAgent)"] --> Call["await self.llm_client.generate(...)"]
    Call --> Client{"GeminiLLMClient"}

    Client -- "USE_MOCK_FALLBACK == True OR Missing API Key" --> Fallback["DeterministicFallbackEngine"]
    Client -- "Valid API Key Provided" --> APIReq["Google Gemini API (gemini-1.5-flash)"]

    APIReq -- "Success" --> LiveResp["LLMResponse (is_fallback=False, provenance='gemini_api')"]
    APIReq -- "Quota / Rate Limit / Timeout" --> Failover["Failover Catch Handler"]
    Failover --> Fallback

    Fallback --> FallbackResp["LLMResponse (is_fallback=True, provenance='mock_fallback')"]

    LiveResp --> Agent
    FallbackResp --> Agent
```

### Key Provider Attributes
- **Zero-Dependency Fallback:** Generates syntactically valid, deterministic markdown sections with realistic structure, headings, and quantitative comparison tables.
- **Provenance Transparency:** Every `LLMResponse` contains explicit `is_fallback: bool` and `provenance: str` metadata. The reviewer agent inspects this metadata to ensure synthetic content is never certified as externally verified evidence.
- **Failover Safety:** If an active Gemini API call fails due to rate-limiting (`HTTP 429`) or quota exhaustion, `GeminiLLMClient` catches the exception and transparently delegates to `DeterministicFallbackEngine`, preventing user-facing 500 errors.

---

## 7. Performance Benchmarking & Evaluation Methodology

The benchmarking subsystem (`backend/app/benchmarks/runner.py`) provides reproducible quantitative measurement:

1. **Monotonic Wall-Clock Measurement:** Uses Python's `time.perf_counter()` to capture sub-millisecond execution times without susceptibility to system clock adjustments.
2. **Statistical Aggregation:** Computes mean, median, min, max, and P95 latencies (via linear interpolation) across multiple prompt iterations.
3. **Zero Secret Leaking:** Inspects and sanitizes all exported configuration fields, masking API keys and passwords.
4. **Isolated Database Persistence:** Benchmarks execute with `persist=False` by default to prevent benchmark runs from polluting the active development database.

### Benchmark Results (Deterministic Fallback Mode)
- **Runs:** 8 iterations across 4 enterprise workflow prompts.
- **Success Rate:** 100.0% (8 completed, 0 failed).
- **Latency Distribution:**
  - Mean: `0.0006s` (0.60ms)
  - Median: `0.0005s` (0.50ms)
  - Min: `0.0004s` (0.40ms)
  - Max: `0.0014s` (1.40ms)
  - P95: `0.0011s` (1.10ms)
- **Token Summation:** 11,872 tokens (mean 1,484 tokens/run).

---

## 8. Failure Recovery & Resilience Patterns

| Failure Scenario | Mitigation Mechanism | System Outcome |
| :--- | :--- | :--- |
| **Empty or Whitespace Goal** | Pre-validation in `api/v1/workflows.py` | Returns `HTTP 422 Unprocessable Entity`; zero backend resources wasted. |
| **Pipeline Stage Timeout** | `asyncio.wait_for(timeout=60.0)` in `engine.py` | Pipeline halts safely; marks workflow as `failed`; persists partial trace to SQLite; returns structured failure response. |
| **Agent Execution Exception** | Individual `try/except` in `_execute_pipeline` | State mapped to `AgentState.FAILED`; activity feed records failure event; downstream agents halted. |
| **Gemini API Outage / Rate Limit** | Try/catch in `GeminiLLMClient.generate` | Graceful fallback to `DeterministicFallbackEngine`; provenance flagged as synthetic; workflow succeeds. |
| **Database Transaction Failure** | `async with session.begin():` context manager | Atomic rollback on error; prevents dangling orphaned workflow records. |
| **Client Disconnect** | Asynchronous task execution on FastAPI | Workflow completes in background; persistent record available on reconnect via ID lookup. |

---

## 9. Security & Production Considerations

1. **Sanitized Configuration:** `.env.example` contains zero secrets. Live credentials are never committed to version control.
2. **Input Sanitization:** Strips leading/trailing whitespace and limits title lengths to prevent buffer saturation.
3. **CORS Isolation:** Development origins are restricted explicitly to frontend dev ports (`http://localhost:3000` and `http://127.0.0.1:3000`). Wildcard `*` origins are avoided.
4. **SQL Injection Prevention:** Uses SQLAlchemy 2.0 parameterized queries exclusively (`select(WorkflowRecord).where(...)`), completely eliminating raw SQL formatting vulnerabilities.
