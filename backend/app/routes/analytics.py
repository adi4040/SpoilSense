"""
Analytics Route
Exposes endpoints to retrieve historical sensor data for analytics/trends visualization.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
from app.core.data_logger import get_latest_data, get_sensor_data_count, get_csv_file_path, get_data_by_timerange

router = APIRouter()


class SensorDataPoint(BaseModel):
    Timestamp: str
    Temperature: float
    Humidity: float
    CO2: float


class AnalyticsResponse(BaseModel):
    total_points: int
    data: List[SensorDataPoint]
    csv_file: str


@router.get("/data", response_model=AnalyticsResponse)
def get_analytics_data(limit: Optional[int] = Query(100, ge=1, le=10000)):
    """
    Get latest sensor data for analytics/trends.
    
    Args:
        limit: Number of data points to return (default: 100, max: 10000)
        
    Returns:
        Total data points collected and the latest `limit` entries
    """
    try:
        total = get_sensor_data_count()
        raw_data = get_latest_data(limit)
        
        # Convert raw CSV data to typed response
        data_points = []
        for row in raw_data:
            try:
                data_points.append(SensorDataPoint(
                    Timestamp=row.get("Timestamp", ""),
                    Temperature=float(row.get("Temperature", 0)),
                    Humidity=float(row.get("Humidity", 0)),
                    CO2=float(row.get("CO2", 0))
                ))
            except (ValueError, KeyError) as e:
                # Skip malformed rows
                continue
        
        return AnalyticsResponse(
            total_points=total,
            data=data_points,
            csv_file=str(get_csv_file_path())
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analytics data: {str(e)}")


@router.get("/data/count")
def get_data_count() -> dict:
    """Get total number of data points collected so far."""
    try:
        count = get_sensor_data_count()
        return {"total_points": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/data/stats")
def get_data_statistics() -> dict:
    """Get basic statistics about collected data."""
    try:
        data = get_latest_data(limit=10000)  # Get all data for stats
        
        if not data:
            return {
                "total_points": 0,
                "temperature_avg": None,
                "humidity_avg": None,
                "co2_avg": None
            }
        
        temps = [float(row["Temperature"]) for row in data if row.get("Temperature")]
        hums = [float(row["Humidity"]) for row in data if row.get("Humidity")]
        co2s = [float(row["CO2"]) for row in data if row.get("CO2")]
        
        return {
            "total_points": len(data),
            "temperature_avg": round(sum(temps) / len(temps), 2) if temps else None,
            "temperature_min": round(min(temps), 2) if temps else None,
            "temperature_max": round(max(temps), 2) if temps else None,
            "humidity_avg": round(sum(hums) / len(hums), 2) if hums else None,
            "humidity_min": round(min(hums), 2) if hums else None,
            "humidity_max": round(max(hums), 2) if hums else None,
            "co2_avg": round(sum(co2s) / len(co2s), 2) if co2s else None,
            "co2_min": round(min(co2s), 2) if co2s else None,
            "co2_max": round(max(co2s), 2) if co2s else None,
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/debug/csv-info")
def get_csv_debug_info() -> dict:
    """Debug endpoint to verify CSV file existence and location."""
    try:
        csv_path = get_csv_file_path()
        csv_exists = csv_path.exists()
        
        debug_info = {
            "csv_path": str(csv_path),
            "csv_exists": csv_exists,
            "parent_directory": str(csv_path.parent),
            "parent_directory_exists": csv_path.parent.exists(),
            "total_rows": get_sensor_data_count() if csv_exists else 0,
        }
        
        if csv_exists:
            debug_info["file_size_bytes"] = csv_path.stat().st_size
            debug_info["file_size_readable"] = f"{csv_path.stat().st_size / 1024:.2f} KB"
            
            # Try to read first few rows
            try:
                sample = get_latest_data(limit=3)
                debug_info["sample_data"] = sample
            except Exception as e:
                debug_info["error_reading_sample"] = str(e)
        
        return debug_info
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Debug info failed: {str(e)}")


@router.get("/data/by-timerange", response_model=AnalyticsResponse)
def get_data_by_timerange_endpoint(hours: Optional[int] = Query(2, ge=1, le=720), limit: Optional[int] = Query(10000, ge=1, le=100000)):
    """
    Get sensor data from the last N hours.
    
    Args:
        hours: Number of hours to look back (default: 2, max: 720 = 30 days)
        limit: Maximum number of data points to return (for performance)
        
    Returns:
        Data points collected within the specified time range
    """
    try:
        raw_data = get_data_by_timerange(hours)
        
        if not raw_data:
            return AnalyticsResponse(
                total_points=0,
                data=[],
                csv_file=str(get_csv_file_path())
            )
        
        # Apply limit if needed
        if len(raw_data) > limit:
            raw_data = raw_data[-limit:]
        
        # Convert raw CSV data to typed response
        data_points = []
        for row in raw_data:
            try:
                data_points.append(SensorDataPoint(
                    Timestamp=row.get("Timestamp", ""),
                    Temperature=float(row.get("Temperature", 0)),
                    Humidity=float(row.get("Humidity", 0)),
                    CO2=float(row.get("CO2", 0))
                ))
            except (ValueError, KeyError):
                continue
        
        return AnalyticsResponse(
            total_points=len(data_points),
            data=data_points,
            csv_file=str(get_csv_file_path())
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid time range: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve time-range data: {str(e)}")
