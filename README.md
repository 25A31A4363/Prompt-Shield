# 🛡️ PromptShield: AI Security & Prompt Injection Testing Suite

> **PromptShield** is an AI security auditing platform that tests AI applications against controlled prompt-injection attacks, analyzes responses using deterministic detection, identifies vulnerabilities with explainable evidence, and generates security reports with actionable remediation. Includes a zero-key sandbox and before/after security comparison.

---

## 🌟 Key Features

- **🎮 Zero-Key Sandbox Mode**: Run complete live security audits instantly without needing any third-party API keys (Mixed, Vulnerable, and Secure simulation modes).
- **🎯 Real-World Target Auditing**: Connect to OpenAI-compatible endpoints (OpenAI, Anthropic, Groq, Ollama, LocalAI, vLLM) or custom REST AI backends.
- **⚡ Controlled Attack Battery**: 14+ curated attack vectors spanning:
  - System Prompt Leakage & Extraction
  - Direct Instruction Override & Roleplay Hijacking
  - Context & Persona Switching
  - Canary Word / Secret Exfiltration
  - Delimiter & Encoding Manipulation (Base64, Hex, Leetspeak)
  - Indirect Prompt Injection & Multi-Turn Jailbreaks
- **🔍 Deterministic & Explainable Detection**: Dual-layer evaluator utilizing multi-pattern heuristic indicators, canary tracking, and semantic safety evaluation with full evidence strings.
- **📊 Standardized Security Score & Grading**: Industry-aligned scoring formula weighting severity levels (Low, Medium, High, Critical) with letter grades (A to F).
- **📈 Before/After Comparison Engine**: Compare security postures across model updates, system prompt revisions, or guardrail changes to measure remediation delta.
- **📡 Real-Time SSE Telemetry**: Live stream scan execution, probe progress, attack evidence, and live terminal logging via Server-Sent Events.
- **📑 Actionable Security Reports**: Comprehensive executive summary, vulnerability breakdowns, and copy-paste guardrail fixes with downloadable JSON exports.

---

## 🏗️ Architecture & Technology Stack

```
PromptShield/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── api/              # REST & SSE Endpoints
│   │   ├── core/             # Configuration & Database Engine
│   │   ├── data/             # Structured Attack Battery
│   │   ├── engine/           # Dispatcher, Evaluators, Sandbox & Scorer
│   │   ├── models/           # SQLAlchemy DB Models
│   │   └── schemas/          # Pydantic Schemas & DTOs
│   ├── tests/                # Automated Pytest Suite
│   └── main.py               # Application Entrypoint
├── frontend/                 # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # UI Components (Sidebar, Navbar, Gauges, Terminal)
│   │   ├── pages/            # Dashboard, Scans, Reports, Comparison, Targets
│   │   └── services/         # API & SSE Streaming Service
│   └── index.html
└── scripts/                  # One-Click PowerShell / Batch Launchers
    ├── run_backend.bat
    └── run_frontend.bat
```

### Stack Details
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite, Pydantic v2, HTTPX, SSE-Starlette
- **Testing**: Pytest & Pytest-Asyncio

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher & npm

---

### Option A: Using One-Click Scripts (Windows)
1. **Launch Backend**: Double-click `scripts/run_backend.bat`
2. **Launch Frontend**: Double-click `scripts/run_frontend.bat`
3. Open your browser at `http://localhost:5173`

---

### Option B: Manual Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be available at: `http://localhost:8000/docs`

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open web UI at: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run backend unit and integration tests:
```bash
cd backend
pytest -v
```

---

## 🛡️ Responsible Disclosure & Ethics

PromptShield is built exclusively for academic, research, cybersecurity auditing, and defensive evaluation purposes to help engineers harden LLM applications against unauthorized prompt injections and data leaks.

---

## 📄 License

MIT License. Copyright (c) 2026 Mohith Sripathi.
