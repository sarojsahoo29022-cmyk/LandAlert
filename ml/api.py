import joblib
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_PATH = Path(__file__).parent / "model.joblib"
SNAPSHOT_PATH = Path(__file__).parent / "predictions_snapshot.json"

app = FastAPI(title="GeoShield Landslide Model API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_MODEL = None
_META = None


@app.on_event("startup")
def load_model():
    global _MODEL, _META
    bundle = joblib.load(MODEL_PATH)
    _MODEL = bundle["pipeline"]
    _META = bundle


class Features(BaseModel):
    T2M: float
    precipitation: float
    rainfall_3day_sum: float
    rainfall_7day_sum: float
    rainfall_30day_sum: float
    temp_7day_avg: float
    district: str


def risk_level(p: float) -> str:
    if p >= 0.5:
        return "High"
    if p >= 0.2:
        return "Moderate"
    return "Low"


@app.get("/")
def root():
    return {"service": "GeoShield Landslide Model API", "status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok", "metrics": _META.get("metrics") if _META else None}


@app.post("/predict")
def predict(features: Features):
    if _MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    row = {
        "T2M": [features.T2M],
        "precipitation": [features.precipitation],
        "rainfall_3day_sum": [features.rainfall_3day_sum],
        "rainfall_7day_sum": [features.rainfall_7day_sum],
        "rainfall_30day_sum": [features.rainfall_30day_sum],
        "temp_7day_avg": [features.temp_7day_avg],
        "district": [str(features.district)],
    }
    import pandas as pd

    X = pd.DataFrame(row)
    proba = float(_MODEL.predict_proba(X)[0, 1])
    return {
        "district": features.district,
        "landslide_probability": round(proba, 4),
        "risk_level": risk_level(proba),
        "prediction": int(proba >= 0.5),
    }


@app.get("/snapshot")
def snapshot():
    if not SNAPSHOT_PATH.exists():
        raise HTTPException(status_code=404, detail="Snapshot not generated")
    import json

    return json.loads(SNAPSHOT_PATH.read_text())


@app.get("/districts")
def districts():
    if not SNAPSHOT_PATH.exists():
        return {"districts": []}
    import json

    data = json.loads(SNAPSHOT_PATH.read_text())
    return {"districts": [d["district"] for d in data["districts"]]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
