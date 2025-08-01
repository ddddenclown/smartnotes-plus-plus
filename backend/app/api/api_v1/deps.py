from pathlib import Path

DATA_DIR = Path("data") / "canvases"


def get_canvas_path(canvas_id: str) -> Path:
    return DATA_DIR / canvas_id
