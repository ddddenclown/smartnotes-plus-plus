from fastapi import APIRouter

from backend.app.api.api_v1.routers import canvases, notes, upload, media, ocr, transcribe


api_router = APIRouter()


api_router.include_router(canvases.router, prefix="/canvases", tags=["canvases"])

api_router.include_router(notes.router, prefix="/canvases/{canvas_id}/notes", tags=["notes"])
api_router.include_router(upload.router, prefix="/canvases", tags=["upload"])
api_router.include_router(media.router, prefix="/canvases", tags=["Media"])
api_router.include_router(ocr.router, prefix="/canvases", tags=["OCR"])
api_router.include_router(transcribe.router, prefix="/canvases", tags=["Transcribe"])
