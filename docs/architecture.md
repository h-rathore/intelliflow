# IntelliFlow — System Architecture

> **Status**: Draft · Foundation phase

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                     Client Browser                  │
│              Next.js 14 (App Router)                │
│            TypeScript · Tailwind CSS                │
└────────────────────┬────────────────────────────────┘
                     │  REST / HTTP
                     ▼
┌─────────────────────────────────────────────────────┐
│                  FastAPI Backend                     │
│               Python 3.11+ · Uvicorn                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  API v1  │  │  Core    │  │   Models         │  │
│  │ (routers)│  │ (config) │  │ (Pydantic schemas│  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

| Concept        | Detail                                              |
|----------------|-----------------------------------------------------|
| Framework      | Next.js 14 with App Router                         |
| Language       | TypeScript (strict mode)                           |
| Styling        | Tailwind CSS with component-level styles           |
| State          | React built-in hooks (expandable to Zustand/Jotai) |
| API Client     | Native `fetch` / future: tRPC or Axios             |

### Directory Conventions

```
src/
├── app/            # Next.js App Router — pages, layouts, loading states
├── components/     # Presentational + container components
│   ├── ui/         # Primitive UI elements (buttons, cards, etc.)
│   └── layout/     # Header, sidebar, footer
├── lib/            # Pure utility functions, constants
└── types/          # Shared TypeScript interface / type definitions
```

---

## Backend Architecture

| Concept        | Detail                                              |
|----------------|-----------------------------------------------------|
| Framework      | FastAPI                                            |
| Language       | Python 3.11+                                       |
| Server         | Uvicorn (ASGI)                                     |
| Validation     | Pydantic v2                                        |
| Linting        | Ruff                                               |

### Directory Conventions

```
app/
├── api/
│   └── v1/         # Versioned routers (health, ...)
├── core/           # Settings (pydantic-settings), logging config
├── models/         # Pydantic request / response schemas
└── main.py         # FastAPI app factory, middleware, router registration
```

---

## API Versioning

All public endpoints live under `/api/v1/`. Breaking changes will be introduced under `/api/v2/` while maintaining backward compatibility for a transition period.

---

## Future Considerations

- **Authentication** — OAuth2 / JWT via FastAPI's security utilities
- **Database** — PostgreSQL + SQLAlchemy (async)
- **AI Workflows** — LangGraph agent orchestration
- **Real-time** — WebSocket or SSE for live workflow status
- **Observability** — Structured logging, OpenTelemetry traces
