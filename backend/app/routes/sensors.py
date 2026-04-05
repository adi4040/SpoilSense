import numpy as np
from fastapi import APIRouter

from app.core.state import get_snapshot
from app.schemas.response import SensorResponse

router = APIRouter()


@router.get("/", response_model=SensorResponse)
def get_sensors() -> SensorResponse:
    snap = get_snapshot()

    last = snap["last_value"]
    buffer = snap["buffer"]  # list of (co2, humidity) tuples

    co2_avg = round(float(np.mean([x[0] for x in buffer])), 2) if buffer else None

    if last is None:
        return SensorResponse()

    return SensorResponse(
        temp=round(last["temp"], 2),
        co2=round(last["co2"], 2),
        humidity=round(last["humidity"], 2),
        co2_avg=co2_avg,
    )
