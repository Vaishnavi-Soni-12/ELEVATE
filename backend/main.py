"""
ELEVATE — Adaptive Elevator Intelligence
FastAPI Backend Application Entry Point
"""

import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api.routes import router

app = FastAPI(
    title="ELEVATE — Adaptive Elevator Intelligence API",
    description="Reinforcement Learning Lab & Multi-Elevator Control Backend",
    version="1.0.0",
)

# Enable CORS for local development with Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
async def root():
    return {
        "project": "ELEVATE",
        "title": "Adaptive Elevator Intelligence",
        "description": "Reinforcement Learning Laboratory for Adaptive Multi-Elevator Control",
        "status": "online",
        "docs": "/docs",
        "endpoints": [
            {"method": "GET",  "path": "/health",           "desc": "System health & algorithm status"},
            {"method": "POST", "path": "/api/configure",     "desc": "Configure building & auto-train RL"},
            {"method": "GET",  "path": "/api/state",         "desc": "Current laboratory & elevator states"},
            {"method": "GET",  "path": "/api/policy",        "desc": "Policy convergence & Bellman history"},
            {"method": "POST", "path": "/api/simulation",    "desc": "Control simulation (pause/resume/stop/reset)"},
            {"method": "POST", "path": "/api/call",          "desc": "Inject manual floor call"},
            {"method": "GET",  "path": "/api/audit",         "desc": "Decision audit trail"},
            {"method": "POST", "path": "/api/experiment",    "desc": "Benchmark comparison across algorithms"},
            {"method": "WS",   "path": "/ws/simulation",     "desc": "Real-time WebSocket simulation telemetry"}
        ]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
