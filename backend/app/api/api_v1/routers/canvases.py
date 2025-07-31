from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.canvas import CanvasCreate, Canvas
from backend.app.services import storage


router = APIRouter()


@router.get("/", response_model=list[Canvas])
async def list_canvases():
    canvas_ids = storage.list_canvases()
    result = []
    for cid in canvas_ids:
        meta = storage.get_canvas_meta(cid)
        if meta:
            result.append(meta)
    return result


@router.post("/", response_model=Canvas)
async def create_canvas(canvas: CanvasCreate):
    meta = storage.create_canvas(canvas.name)
    return meta


@router.delete("/{canvas_id}")
async def delete_canvas(canvas_id: str):
    success = storage.delete_canvas(canvas_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas not found"
        )
    return {"detail": "canvas deleted"}
