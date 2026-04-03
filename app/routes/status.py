import time

from fastapi import APIRouter

from app.core.config import WARMUP_TIME
from app.core.state import get_snapshot
from app.schemas.response import StatusResponse

router = APIRouter()


@router.get("/", response_model=StatusResponse)
def get_status() -> StatusResponse:
    snap = get_snapshot()

    if not snap["connected"]:
        return StatusResponse(connected=False)

    start_time = snap["start_time"]
    if start_time is None:
        return StatusResponse(connected=True, ready=False, buffer_size=0)

    elapsed = time.time() - start_time

    return StatusResponse(
        connected=True,
        ready=elapsed > WARMUP_TIME,
        buffer_size=len(snap["buffer"]),
        elapsed_s=round(elapsed, 1),
    )
