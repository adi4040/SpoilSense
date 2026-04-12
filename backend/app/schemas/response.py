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
    confidence:     float = 0.0  # Model confidence (0-1 range)


class SensorResponse(BaseModel):
    temp:     Optional[float] = None
    co2:      Optional[float] = None
    humidity: Optional[float] = None
    co2_avg:  Optional[float] = None  # average over current buffer


class DeviceConfigResponse(BaseModel):
    port:           str
    baud:           int
    auto_reconnect: bool
    manual_disconnect: bool = False


class DeviceConfigUpdate(BaseModel):
    port:           Optional[str]  = None
    baud:           Optional[int]  = None
    auto_reconnect: Optional[bool] = None
