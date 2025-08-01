from fastapi import APIRouter, UploadFile, File, HTTPException, status
from pathlib import Path
from uuid import uuid4

from backend.app.api.api_v1.deps import get_canvas_path


router = APIRouter()


def save_file(canvas_id: str, file: UploadFile, subdir: str, allowed_types: list[str]) -> str:
    if not any(file.content_type.startswith(t) for t in allowed_types):
        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Invalid file type: {file.content_type}"
        )

    canvas_dir = get_canvas_path(canvas_id)
    target_dir = canvas_dir / subdir
    target_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix
    filename = f"{uuid4().hex}{ext}"
    file_path = target_dir / filename

    with file_path.open("wb") as f:
        content = file.file.read()
        f.write(content)

    return f"{subdir}/{filename}"


@router.post("/{canvas_id}/upload/image")
async def upload_image(canvas_id: str, file: UploadFile = File(...)):
    file_path = save_file(canvas_id, file, "images", ["image/"])
    return {"file_path": file_path}


@router.post("/{canvas_id}/upload/audio")
async def upload_audio(canvas_id: str, file: UploadFile = File(...)):
    file_path = save_file(canvas_id, file, "audio", ["audio/"])
    return {"file_path": file_path}


@router.post("/{canvas_id}/upload/ocr-image")
async def upload_ocr_image(canvas_id: str, file: UploadFile = File(...)):
    file_path = save_file(canvas_id, file, "ocr", ["image/"])
    return {"file_path": file_path}