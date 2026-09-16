from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

from app.core.config import settings
from app.core.database import init_db
from app.api import (
    routes_targets,
    routes_scans,
    routes_reports,
    routes_comparison,
    routes_battery
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables
    await init_db()
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Cybersecurity Prompt Injection Testing & Evaluation Suite",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For hackathon/demo simplicity; configurable in settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Health Check Endpoint
@app.get("/api/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Include API Routers
app.include_router(routes_targets.router, prefix=settings.API_V1_STR)
app.include_router(routes_scans.router, prefix=settings.API_V1_STR)
app.include_router(routes_reports.router, prefix=settings.API_V1_STR)
app.include_router(routes_comparison.router, prefix=settings.API_V1_STR)
app.include_router(routes_battery.router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
