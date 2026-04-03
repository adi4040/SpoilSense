import serial
import time
from app.core.config import PORT, BAUD
from app.core.state import state
from app.core.config import WARMUP_TIME


def start_serial_listener():
    try:
        ser = serial.Serial(PORT, BAUD, timeout=1)
        time.sleep(2)
        print("Serial listener started on", PORT)
    except Exception as e:
        print("Failed to open serial port:", e)
        return

    MAX_BUFFER = 30
    while True:
        try:
            raw_line = ser.readline().decode(errors="ignore").strip()

            # DEBUG: always print raw data
            if raw_line:
                print("RAW:", raw_line)

            # Skip empty lines
            if not raw_line:
                continue

            # Expecting: DATA,temp,humidity,co2
            if not raw_line.startswith("DATA"):
                continue

            parts = raw_line.split(",")

            if len(parts) != 4:
                print("Invalid format:", parts)
                continue

            temp = float(parts[1])
            humidity = float(parts[2])
            co2 = float(parts[3])

            # Mark connection
            if not state["connected"]:
                state["connected"] = True
                state["start_time"] = time.time()
                print("Device connected")

            # Save latest values
            state["last_value"] = {"temp": temp, "humidity": humidity, "co2": co2}

            elapsed = time.time() - state["start_time"]

            # Warm-up skip (5 min)
            if elapsed < WARMUP_TIME:
                print(f"Warmup... ({int(elapsed)}s)")
                continue

            state["buffer"].append((co2, humidity))

            if len(state["buffer"]) > MAX_BUFFER:
                state["buffer"].pop(0)  # remove oldest

            print(f"[DATA] CO2={co2}, HUM={humidity}, TEMP={temp}")
            # print(state["buffer"])

        except Exception as e:
            print("Serial error:", e)


# # Run listener
# start_serial_listener()
