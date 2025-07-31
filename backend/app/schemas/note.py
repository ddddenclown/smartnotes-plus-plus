from typing import Literal, Union, Optional, List
from pydantic import BaseModel
from datetime import datetime


class BaseNoteFields(BaseModel):
    x: float
    y: float
    tags: Optional[List[str]] = []


class TextNoteCreate(BaseNoteFields):
    type: Literal["text"]
    title: str
    content: str


class TextNote(TextNoteCreate):
    id: str
    created_at: datetime
    updated_at: datetime


class ImageNoteCreate(BaseNoteFields):
    type: Literal["image"]
    file_path: str
    caption: Optional[str] = None


class ImageNote(ImageNoteCreate):
    id: str
    created_at: datetime
    updated_at: datetime


class AudioNoteCreate(BaseNoteFields):
    type: Literal["audio"]
    file_path: str
    transcript: Optional[str] = None


class AudioNote(AudioNoteCreate):
    id: str
    created_at: datetime
    updated_at: datetime


class DrawingNoteCreate(BaseNoteFields):
    type: Literal["drawing"]
    drawing_data: dict


class DrawingNote(DrawingNoteCreate):
    id: str
    created_at: datetime
    updated_at: datetime


NoteCreate = Union[TextNoteCreate, ImageNoteCreate, AudioNoteCreate, DrawingNoteCreate]
Note = Union[TextNote, ImageNote, AudioNote, DrawingNote]
