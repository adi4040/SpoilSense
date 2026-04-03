import math
import logging
from pathlib import Path

import joblib
import numpy as np

logger = logging.getLogger(__name__)

# Load model
_MODEL_PATH = Path(__file__).parent.parent / "models" / "spoilage_model.pkl"
model = joblib.load(_MODEL_PATH)

_CLASSES: list = list(model.classes_)
logger.info("Loaded model with classes: %s", _CLASSES)

_INT_TO_NAME: dict = {0: "early", 1: "mid", 2: "spoiled"}

FEATURE_ORDER = ["co2_mean", "co2_std", "co2_min", "co2_max", "humidity_mean"]


def _label_name(cls) -> str:
    if isinstance(cls, str):
        return cls
    return _INT_TO_NAME.get(int(cls), str(cls))


def _spoiled_prob(probs: np.ndarray) -> float:
    for i, cls in enumerate(_CLASSES):
        if _label_name(cls) == "spoiled":
            return float(probs[i])
    logger.warning("'spoiled' class not found; using last prob")
    return float(probs[-1])


def _co2_index(co2_mean: float, min_co2=230, max_co2=650) -> float:
    index = (co2_mean - min_co2) / (max_co2 - min_co2)
    return float(max(0.0, min(1.0, index)))  # clamp 0–1


def predict(buffer: list) -> dict:
    if not buffer:
        raise ValueError("predict() called with empty buffer")

    co2_vals = [x[0] for x in buffer]
    hum_vals = [x[1] for x in buffer]

    # Validate data
    all_vals = co2_vals + hum_vals
    if not all(math.isfinite(v) for v in all_vals):
        raise ValueError("Buffer contains non-finite sensor values")

    # Feature extraction
    co2_mean = np.mean(co2_vals)

    features = np.array(
        [
            [
                co2_mean,
                np.std(co2_vals),
                float(np.min(co2_vals)),
                float(np.max(co2_vals)),
                np.mean(hum_vals),
            ]
        ]
    )

    # ML prediction
    pred = model.predict(features)[0]
    probs = model.predict_proba(features)[0]

    label = _label_name(pred)
    ml_index = _spoiled_prob(probs)

    # CO2 heuristic
    co2_index = _co2_index(co2_mean)

    final_index = 0.3 * ml_index + 0.7 * co2_index

    logger.info(
        "Prediction: label=%s | ML=%.3f | CO2=%.3f | FINAL=%.3f",
        label,
        ml_index,
        co2_index,
        final_index,
    )

    return {"label": label, "spoilage_index": round(final_index, 3)}
