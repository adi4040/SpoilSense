import math
import logging
import threading
import time

import serial
from serial import SerialException

from app.core.config import WARMUP_TIME
from app.core.device_config import get_device_config
from app.core.state import append_reading, get_snapshot, mark_connected, set_disconnected

logger = logging.getLogger(__name__)

# ── Internal control events ──────────────────────────────────────────────────

_stop_event:    threading.Event = threading.Event()
_restart_event: threading.Event = threading.Event()

_manual_disconnect: bool          = False
_md_lock:           threading.Lock = threading.Lock()

# Seconds to wait between reconnect attempts
RECONNECT_INTERVAL = 2


# ── Public control functions (called from API routes) ────────────────────────

def get_stop_event() -> threading.Event:
    return _stop_event


def request_restart() -> None:
    """Signal the serial reader to abandon its current connection / sleep and
    restart with the latest config immediately."""
    _restart_event.set()


def set_manual_disconnect(value: bool) -> None:
    """Programmatically connect (False) or disconnect (True) the device."""
    global _manual_disconnect
    with _md_lock:
        _manual_disconnect = value
    _restart_event.set()   # wake the outer loop immediately


def is_manual_disconnect() -> bool:
    with _md_lock:
        return _manual_disconnect


# ── Internal helpers ──────────────────────────────────────────────────────────

def _parse_line(raw: str) -> tuple[float, float, float]:
    parts = raw.split(",")
    if len(parts) != 4 or parts[0] != "DATA":
        raise ValueError(f"Unexpected format: {raw!r}")

    temp, humidity, co2 = float(parts[1]), float(parts[2]), float(parts[3])

    if not all(math.isfinite(v) for v in (temp, humidity, co2)):
        raise ValueError(f"Non-finite sensor value in: {raw!r}")

    if not (0.0 <= humidity <= 100.0):
        raise ValueError(f"Humidity out of range ({humidity}): {raw!r}")

    return temp, humidity, co2


def _interruptible_sleep(seconds: float) -> bool:
    """Sleep up to `seconds`, waking early if _stop_event or _restart_event fires.
    Returns True if interrupted."""
    steps = int(seconds * 10)
    for _ in range(steps):
        if _stop_event.is_set() or _restart_event.is_set():
            return True
        time.sleep(0.1)
    return False


def _read_loop(ser: serial.Serial) -> None:
    """Inner loop: read lines from an open serial port.

    Exits when:
    - _stop_event is set (server shutting down)
    - _restart_event is set (config changed / manual disconnect)
    - SerialException (USB pulled out)
    """
    while not _stop_event.is_set() and not _restart_event.is_set():
        try:
            raw_line = ser.readline().decode(errors="ignore").strip()
        except SerialException as exc:
            logger.warning("Serial read error (device disconnected?): %s", exc)
            set_disconnected()
            return

        if not raw_line:
            continue

        logger.debug("RAW: %s", raw_line)

        if not raw_line.startswith("DATA"):
            continue

        try:
            temp, humidity, co2 = _parse_line(raw_line)
        except ValueError as exc:
            logger.warning("Serial parse error: %s", exc)
            continue

        mark_connected()

        snap      = get_snapshot()
        start_time = snap["start_time"]
        elapsed    = time.time() - start_time if start_time else 0.0

        if elapsed < WARMUP_TIME:
            logger.info("Warmup... %ds / %ds", int(elapsed), WARMUP_TIME)
            continue

        append_reading(co2, humidity, temp)
        logger.info("[DATA] CO2=%.2f  HUM=%.2f  TEMP=%.2f", co2, humidity, temp)


# ── Outer reconnect loop ──────────────────────────────────────────────────────

def start_serial_listener() -> None:
    """Outer loop: manage connection lifecycle.

    States
    ------
    manual_disconnect=True  → stay idle; wake only via request_restart()
    auto_reconnect=False    → after a failure, stay idle until user reconnects
    auto_reconnect=True     → retry every RECONNECT_INTERVAL seconds
    """
    cfg = get_device_config()
    logger.info("Serial listener starting (port=%s, baud=%d)", cfg["port"], cfg["baud"])

    while not _stop_event.is_set():

        # ── Clear restart signal at the top of every iteration ──────────────
        _restart_event.clear()

        # ── Manual disconnect: idle and wait ─────────────────────────────────
        if is_manual_disconnect():
            set_disconnected()
            logger.info("Manual disconnect active — waiting for reconnect signal")
            _restart_event.wait()   # blocks until set_manual_disconnect(False) fires
            continue

        # ── Attempt to open the port ─────────────────────────────────────────
        cfg = get_device_config()
        ser = None
        try:
            logger.info("Attempting to open %s at %d baud ...", cfg["port"], cfg["baud"])
            ser = serial.Serial(cfg["port"], cfg["baud"], timeout=1)
            time.sleep(2)  # let Arduino reset settle
            logger.info("Serial port %s opened", cfg["port"])

            _read_loop(ser)

        except SerialException as exc:
            logger.warning("Cannot open %s: %s", cfg["port"], exc)
            set_disconnected()

        finally:
            if ser is not None:
                try:
                    ser.close()
                except Exception:
                    pass
                logger.info("Serial port %s closed", cfg["port"])

        if _stop_event.is_set():
            break

        # ── Decide whether to auto-retry ─────────────────────────────────────
        cfg = get_device_config()

        if is_manual_disconnect() or not cfg["auto_reconnect"]:
            # Sit idle; only restart_event (Connect button) wakes us
            logger.info("Auto-reconnect disabled — waiting for connect signal")
            _restart_event.wait()
            continue

        # Auto-reconnect: sleep RECONNECT_INTERVAL, but bail early if interrupted
        logger.info("Retrying in %d s...", RECONNECT_INTERVAL)
        _interruptible_sleep(RECONNECT_INTERVAL)

    logger.info("Serial listener thread exiting")
