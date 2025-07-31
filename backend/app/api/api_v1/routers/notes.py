from fastapi import APIRouter, Path, HTTPException, status

from backend.app.schemas.note import NoteCreate, Note
from backend.app.services import notes_storage

router = APIRouter()


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
