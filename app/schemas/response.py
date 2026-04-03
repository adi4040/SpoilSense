from typing import Optional
from pydantic import BaseModel


class StatusResponse(BaseModel):
    connected:   bool
    ready:       bool            = False
    buffer_size: int             = 0
    elapsed_s:   Optional[float] = None


class PredictionResponse(BaseModel):
    label:          str
    spoilage_index: float
