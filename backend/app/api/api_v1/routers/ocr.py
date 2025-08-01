from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query
from pathlib import Path
from PIL import Image
import pytesseract
import uuid
import shutil

from backend.app.api.api_v1.deps import get_canvas_path


router = APIRouter()

allowed_types = ["image/png", "image/jpeg", "image/jpg"]

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


@router.post("/{canvas_id}/ocr")
def ocr_image(
    canvas_id: str,
    file: UploadFile = File(...),
    lang: str = Query("eng", description="Язык для OCR, например 'eng' или 'rus' или 'eng+rus'")
):
    if file.content_type not in ["image/png", "image/jpeg", "image/jpg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type"
        )

    canvas_dir = get_canvas_path(canvas_id)
    ocr_dir = canvas_dir / "ocr"
    transcripts_dir = canvas_dir / "transcripts"
    ocr_dir.mkdir(parents=True, exist_ok=True)
    transcripts_dir.mkdir(parents=True, exist_ok=True)

    image_id = f"{uuid.uuid4().hex}.png"
    image_path = ocr_dir / image_id

    with image_path.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang=lang)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

    transcript_path = transcripts_dir / f"{image_id}.txt"
    transcript_path.write_text(text, encoding="utf-8")

    return {"text": text}
