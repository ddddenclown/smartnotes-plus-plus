from fastapi import APIRouter, HTTPException, status
from pathlib import Path

from backend.app.api.api_v1.deps import get_canvas_path


router = APIRouter()

MEDIA_SUBFOLDERS = ["images", "audio", "ocr", "drawings", "transcripts"]


@router.get("/{canvas_id}/media")
def list_media(canvas_id: str):
    canvas_dir = get_canvas_path(canvas_id)
    if not canvas_dir.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Canvas not found"
        )

    media = {}

    for folder in MEDIA_SUBFOLDERS:
        path = canvas_dir / folder
        if not path.exists():
            media[folder] = []
            continue

        files = [
            f"{folder}/{file.name}"
            for file in path.iterdir()
            if file.is_file()
        ]
        media[folder] = files

    return media