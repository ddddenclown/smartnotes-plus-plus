from fastapi import FastAPI

from backend.app.api.api_v1.api import api_router


app = FastAPI()


app.include_router(api_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}