import os
import json
from datetime import datetime
import uuid
from backend.app.schemas.note import NoteCreate

BASE_PATH = "data/canvases"


def get_notes_path(canvas_id: str) -> str:
    return os.path.join(BASE_PATH, canvas_id, "notes.json")


def load_notes(canvas_id: str) -> list[dict]:
    path = get_notes_path(canvas_id)
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_notes(canvas_id: str, notes: list[dict]):
    path = get_notes_path(canvas_id)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(notes, f, ensure_ascii=False, indent=2)


def list_notes(canvas_id: str) -> list[dict]:
    return load_notes(canvas_id)


def create_note(canvas_id: str, note: NoteCreate) -> dict:
    notes = load_notes(canvas_id)
    note_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    note_dict = note.model_dump()
    note_dict.update({
        "id": note_id,
        "created_at": now,
        "updated_at": now,
    })

    notes.append(note_dict)
    save_notes(canvas_id, notes)
    return note_dict


def update_note(canvas_id: str, note_id: str, note: NoteCreate) -> dict | None:
    notes = load_notes(canvas_id)
    for i, n in enumerate(notes):
        if n["id"] == note_id:
            updated_note = note.model_dump()
            updated_note.update({
                "id": note_id,
                "created_at": n["created_at"],
                "updated_at": datetime.utcnow().isoformat(),
            })
            notes[i] = updated_note
            save_notes(canvas_id, notes)
            return updated_note
    return None


def delete_note(canvas_id: str, note_id: str) -> bool:
    notes = load_notes(canvas_id)
    new_notes = [n for n in notes if n["id"] != note_id]
    if len(new_notes) == len(notes):
        return False
    save_notes(canvas_id, new_notes)
    return True
