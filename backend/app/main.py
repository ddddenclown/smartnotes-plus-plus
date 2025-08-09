from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.api.api_v1.api import api_router


app = FastAPI()

# Настройка CORS для разработки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статические файлы для медиа
app.mount("/media", StaticFiles(directory="data/canvases"), name="media")

app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}