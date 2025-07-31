import os
import json
from datetime import datetime
import uuid


BASE_PATH = "data/canvases"


def list_canvases():
    if not os.path.exists(BASE_PATH):
        return []
    return [name for name in os.listdir(BASE_PATH) if os.path.isdir(os.path.join(BASE_PATH, name))]


def create_canvas(name: str):
    canvas_id = str(uuid.uuid4())
    path = os.path.join(BASE_PATH, canvas_id)
    os.makedirs(path, exist_ok=False)


    notes_path = os.path.join(path, "notes.json")
    with open(notes_path, "w", encoding="utf-8") as f:
        json.dump([], f)


    for folder in ["images", "audio", "drawings", "ocr", "transcripts"]:
        os.makedirs(os.path.join(path, folder), exist_ok=True)

    meta = {
        "id": canvas_id,
        "name": name,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    with open(os.path.join(path, "meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f)

    return meta


def delete_canvas(canvas_id: str):
    import shutil
    path = os.path.join(BASE_PATH, canvas_id)
    if os.path.exists(path):
        shutil.rmtree(path)
        return True
    return False


def get_canvas_meta(canvas_id: str):
    path = os.path.join(BASE_PATH, canvas_id, "meta.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None
