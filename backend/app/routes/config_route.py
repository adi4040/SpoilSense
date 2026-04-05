import logging

from fastapi import APIRouter
from serial.tools import list_ports

from app.core.device_config import COMMON_BAUDS, get_device_config, update_device_config
from app.core.serial_reader import (
    is_manual_disconnect,
    request_restart,
    set_manual_disconnect,
)
from app.schemas.response import DeviceConfigResponse, DeviceConfigUpdate

logger = logging.getLogger(__name__)
router = APIRouter()


# ── GET /config ───────────────────────────────────────────────────────────────

@router.get("/", response_model=DeviceConfigResponse)
def get_config() -> DeviceConfigResponse:
    """Return current device configuration + manual-disconnect state."""
    cfg = get_device_config()
    return DeviceConfigResponse(
        port=cfg["port"],
        baud=cfg["baud"],
        auto_reconnect=cfg["auto_reconnect"],
        manual_disconnect=is_manual_disconnect(),
    )


# ── POST /config ──────────────────────────────────────────────────────────────

@router.post("/", response_model=DeviceConfigResponse)
def update_config(body: DeviceConfigUpdate) -> DeviceConfigResponse:
    """Update port / baud / auto_reconnect and restart the serial listener."""
    cfg = update_device_config(
        port=body.port,
        baud=body.baud,
        auto_reconnect=body.auto_reconnect,
    )
    request_restart()   # apply new config immediately
    logger.info("Device config updated: %s", cfg)
    return DeviceConfigResponse(
        port=cfg["port"],
        baud=cfg["baud"],
        auto_reconnect=cfg["auto_reconnect"],
        manual_disconnect=is_manual_disconnect(),
    )


# ── POST /config/connect ──────────────────────────────────────────────────────

@router.post("/connect")
def connect_device() -> dict:
    """Manually initiate a connection attempt."""
    set_manual_disconnect(False)    # clears manual-disconnect flag + fires restart
    logger.info("Manual connect requested")
    return {"status": "connecting"}


# ── POST /config/disconnect ───────────────────────────────────────────────────

@router.post("/disconnect")
def disconnect_device() -> dict:
    """Manually close the serial port and stay disconnected."""
    set_manual_disconnect(True)     # sets manual-disconnect flag + fires restart
    logger.info("Manual disconnect requested")
    return {"status": "disconnected"}


# ── GET /config/ports ─────────────────────────────────────────────────────────

@router.get("/ports")
def list_com_ports() -> dict:
    """List available serial ports on this host + common baud rates."""
    ports = [
        {"port": p.device, "description": p.description or p.device}
        for p in list_ports.comports()
    ]
    return {"ports": ports, "common_bauds": COMMON_BAUDS}
