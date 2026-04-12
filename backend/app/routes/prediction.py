from fastapi import APIRouter, HTTPException

from app.core.config import WINDOW_SIZE
from app.core.state import get_snapshot
from app.schemas.response import PredictionResponse
from app.services.model_service import predict
from app.core.prediction_logger import log_prediction

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

    # Log the prediction
    prediction_result = PredictionResponse(**result)
    log_prediction(
        source="backend",
        label=prediction_result.label,
        spoilage_index=prediction_result.spoilage_index,
        confidence=prediction_result.confidence
    )

    return prediction_result
