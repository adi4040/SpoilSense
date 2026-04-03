from fastapi import APIRouter
from app.core.state import state
from app.core.config import WINDOW_SIZE
from app.services.model_service import predict

router = APIRouter()


@router.get("/")
def get_prediction():
    if len(state["buffer"]) < WINDOW_SIZE:
        return {"status": "not_enough_data"}

    result = predict(state["buffer"])

    # state["buffer"].clear()

    return result
