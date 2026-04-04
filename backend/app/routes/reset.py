from fastapi import APIRouter

from app.core.state import reset

router = APIRouter()


@router.post("/")
def reset_device() -> dict:
    reset()
    return {"status": "ok", "message": "State reset. Waiting for device reconnection."}
