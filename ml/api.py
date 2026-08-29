import joblib
import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_PATH = Path(__file__).parent / "model_ne.joblib"
SNAPSHOT_PATH = Path(__file__).parent / "ne_snapshot.json"

app = FastAPI(title="GeoShield Landslide Model API", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_MODEL = None
_META = None

MONTHLY_TEMP_MAP = {
    1: 13.33, 2: 16.00, 3: 18.89, 4: 22.05, 5: 23.35, 6: 24.68,
    7: 24.59, 8: 24.50, 9: 23.80, 10: 21.50, 11: 17.80, 12: 14.20
}

STATE_COORDS = {
    "Arunachal Pradesh": (27.10, 93.62),
    "Assam": (26.20, 92.93),
    "Manipur": (24.66, 93.90),
    "Meghalaya": (25.57, 91.88),
    "Mizoram": (23.16, 92.83),
    "Nagaland": (26.15, 94.56),
    "Sikkim": (27.53, 88.51),
    "Tripura": (23.84, 91.28),
    "West Bengal": (27.04, 88.26),
}


@app.on_event("startup")
def load_model():
    global _MODEL, _META
    bundle = joblib.load(MODEL_PATH)
    _MODEL = bundle["pipeline"]
    _META = bundle


class Features(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    month: int = Field(ge=1, le=12)
    year: int = 2024
    temp_2m: Optional[float] = None
    state: str


def risk_level(p: float) -> str:
    if p >= 0.5:
        return "High"
    if p >= 0.2:
        return "Moderate"
    return "Low"


@app.get("/")
def root():
    return {
        "service": "GeoShield Landslide Model API",
        "status": "ok",
        "scope": _META.get("scope") if _META else None,
    }


@app.get("/health")
def health():
    return {"status": "ok", "metrics": _META.get("metrics") if _META else None}


@app.post("/predict")
def predict(features: Features):
    if _MODEL is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    import pandas as pd

    st = str(features.state)
    default_lat, default_lon = STATE_COORDS.get(st, (25.5, 92.0))
    lat = features.latitude if features.latitude is not None else default_lat
    lon = features.longitude if features.longitude is not None else default_lon
    t2m = features.temp_2m if features.temp_2m is not None else MONTHLY_TEMP_MAP.get(features.month, 20.0)
    is_monsoon = 1 if 5 <= features.month <= 9 else 0

    row = {
        "latitude": [lat],
        "longitude": [lon],
        "month": [features.month],
        "temp_2m": [t2m],
        "is_monsoon": [is_monsoon],
        "state": [st],
    }
    X = pd.DataFrame(row)
    proba = float(_MODEL.predict_proba(X)[0, 1])
    return {
        "state": st,
        "landslide_probability": round(proba, 4),
        "risk_level": risk_level(proba),
        "prediction": int(proba >= 0.5),
        "temperature_c": t2m,
        "is_monsoon": bool(is_monsoon),
    }


@app.get("/snapshot")
def snapshot():
    if not SNAPSHOT_PATH.exists():
        raise HTTPException(status_code=404, detail="Snapshot not generated")
    return json.loads(SNAPSHOT_PATH.read_text())


@app.get("/districts")
def districts():
    if not SNAPSHOT_PATH.exists():
        return {"districts": []}
    data = json.loads(SNAPSHOT_PATH.read_text())
    return {"districts": [d["state"] for d in data["states"]]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
