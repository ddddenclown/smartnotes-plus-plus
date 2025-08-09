from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query
from pathlib import Path
import shutil
import uuid
import json
from vosk import Model, KaldiRecognizer
import wave
import tempfile
import subprocess
from pydantic import BaseModel

from backend.app.api.api_v1.deps import get_canvas_path
from backend.app.services.cache import file_cache


router = APIRouter()


MODELS = {
    "en-us": "models_vosk/vosk-model-small-en-us-0.15",
    "ru-ru": "models_vosk/vosk-model-ru-0.10"
}

FFMPEG_PATH = r"C:\Users\Дмитрий\PycharmProjects\smartnotes-plus-plus\ffmpeg-7.1.1-essentials_build\bin\ffmpeg.exe"


class TranscribeExistingRequest(BaseModel):
    file_path: str
    lang: str = "en-us"


def convert_to_wav(input_path: Path, output_path: Path):
    command = [
        FFMPEG_PATH,
        "-y",
        "-i", str(input_path),
        "-ac", "1",
        "-ar", "16000",
        "-sample_fmt", "s16",
        str(output_path)
    ]
    result = subprocess.run(command, capture_output=True)
    if result.returncode != 0:
        raise Exception(f"ffmpeg error: {result.stderr.decode()}")


@router.post("/{canvas_id}/transcribe")
async def transcribe_audio(
        canvas_id: str,
        file: UploadFile = File(...),
        lang: str = Query("en-us", description="Язык модели: 'en-us' или 'ru-ru'")
):
    if not file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only audio files are allowed"
        )

    if lang not in MODELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported language"
        )

    canvas_dir = get_canvas_path(canvas_id)
    audio_dir = canvas_dir / "audio"
    transcripts_dir = canvas_dir / "transcripts"
    audio_dir.mkdir(parents=True, exist_ok=True)
    transcripts_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename).suffix if file.filename else ".tmp"
    temp_input = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    temp_input.write(await file.read())
    temp_input.flush()
    temp_input.close()

    audio_filename = f"{uuid.uuid4().hex}.wav"
    audio_path = audio_dir / audio_filename

    try:
        convert_to_wav(Path(temp_input.name), audio_path)
    except Exception as e:
        Path(temp_input.name).unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio conversion error: {e}"
        )

    Path(temp_input.name).unlink(missing_ok=True)

    try:
        wf = wave.open(str(audio_path), "rb")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid audio file after conversion"
        )

    try:
        model_path = MODELS[lang]
        model = Model(model_path)
        rec = KaldiRecognizer(model, wf.getframerate())
        result_text = ""

        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                result_text += res.get("text", "") + " "
        final_res = json.loads(rec.FinalResult())
        result_text += final_res.get("text", "")

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech recognition error: {e}"
        )

    transcript_path = transcripts_dir / f"{audio_filename}.txt"
    transcript_path.write_text(result_text.strip(), encoding="utf-8")

    return {"transcript": result_text.strip()}


@router.post("/{canvas_id}/transcribe-existing")
async def transcribe_existing_audio(canvas_id: str, request: TranscribeExistingRequest):
    """Транскрипция для существующего аудио файла"""
    if request.lang not in MODELS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported language"
        )

    canvas_dir = get_canvas_path(canvas_id)
    audio_path = canvas_dir / request.file_path
    
    if not audio_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio file not found"
        )

    # Проверяем кеш
    cached_transcript = file_cache.get_transcript_result(audio_path, request.lang)
    if cached_transcript is not None:
        return {"transcript": cached_transcript, "from_cache": True}

    transcripts_dir = canvas_dir / "transcripts"
    transcripts_dir.mkdir(parents=True, exist_ok=True)

    # Конвертируем в WAV если нужно
    if audio_path.suffix.lower() != '.wav':
        wav_path = transcripts_dir / f"{audio_path.stem}_temp.wav"
        try:
            convert_to_wav(audio_path, wav_path)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Audio conversion error: {e}"
            )
    else:
        wav_path = audio_path

    try:
        wf = wave.open(str(wav_path), "rb")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid audio file"
        )

    try:
        model_path = MODELS[request.lang]
        model = Model(model_path)
        rec = KaldiRecognizer(model, wf.getframerate())
        result_text = ""

        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                result_text += res.get("text", "") + " "
        final_res = json.loads(rec.FinalResult())
        result_text += final_res.get("text", "")

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech recognition error: {e}"
        )
    finally:
        wf.close()
        # Удаляем временный файл если создавали
        if wav_path != audio_path and wav_path.exists():
            wav_path.unlink()

    result_text = result_text.strip()
    
    # Сохраняем в кеш
    file_cache.set_transcript_result(audio_path, request.lang, result_text)

    # Сохраняем транскрипт в файл
    transcript_path = transcripts_dir / f"{audio_path.stem}_transcript.txt"
    transcript_path.write_text(result_text, encoding="utf-8")

    return {"transcript": result_text, "from_cache": False}
