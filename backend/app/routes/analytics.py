"""
Analytics Route
Exposes endpoints to retrieve historical sensor data for analytics/trends visualization.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from app.core.data_logger import get_latest_data, get_sensor_data_count, get_csv_file_path

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
