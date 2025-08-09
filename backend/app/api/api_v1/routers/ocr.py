from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query
from pathlib import Path
from PIL import Image
import pytesseract
import uuid
import shutil
from pydantic import BaseModel

from backend.app.api.api_v1.deps import get_canvas_path
from backend.app.services.cache import file_cache


router = APIRouter()

allowed_types = ["image/png", "image/jpeg", "image/jpg"]

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


class OCRExistingRequest(BaseModel):
    file_path: str
    lang: str = "eng"


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


@router.post("/{canvas_id}/ocr-existing")
def ocr_existing_image(canvas_id: str, request: OCRExistingRequest):
    """OCR для существующего файла изображения"""
    canvas_dir = get_canvas_path(canvas_id)
    image_path = canvas_dir / request.file_path
    
    if not image_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image file not found"
        )
    
    # Проверяем кеш
    cached_text = file_cache.get_ocr_result(image_path, request.lang)
    if cached_text is not None:
        return {"text": cached_text, "from_cache": True}
    
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image, lang=request.lang)
        
        # Сохраняем в кеш
        file_cache.set_ocr_result(image_path, request.lang, text)
        
        # Сохраняем результат в файл
        transcripts_dir = canvas_dir / "transcripts"
        transcripts_dir.mkdir(parents=True, exist_ok=True)
        transcript_path = transcripts_dir / f"{image_path.stem}_ocr.txt"
        transcript_path.write_text(text, encoding="utf-8")
        
        return {"text": text, "from_cache": False}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"OCR error: {str(e)}"
        )
