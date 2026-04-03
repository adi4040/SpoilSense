from pydantic import BaseModel


class StatusResponse(BaseModel):
    connected: bool
    ready: bool
    buffer_size: int


class PredictionResponse(BaseModel):
    label: str
    spoilage_index: float
