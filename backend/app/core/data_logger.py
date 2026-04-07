import csv
import logging
import threading
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

# Get the data directory (backend/data/)
DATA_DIR = Path(__file__).parent.parent.parent / "data"

# Create directory early and verify
try:
    DATA_DIR.mkdir(exist_ok=True)
    logger.info("Data directory ready: %s", DATA_DIR)
except Exception as e:
    logger.error("Failed to create data directory: %s", e)

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
            with open(CSV_FILE, "w", newline="", buffering=1) as f:
                writer = csv.writer(f)
                writer.writerow(CSV_HEADERS)
                f.flush()  # Explicitly flush to disk
            logger.info("✓ Created new CSV file: %s", CSV_FILE)
        except IOError as e:
            logger.error("Failed to create CSV file: %s", e)
            raise


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
            
            # Append data to CSV with line buffering
            with open(CSV_FILE, "a", newline="", buffering=1) as f:
                writer = csv.writer(f)
                writer.writerow([
                    timestamp,
                    round(temperature, 2),
                    round(humidity, 2),
                    round(co2, 2)
                ])
                f.flush()  # Explicitly flush to disk
                os.fsync(f.fileno())  # Force OS-level sync to disk
        
        logger.debug("✓ Logged: Temp=%.2f°C, Hum=%.2f%%, CO2=%.2f ppm", 
                    temperature, humidity, co2)
        return True
        
    except IOError as e:
        logger.error("✗ Failed to write to CSV: %s", e)
        return False
    except Exception as e:
        logger.error("✗ Unexpected error logging data: %s", e)
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


def get_data_by_timerange(hours: int) -> list[dict]:
    """
    Get sensor data from the last N hours.
    
    Args:
        hours: Number of hours to look back
        
    Returns:
        List of dictionaries with sensor data from the last N hours
    """
    try:
        with _csv_lock:
            if not CSV_FILE.exists():
                return []
            
            cutoff_time = datetime.now() - timedelta(hours=hours)
            filtered_data = []
            
            with open(CSV_FILE, "r") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    try:
                        row_time = datetime.fromisoformat(row.get("Timestamp", ""))
                        if row_time >= cutoff_time:
                            filtered_data.append(row)
                    except (ValueError, KeyError):
                        # Skip malformed rows
                        continue
            
            logger.info("Retrieved %d data points from last %d hours", len(filtered_data), hours)
            return filtered_data
            
    except IOError as e:
        logger.error("Failed to read CSV by timerange: %s", e)
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


# Initialize CSV file at module load time
try:
    _initialize_csv()
    logger.info("📊 Data logger initialized successfully")
except Exception as e:
    logger.error("⚠️  Failed to initialize data logger: %s", e)
