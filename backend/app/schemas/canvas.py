from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CanvasBase(BaseModel):
    name: str


class CanvasCreate(CanvasBase):
    pass


class CanvasUpdate(CanvasBase):
    pass


class Canvas(CanvasBase):
    id: str
    created_at: datetime
    updated_at: datetime
