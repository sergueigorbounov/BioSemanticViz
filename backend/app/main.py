from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .api.routes import router as api_router

# Create FastAPI app
app = FastAPI(
    title="BioSemanticViz API",
    description="API for biological data visualization and semantic reasoning",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Mount static files if available
examples_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "examples")
if os.path.exists(examples_dir):
    app.mount("/examples", StaticFiles(directory=examples_dir), name="examples")

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to BioSemanticViz API",
        "documentation": "/docs",
        "version": "0.1.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 