# BillFight — Autonomous Bill Negotiation Agent

An agentic AI system that autonomously researches competitor pricing, builds a negotiation strategy, drafts emails, and conducts multi-turn negotiations to lower your bills — all powered by Claude.

## What it does

1. **Parse** — Upload a bill (PDF or TXT). Claude extracts provider, amount, tenure, contract status.
2. **Research** — Claude uses web search to find live competitor pricing and current promotions.
3. **Strategize** — Claude identifies your leverage points and sets target price + walk-away threshold.
4. **Draft** — Claude writes a grounded negotiation email citing specific competitor prices.
5. **Negotiate** — Paste the company's reply. Claude interprets it, decides to accept/counter/escalate, and drafts the next move.
6. **Dashboard** — Full audit trail of every decision and why the agent made it.

## Architecture

```
frontend (React + Vite)
    ↕ REST API
backend (FastAPI + Python)
    ├── bills router       — PDF upload, Claude parsing
    ├── agent router       — pipeline orchestration
    ├── negotiations router — state + history queries
    └── agent_service.py  — all Claude API calls
        ├── parse_bill()           — structured extraction
        ├── research_competitors() — web search tool
        ├── build_strategy()       — reasoning engine
        ├── draft_negotiation_email() — email generation
        ├── interpret_response()   — reply classification
        └── generate_final_summary() — outcome report
```

## Tech stack

- **Backend**: Python, FastAPI, aiosqlite, pypdf
- **Frontend**: React 18, Vite
- **AI**: Anthropic Claude claude-sonnet-4-20250514 with web search tool
- **Database**: SQLite (easily swappable to PostgreSQL)

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- Anthropic API key

### Run

```bash
# 1. Set your API key
export ANTHROPIC_API_KEY=your_key_here

# 2. Backend
cd backend
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
# Opens http://localhost:5173
```

## Demo walkthrough

1. Open http://localhost:5173
2. Click **Upload bill** 
3. Upload `sample_bill.txt` (included) or your own bill PDF
4. Click **Launch negotiation agent**
5. Watch the agent research → strategize → draft in real time
6. When status shows **Awaiting reply**, paste a simulated company response:
   - `"The best we can offer is $149.99/month"`
   - `"We can provide a loyalty discount bringing your bill to $130/month"`
   - `"Unfortunately our pricing is fixed and we cannot offer discounts"`
7. Agent interprets the reply, decides next move, drafts counter if needed

## Interview talking points

- **Agentic loop design**: stateful multi-step pipeline with async reply monitoring
- **Grounded reasoning**: agent's strategy is backed by live web-searched data, not hallucination
- **Decision logic**: explicit accept/counter/escalate logic with confidence scoring
- **Async state management**: Celery-ready architecture, SQLite state persistence
- **Audit trail**: every agent decision logged with reasoning for full transparency
- **Claude tool use**: web_search tool for live competitor research

## Extending this

- Add Gmail API integration to send/receive emails autonomously
- Add Celery + Redis for true async background processing  
- Add user auth (JWT) for multi-user support
- Deploy to AWS EC2 + RDS PostgreSQL
- Add ML model to predict negotiation success probability
- Support multiple bills in parallel
