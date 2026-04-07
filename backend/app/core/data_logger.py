"""
Data Logger Module
Handles CSV logging of sensor data (Temperature, Humidity, CO2) with timestamps.
"""

import csv
import logging
import threading
from pathlib import Path
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

# Get the data directory (backend/data/)
DATA_DIR = Path(__file__).parent.parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

# CSV file path
CSV_FILE = DATA_DIR / "sensor_data.csv"

# Thread-safe lock for CSV operations
_csv_lock: threading.Lock = threading.Lock()

# CSV column headers
CSV_HEADERS = ["Timestamp", "Temperature", "Humidity", "CO2"]


def _initialize_csv() -> None:
    """Create CSV file with headers if it doesn't exist."""
    if not CSV_FILE.exists():
        try:
            with open(CSV_FILE, "w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(CSV_HEADERS)
            logger.info("Created new CSV file: %s", CSV_FILE)
        except IOError as e:
            logger.error("Failed to create CSV file: %s", e)


def log_sensor_data(temperature: float, humidity: float, co2: float) -> bool:
    """
    Log a sensor reading to CSV file.
    
    Args:
        temperature: Temperature in Celsius
        humidity: Humidity as percentage (0-100)
        co2: CO2 concentration in ppm
        
    Returns:
        True if logged successfully, False otherwise
    """
    try:
        timestamp = datetime.now().isoformat()
        
        with _csv_lock:
            # Ensure CSV exists
            if not CSV_FILE.exists():
                _initialize_csv()
            
            # Append data to CSV
            with open(CSV_FILE, "a", newline="") as f:
                writer = csv.writer(f)
                writer.writerow([
                    timestamp,
                    round(temperature, 2),
                    round(humidity, 2),
                    round(co2, 2)
                ])
        
        logger.debug("Logged data: Temp=%.2f°C, Hum=%.2f%%, CO2=%.2f ppm", 
                    temperature, humidity, co2)
        return True
        
    except IOError as e:
        logger.error("Failed to write to CSV: %s", e)
        return False


def get_csv_file_path() -> Path:
    """Get the path to the CSV file."""
    return CSV_FILE


def get_sensor_data_count() -> int:
    """Get the number of data points in CSV (excluding header)."""
    try:
        with _csv_lock:
            if not CSV_FILE.exists():
                return 0
            with open(CSV_FILE, "r") as f:
                return sum(1 for line in f) - 1  # -1 for header
    except IOError as e:
        logger.error("Failed to count CSV rows: %s", e)
        return 0


def get_latest_data(limit: int = 100) -> list[dict]:
    """
    Get the latest sensor data from CSV.
    
    Args:
        limit: Maximum number of rows to return
        
    Returns:
        List of dictionaries with sensor data
    """
    try:
        with _csv_lock:
            if not CSV_FILE.exists():
                return []
            
            data = []
            with open(CSV_FILE, "r") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    data.append(row)
            
            # Return last `limit` rows
            return data[-limit:] if data else []
            
    except IOError as e:
        logger.error("Failed to read CSV: %s", e)
        return []


def clear_csv_data() -> bool:
    """Clear all data from CSV file (keeps headers)."""
    try:
        with _csv_lock:
            _initialize_csv()
        logger.info("CSV data cleared")
        return True
    except IOError as e:
        logger.error("Failed to clear CSV: %s", e)
        return False


# Initialize CSV on module load
_initialize_csv()
