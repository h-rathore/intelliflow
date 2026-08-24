<div align="center">

# 🧠 IntelliFlow

**An AI-powered workflow automation and intelligence platform.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg)](https://fastapi.tiangolo.com/)

</div>

---

## Overview

IntelliFlow is a modular, full-stack platform for building, orchestrating, and monitoring AI-driven workflows. It combines a modern **Next.js** frontend with a **FastAPI** backend, designed for extensibility and production-grade deployments.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14 · TypeScript · Tailwind CSS |
| Backend     | Python 3.11+ · FastAPI · Uvicorn  |
| Linting     | ESLint · Ruff · Pyright           |

---

## Project Structure

```
intelliflow/
├── frontend/          # Next.js 14 App Router (TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── app/           # Pages and layouts (App Router)
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # Utility helpers
│   │   └── types/         # Shared TypeScript types
│   └── public/            # Static assets
│
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/        # Versioned API routers
│   │   ├── core/          # Config, settings, logging
│   │   ├── models/        # Pydantic schemas
│   │   └── main.py        # Application entry point
│   ├── requirements.txt
│   └── .env.example
│
├── docs/              # Architecture and API documentation
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **Python** ≥ 3.11
- **npm** or **pnpm**

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> App available at [http://localhost:3000](http://localhost:3000)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate      # Linux / macOS
.venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --port 8000
```

> API available at [http://localhost:8000](http://localhost:8000)  
> Interactive docs at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Development

| Command                  | Description                      |
|--------------------------|----------------------------------|
| `npm run dev`            | Start Next.js dev server         |
| `npm run build`          | Build for production             |
| `npm run lint`           | Run ESLint                       |
| `uvicorn app.main:app --reload` | Start FastAPI dev server |
| `ruff check .`           | Lint Python code                 |
| `pytest`                 | Run backend tests                |

---

## Documentation

Extended documentation lives in the [`docs/`](docs/) folder:

- [`docs/architecture.md`](docs/architecture.md) — System architecture overview

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
