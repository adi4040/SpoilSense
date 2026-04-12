"""
Prediction Data Logger
Logs prediction results from both backend ML model and Jetson Nano
Stores: timestamp, source (backend/jetson), prediction label, spoilage index, confidence
"""

import csv
import threading
import os
import logging
from pathlib import Path
from datetime import datetime

logger = logging.getLogger(__name__)

# CSV file location
DATA_DIR = Path(__file__).parent.parent.parent / "data"
PREDICTIONS_CSV = DATA_DIR / "predictions.csv"

# Thread lock for safe concurrent writes
_csv_lock = threading.Lock()

# CSV headers
HEADERS = ["Timestamp", "Source", "Label", "SpoilageIndex", "Confidence"]


def _ensure_csv_exists():
    """Create CSV file with headers if it doesn't exist."""
    try:
        if not DATA_DIR.exists():
            DATA_DIR.mkdir(parents=True, exist_ok=True)
            logger.info(f"✓ Created data directory: {DATA_DIR}")
        
        if not PREDICTIONS_CSV.exists():
            with open(PREDICTIONS_CSV, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=HEADERS)
                writer.writeheader()
            logger.info(f"✓ Created predictions CSV: {PREDICTIONS_CSV}")
    except Exception as e:
        logger.error(f"✗ Failed to create predictions CSV: {e}")
        raise


def log_prediction(source: str, label: str, spoilage_index: float, confidence: float = 0.0) -> bool:
    """
    Log a prediction result to CSV (backend or Jetson Nano).
    
    Args:
        source: "backend" or "jetson" - where the prediction came from
        label: Prediction label (e.g., "fresh", "ripe", "overripe", "rotten")
        spoilage_index: Spoilage score (0-1 or 0-100)
        confidence: Model confidence (0-1 or 0-100)
        
    Returns:
        True if logged successfully, False otherwise
    """
    try:
        _ensure_csv_exists()
        
        # Normalize spoilage_index to 0-1 range if needed
        if spoilage_index > 1:
            spoilage_index = spoilage_index / 100.0
        
        # Normalize confidence to 0-1 range if needed
        if confidence > 1:
            confidence = confidence / 100.0
        
        # Thread-safe CSV write
        with _csv_lock:
            with open(PREDICTIONS_CSV, "a", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=HEADERS)
                writer.writerow({
                    "Timestamp": datetime.now().isoformat(),
                    "Source": source,
                    "Label": label,
                    "SpoilageIndex": round(float(spoilage_index), 3),
                    "Confidence": round(float(confidence), 3),
                })
                f.flush()
                os.fsync(f.fileno())
        
        logger.debug(f"✓ Logged prediction: {source} - {label} - {spoilage_index:.3f}")
        return True
        
    except Exception as e:
        logger.error(f"✗ Failed to log prediction: {e}")
        return False


def get_latest_predictions(limit: int = 100) -> list:
    """
    Get the latest N prediction records.
    
    Args:
        limit: Number of records to retrieve
        
    Returns:
        List of prediction dicts
    """
    try:
        _ensure_csv_exists()
        
        predictions = []
        with open(PREDICTIONS_CSV, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row and any(row.values()):  # Skip empty rows
                    try:
                        predictions.append({
                            "Timestamp": row.get("Timestamp", ""),
                            "Source": row.get("Source", ""),
                            "Label": row.get("Label", ""),
                            "SpoilageIndex": float(row.get("SpoilageIndex", 0)),
                            "Confidence": float(row.get("Confidence", 0)),
                        })
                    except ValueError:
                        continue
        
        # Return last `limit` records
        return predictions[-limit:] if limit else predictions
        
    except FileNotFoundError:
        logger.warning("Predictions CSV not found")
        return []
    except Exception as e:
        logger.error(f"✗ Failed to read predictions: {e}")
        return []


def get_predictions_by_timerange(hours: int) -> list:
    """
    Get predictions from the last N hours.
    
    Args:
        hours: Number of hours to look back
        
    Returns:
        List of prediction dicts from the specified time range
    """
    try:
        from datetime import datetime, timedelta
        
        cutoff_time = datetime.now() - timedelta(hours=hours)
        predictions = get_latest_predictions(limit=100000)
        
        filtered = []
        for pred in predictions:
            try:
                pred_time = datetime.fromisoformat(pred["Timestamp"])
                if pred_time >= cutoff_time:
                    filtered.append(pred)
            except (ValueError, KeyError):
                continue
        
        return filtered
        
    except Exception as e:
        logger.error(f"✗ Failed to filter predictions by timerange: {e}")
        return []


def get_prediction_count() -> int:
    """Get total number of predictions logged."""
    try:
        predictions = get_latest_predictions(limit=100000)
        return len(predictions)
    except Exception as e:
        logger.error(f"✗ Failed to count predictions: {e}")
        return 0


def get_predictions_csv_path() -> Path:
    """Get the path to the predictions CSV file."""
    return PREDICTIONS_CSV


def get_predictions_by_source(source: str, limit: int = 1000) -> list:
    """
    Get predictions filtered by source (backend or jetson).
    
    Args:
        source: "backend" or "jetson"
        limit: Maximum number of records
        
    Returns:
        List of predictions from the specified source
    """
    try:
        all_predictions = get_latest_predictions(limit=limit)
        return [p for p in all_predictions if p.get("Source") == source]
    except Exception as e:
        logger.error(f"✗ Failed to filter predictions by source: {e}")
        return []
