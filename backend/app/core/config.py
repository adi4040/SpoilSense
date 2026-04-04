import os

PORT = os.getenv("SERIAL_PORT", "COM5")
BAUD = int(os.getenv("BAUD_RATE", "115200"))
WARMUP_TIME = int(os.getenv("WARMUP_TIME_S", "10"))
WINDOW_SIZE = int(os.getenv("WINDOW_SIZE", "30"))
