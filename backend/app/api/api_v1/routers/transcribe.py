from fastapi import APIRouter, UploadFile, File, HTTPException, status, Query
from pathlib import Path
import shutil
import uuid
import json
from vosk import Model, KaldiRecognizer
import wave
import tempfile
import subprocess

from backend.app.api.api_v1.deps import get_canvas_path


router = APIRouter()


MODELS = {
    "en-us": "models_vosk/vosk-model-small-en-us-0.15",
    "ru-ru": "models_vosk/vosk-model-ru-0.10"
}

FFMPEG_PATH = r"C:\Users\Дмитрий\PycharmProjects\smartnotes-plus-plus\ffmpeg-7.1.1-essentials_build\bin\ffmpeg.exe"


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
