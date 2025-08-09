from fastapi import APIRouter, Path, HTTPException, status
from typing import List
from pydantic import BaseModel

from backend.app.schemas.note import NoteCreate, Note
from backend.app.services import notes_storage

router = APIRouter()


class NotePositionUpdate(BaseModel):
    id: str
    x: float
    y: float


class BulkPositionUpdate(BaseModel):
    updates: List[NotePositionUpdate]


class NoteSizeUpdate(BaseModel):
    id: str
    width: float
    height: float


class BulkSizeUpdate(BaseModel):
    updates: List[NoteSizeUpdate]


@router.get("/", response_model=list[Note])
async def list_notes(canvas_id: str = Path(...)):
    return notes_storage.list_notes(canvas_id)


@router.post("/", response_model=Note)
async def create_note(canvas_id: str = Path(...), note: NoteCreate = None):
    return notes_storage.create_note(canvas_id, note)


@router.put("/{note_id}", response_model=Note)
async def update_note(canvas_id: str = Path(...), note_id: str = Path(...), note: NoteCreate = None):
    updated = notes_storage.update_note(canvas_id, note_id, note)
    if not updated:
        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail="Note not found")
    return updated


@router.delete("/{note_id}")
async def delete_note(canvas_id: str = Path(...), note_id: str = Path(...)):
    success = notes_storage.delete_note(canvas_id, note_id)
    if not success:
        raise HTTPException(
                            status_code=status.HTTP_404_NOT_FOUND,
                            detail="Note not found")
    return {"detail": "Note deleted"}


@router.patch("/positions", response_model=dict)
async def update_note_positions(canvas_id: str = Path(...), bulk_update: BulkPositionUpdate = None):
    """Обновить позиции нескольких заметок одновременно (для drag & drop)"""
    updated_count = notes_storage.update_note_positions(canvas_id, bulk_update.updates)
    if updated_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No notes found to update"
        )
    return {"detail": f"Updated {updated_count} note positions"}


@router.patch("/sizes", response_model=dict)
async def update_note_sizes(canvas_id: str = Path(...), bulk_update: BulkSizeUpdate = None):
    """Обновить размеры нескольких заметок одновременно"""
    updated_count = notes_storage.update_note_sizes(canvas_id, bulk_update.updates)
    if updated_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No notes found to update"
        )
    return {"detail": f"Updated {updated_count} note sizes"}
