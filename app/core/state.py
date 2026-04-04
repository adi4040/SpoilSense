import threading
import time
from collections import deque

from app.core.config import WINDOW_SIZE

_lock: threading.Lock = threading.Lock()

_state: dict = {
    "connected":  False,
    "start_time": None,
    "buffer":     deque(maxlen=WINDOW_SIZE),
    "last_value": None,
}


def get_snapshot() -> dict:
    with _lock:
        return {
            "connected":  _state["connected"],
            "start_time": _state["start_time"],
            "buffer":     list(_state["buffer"]),
            "last_value": dict(_state["last_value"]) if _state["last_value"] else None,
        }


def mark_connected() -> None:
    with _lock:
        if not _state["connected"]:
            _state["connected"]  = True
            _state["start_time"] = time.time()


def append_reading(co2: float, humidity: float, temp: float) -> None:
    with _lock:
        _state["buffer"].append((co2, humidity))
        _state["last_value"] = {"co2": co2, "humidity": humidity, "temp": temp}


def set_disconnected() -> None:
    with _lock:
        _state["connected"] = False


def reset() -> None:
    with _lock:
        _state["connected"]  = False
        _state["start_time"] = None
        _state["last_value"] = None
        _state["buffer"].clear()
