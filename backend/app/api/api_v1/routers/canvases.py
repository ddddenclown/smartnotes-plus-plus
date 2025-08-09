from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.canvas import CanvasCreate, Canvas, CanvasUpdate
from backend.app.services import storage

router = APIRouter()


@router.get("/", response_model=list[str])
async def list_canvases():
    """Получить список всех канвасов"""
    return storage.list_canvases()


@router.post("/", response_model=Canvas)
async def create_canvas(canvas: CanvasCreate):
    """Создать новый канвас"""
    return storage.create_canvas(canvas.name)


@router.get("/{canvas_id}", response_model=Canvas)
async def get_canvas(canvas_id: str):
    """Получить информацию о канвасе"""
    canvas = storage.get_canvas_meta(canvas_id)
    if not canvas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas not found"
        )
    return canvas


@router.delete("/{canvas_id}")
async def delete_canvas(canvas_id: str):
    """Удалить канвас"""
    success = storage.delete_canvas(canvas_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas not found"
        )
    return {"detail": "Canvas deleted"}
