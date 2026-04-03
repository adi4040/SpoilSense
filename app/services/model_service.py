import joblib
import numpy as np

model = joblib.load("app/models/spoilage_model.pkl")


def predict(buffer):
    co2_vals = [x[0] for x in buffer]
    hum_vals = [x[1] for x in buffer]

    features = [
        [
            np.mean(co2_vals),
            np.std(co2_vals),
            min(co2_vals),
            max(co2_vals),
            np.mean(hum_vals),
        ]
    ]

    pred = model.predict(features)[0]
    probs = model.predict_proba(features)[0]

    label_map = {0: "early", 1: "mid", 2: "spoiled"}

    return {"label": label_map[pred], "spoilage_index": float(probs[2])}
