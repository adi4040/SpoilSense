from fastapi import APIRouter
from app.core.state import state
import time
from app.core.config import WARMUP_TIME

router = APIRouter()


@router.get("/")
def get_status():
    if not state["connected"]:
        return {"connected": False}

    elapsed = time.time() - state["start_time"]

    return {
        "connected": True,
        "ready": elapsed > WARMUP_TIME,
        "buffer_size": len(state["buffer"]),
    }
