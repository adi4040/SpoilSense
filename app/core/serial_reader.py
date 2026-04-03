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


def start_serial_listener() -> None:
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        time.sleep(2)
        logger.info("Serial listener started on %s at %d baud", PORT, BAUD)
    except SerialException as exc:
        logger.error("Failed to open serial port %s: %s", PORT, exc)
        return

    try:
        while not _stop_event.is_set():
            try:
                raw_line = ser.readline().decode(errors="ignore").strip()
            except SerialException as exc:
                logger.error("Device disconnected: %s", exc)
                set_disconnected()
                break

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

            snap = get_snapshot()
            start_time = snap["start_time"]
            elapsed = time.time() - start_time if start_time else 0.0

            if elapsed < WARMUP_TIME:
                logger.info("Warmup... %ds / %ds", int(elapsed), WARMUP_TIME)
                continue

            append_reading(co2, humidity, temp)
            logger.info("[DATA] CO2=%.2f  HUM=%.2f  TEMP=%.2f", co2, humidity, temp)

    finally:
        ser.close()
        logger.info("Serial port %s closed", PORT)
