from fastapi import APIRouter, HTTPException

from app.core.config import WINDOW_SIZE
from app.core.state import get_snapshot
from app.schemas.response import PredictionResponse
from app.services.model_service import predict

router = APIRouter()


@router.post("/", response_model=PredictionResponse)
def run_prediction() -> PredictionResponse:
    snap = get_snapshot()
    buffer = snap["buffer"]

    if len(buffer) < WINDOW_SIZE:
        raise HTTPException(
            status_code=503,
            detail=f"Not enough data: {len(buffer)}/{WINDOW_SIZE} readings collected.",
        )

    try:
        result = predict(buffer)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    return PredictionResponse(**result)
