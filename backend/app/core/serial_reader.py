import math
import logging
import threading
import time

import serial
from serial import SerialException

from app.core.config import PORT, BAUD, WARMUP_TIME
from app.core.state import append_reading, get_snapshot, mark_connected, set_disconnected

logger = logging.getLogger(__name__)

_stop_event: threading.Event = threading.Event()

# Seconds to wait before retrying a failed/disconnected port
RECONNECT_INTERVAL = 2


def get_stop_event() -> threading.Event:
    return _stop_event


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


def _read_loop(ser: serial.Serial) -> None:
    """Inner loop: read lines from an already-open serial port until
    it disconnects or the stop event fires."""
    while not _stop_event.is_set():
        try:
            raw_line = ser.readline().decode(errors="ignore").strip()
        except SerialException as exc:
            # USB pulled out mid-session → mark disconnected immediately
            logger.warning("Serial read error (device disconnected?): %s", exc)
            set_disconnected()
            return  # fall back to the outer reconnect loop

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

        # First valid DATA line → mark connected (updates UI instantly)
        mark_connected()

        snap = get_snapshot()
        start_time = snap["start_time"]
        elapsed = time.time() - start_time if start_time else 0.0

        if elapsed < WARMUP_TIME:
            logger.info("Warmup... %ds / %ds", int(elapsed), WARMUP_TIME)
            continue

        append_reading(co2, humidity, temp)
        logger.info("[DATA] CO2=%.2f  HUM=%.2f  TEMP=%.2f", co2, humidity, temp)


def start_serial_listener() -> None:
    """Outer reconnect loop.

    - Tries to open the serial port.
    - On success → runs _read_loop().
    - On failure or disconnection → marks disconnected, waits
      RECONNECT_INTERVAL seconds, and tries again.
    - Exits cleanly when _stop_event is set.
    """
    logger.info("Serial listener starting (port=%s, baud=%d)", PORT, BAUD)

    while not _stop_event.is_set():
        ser = None
        try:
            logger.info("Attempting to open serial port %s ...", PORT)
            ser = serial.Serial(PORT, BAUD, timeout=1)
            time.sleep(2)  # let the device settle (Arduino reset, etc.)
            logger.info("Serial port %s opened successfully", PORT)

            _read_loop(ser)

        except SerialException as exc:
            # Port not available (USB not plugged in yet, or removed between retries)
            logger.warning("Cannot open serial port %s: %s", PORT, exc)
            set_disconnected()

        finally:
            if ser is not None:
                try:
                    ser.close()
                except Exception:
                    pass
                logger.info("Serial port %s closed", PORT)

        if _stop_event.is_set():
            break

        logger.info("Retrying in %d s...", RECONNECT_INTERVAL)
        # Sleep in small increments so we can respond to stop_event quickly
        for _ in range(RECONNECT_INTERVAL * 10):
            if _stop_event.is_set():
                break
            time.sleep(0.1)

    logger.info("Serial listener thread exiting")
