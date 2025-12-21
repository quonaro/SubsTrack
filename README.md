# SubsTrack

A Telegram Mini App (bot + web UI) to track & manage 💸 subscription expenses — simple, private, and always with you! 📱📊

## Project Structure

```
SubsTrack/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Core configuration
│   │   └── main.py   # Application entry point
│   └── pyproject.toml
└── frontend/         # Vue 3 frontend
    ├── src/
    │   ├── components/
    │   ├── views/
    │   └── main.js
    └── package.json
```

## Prerequisites

- Python 3.10+ (for backend)
- Node.js 18+ and npm (for frontend)
- [uv](https://github.com/astral-sh/uv) package manager (for backend)

## Backend Setup (FastAPI)

The backend uses `uv` for dependency management.

1. Install uv (if not already installed):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

2. Navigate to backend directory:
```bash
cd backend
```

3. Install dependencies with uv:
```bash
uv sync
```

4. Run the development server:
```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

## Frontend Setup (Vue 3)

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Development

### Running Both Services

You can run both services simultaneously:

**Terminal 1 (Backend):**
```bash
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Building for Production

**Backend:**
```bash
cd backend
uv build
```

**Frontend:**
```bash
cd frontend
npm run build
```

## Environment Variables

Create `.env` files in respective directories if needed:

- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration

## License

[Add your license here]
