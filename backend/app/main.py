from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import chat, auth, life_coach_routes, code_lab_routes, study_routes, creator_routes, image_lab_routes, projects
import asyncio

app = FastAPI(
    title="MyTwin AI",
    description="Digital Twin Operating System – Unified API",
    version="18.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── المسارات العامة ──────────────────────────────────────────
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(projects.router)

# ── قدرات التوأم ─────────────────────────────────────────────
app.include_router(life_coach_routes.router)   # Life Coach
app.include_router(code_lab_routes.router)     # Code Lab / Engineering Brain
app.include_router(study_routes.router)        # ATHENA Study
app.include_router(creator_routes.router)      # Creative Studio
app.include_router(image_lab_routes.router)    # Image Lab / Creative Visual Studio

# ── الصحة ────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": "18.0.0",
        "capabilities": ["chat", "life_coach", "code_lab", "study", "creator", "image_lab", "projects"]
    }

# ── بدء المراقبين في الخلفية ─────────────────────────────────
@app.on_event("startup")
async def startup_event():
    try:
        from app.twin_state.preventive_scheduler import preventive_scheduler
        asyncio.create_task(preventive_scheduler.start())
    except Exception as e:
        print(f"Preventive scheduler not started: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
