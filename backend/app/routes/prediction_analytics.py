"""
Prediction Analytics Route
Exposes endpoints to retrieve historical prediction data for analytics/trends visualization.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from app.core.prediction_logger import (
    get_latest_predictions,
    get_prediction_count,
    get_predictions_by_timerange,
    get_predictions_by_source,
    get_predictions_csv_path,
    log_prediction,
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class PredictionDataPoint(BaseModel):
    Timestamp: str
    Source: str  # "backend" or "jetson"
    Label: str
    SpoilageIndex: float
    Confidence: float


class PredictionsAnalyticsResponse(BaseModel):
    total_points: int
    data: List[PredictionDataPoint]
    csv_file: str


class LogPredictionRequest(BaseModel):
    source: str  # "jetson" or other sources
    label: str
    spoilage_index: float
    confidence: float = 0.0


@router.post("/predictions/log")
def log_prediction_endpoint(request: LogPredictionRequest) -> dict:
    """
    Log a prediction from any source (Jetson Nano, etc).
    
    Args:
        request: LogPredictionRequest with source, label, spoilage_index, confidence
        
    Returns:
        Success/failure status
    """
    try:
        success = log_prediction(
            source=request.source,
            label=request.label,
            spoilage_index=request.spoilage_index,
            confidence=request.confidence
        )
        
        if success:
            return {"status": "logged", "source": request.source}
        else:
            raise HTTPException(status_code=500, detail="Failed to log prediction")
            
    except Exception as e:
        logger.error(f"Failed to log prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to log prediction: {str(e)}")


@router.get("/predictions", response_model=PredictionsAnalyticsResponse)
def get_predictions_analytics(limit: Optional[int] = Query(100, ge=1, le=10000)):
    """
    Get latest prediction records for analytics/trends.
    
    Args:
        limit: Number of records to return (default: 100, max: 10000)
        
    Returns:
        Total predictions and the latest `limit` entries
    """
    try:
        total = get_prediction_count()
        raw_data = get_latest_predictions(limit)
        
        # Convert to typed response
        data_points = []
        for row in raw_data:
            try:
                data_points.append(PredictionDataPoint(
                    Timestamp=row.get("Timestamp", ""),
                    Source=row.get("Source", ""),
                    Label=row.get("Label", ""),
                    SpoilageIndex=float(row.get("SpoilageIndex", 0)),
                    Confidence=float(row.get("Confidence", 0)),
                ))
            except (ValueError, KeyError):
                continue
        
        return PredictionsAnalyticsResponse(
            total_points=total,
            data=data_points,
            csv_file=str(get_predictions_csv_path())
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve predictions analytics: {str(e)}")


@router.get("/predictions/by-timerange", response_model=PredictionsAnalyticsResponse)
def get_predictions_by_timerange_endpoint(hours: Optional[int] = Query(2, ge=1, le=720)):
    """
    Get predictions from the last N hours.
    
    Args:
        hours: Number of hours to look back (default: 2, max: 720 = 30 days)
        
    Returns:
        Predictions from the specified time range
    """
    try:
        raw_data = get_predictions_by_timerange(hours)
        
        if not raw_data:
            return PredictionsAnalyticsResponse(
                total_points=0,
                data=[],
                csv_file=str(get_predictions_csv_path())
            )
        
        # Convert to typed response
        data_points = []
        for row in raw_data:
            try:
                data_points.append(PredictionDataPoint(
                    Timestamp=row.get("Timestamp", ""),
                    Source=row.get("Source", ""),
                    Label=row.get("Label", ""),
                    SpoilageIndex=float(row.get("SpoilageIndex", 0)),
                    Confidence=float(row.get("Confidence", 0)),
                ))
            except (ValueError, KeyError):
                continue
        
        return PredictionsAnalyticsResponse(
            total_points=len(data_points),
            data=data_points,
            csv_file=str(get_predictions_csv_path())
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid time range: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve predictions: {str(e)}")


@router.get("/predictions/by-source")
def get_predictions_by_source_endpoint(source: str = Query("backend", regex="^(backend|jetson)$")) -> dict:
    """
    Get predictions filtered by source.
    
    Args:
        source: "backend" or "jetson"
        
    Returns:
        Predictions from the specified source
    """
    try:
        predictions = get_predictions_by_source(source, limit=1000)
        
        if not predictions:
            return {
                "source": source,
                "total_points": 0,
                "data": [],
            }
        
        # Calculate statistics
        indices = [p["SpoilageIndex"] for p in predictions if p.get("SpoilageIndex")]
        confidences = [p["Confidence"] for p in predictions if p.get("Confidence")]
        
        return {
            "source": source,
            "total_points": len(predictions),
            "data": predictions,
            "stats": {
                "spoilage_avg": round(sum(indices) / len(indices), 3) if indices else None,
                "spoilage_min": round(min(indices), 3) if indices else None,
                "spoilage_max": round(max(indices), 3) if indices else None,
                "confidence_avg": round(sum(confidences) / len(confidences), 3) if confidences else None,
                "confidence_min": round(min(confidences), 3) if confidences else None,
                "confidence_max": round(max(confidences), 3) if confidences else None,
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve source predictions: {str(e)}")


@router.get("/predictions/stats")
def get_predictions_statistics() -> dict:
    """Get statistics about all predictions."""
    try:
        backend_preds = get_predictions_by_source("backend", limit=10000)
        jetson_preds = get_predictions_by_source("jetson", limit=10000)
        
        def compute_stats(predictions):
            if not predictions:
                return {
                    "total": 0,
                    "spoilage_avg": None,
                    "spoilage_min": None,
                    "spoilage_max": None,
                    "confidence_avg": None,
                }
            
            indices = [p["SpoilageIndex"] for p in predictions if p.get("SpoilageIndex")]
            confidences = [p["Confidence"] for p in predictions if p.get("Confidence")]
            
            return {
                "total": len(predictions),
                "spoilage_avg": round(sum(indices) / len(indices), 3) if indices else None,
                "spoilage_min": round(min(indices), 3) if indices else None,
                "spoilage_max": round(max(indices), 3) if indices else None,
                "confidence_avg": round(sum(confidences) / len(confidences), 3) if confidences else None,
                "confidence_min": round(min(confidences), 3) if confidences else None,
                "confidence_max": round(max(confidences), 3) if confidences else None,
            }
        
        return {
            "total_predictions": len(backend_preds) + len(jetson_preds),
            "backend": compute_stats(backend_preds),
            "jetson": compute_stats(jetson_preds),
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute statistics: {str(e)}")
