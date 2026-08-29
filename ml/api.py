import joblib
import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_PATH = Path(__file__).parent / "model_ne.joblib"
SNAPSHOT_PATH = Path(__file__).parent / "ne_snapshot.json"

app = FastAPI(title="GeoShield Landslide Model API", version="0.2.0")

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
    latitude: float = 0.0
    longitude: float = 0.0
    month: int = Field(ge=1, le=12)
    year: int = 2024
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

    row = {
        "latitude": [features.latitude],
        "longitude": [features.longitude],
        "month": [features.month],
        "year": [features.year],
        "state": [str(features.state)],
    }
    X = pd.DataFrame(row)
    proba = float(_MODEL.predict_proba(X)[0, 1])
    return {
        "state": features.state,
        "landslide_probability": round(proba, 4),
        "risk_level": risk_level(proba),
        "prediction": int(proba >= 0.5),
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
