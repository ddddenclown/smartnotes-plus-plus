from fastapi import APIRouter

from backend.app.api.api_v1.routers import canvases, notes


api_router = APIRouter()


api_router.include_router(canvases.router, prefix="/canvases", tags=["canvases"])
api_router.include_router(notes.router, prefix="/canvases/{canvas_id}/notes", tags=["notes"])
