"""
device_config.py
~~~~~~~~~~~~~~~~
Runtime-mutable device configuration.

Unlike config.py (env-var snapshot at startup), this module holds the
*live* port/baud/auto_reconnect settings that can be changed at runtime
through the /config API without restarting the process.
"""
import threading
import os
from typing import Optional

_lock = threading.Lock()

_config: dict = {
    "port":           os.getenv("SERIAL_PORT", "COM5"),
    "baud":           int(os.getenv("BAUD_RATE", "115200")),
    "auto_reconnect": True,
}

COMMON_BAUDS = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]


# ── Public API ──────────────────────────────────────────────────────────────

def get_device_config() -> dict:
    """Return a snapshot of the current device configuration."""
    with _lock:
        return dict(_config)


def update_device_config(
    port: Optional[str]  = None,
    baud: Optional[int]  = None,
    auto_reconnect: Optional[bool] = None,
) -> dict:
    """Update one or more fields; return the new snapshot."""
    with _lock:
        if port is not None:
            _config["port"] = port
        if baud is not None:
            _config["baud"] = baud
        if auto_reconnect is not None:
            _config["auto_reconnect"] = auto_reconnect
        return dict(_config)
