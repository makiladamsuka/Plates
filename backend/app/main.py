import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.config import ALLOWED_ORIGINS, PORT
from app.routes.bills import router as bills_router
from app.routes.friends import router as friends_router
from app.routes.profiles import router as profiles_router
from app.routes.account import router as account_router

app = FastAPI(
    title="Plates API",
    description="FastAPI backend for Plates bill-splitting application",
    version="2.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https://.*\.plates\.live$|^https://.*\.herokuapp\.com$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(bills_router)
app.include_router(friends_router)
app.include_router(profiles_router)
app.include_router(account_router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "framework": "FastAPI (Python)"}

# Static file serving for frontend build (production / unified hosting)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
possible_dist_paths = [
    BASE_DIR / "frontend" / "dist",
    BASE_DIR / "dist",
    Path.cwd() / "frontend" / "dist",
    Path.cwd() / "dist"
]

frontend_dist_path = next((p for p in possible_dist_paths if p.exists()), None)
if frontend_dist_path:
    print(f"📦 Serving static frontend from: {frontend_dist_path}")
    # Mount assets folder if exists
    assets_path = frontend_dist_path / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_path)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Ignore API routes
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"error": "Endpoint not found"})
        
        file_path = frontend_dist_path / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        
        index_html = frontend_dist_path / "index.html"
        if index_html.exists():
            return FileResponse(index_html)
        
        return JSONResponse(status_code=404, content={"error": "Frontend build not found"})
