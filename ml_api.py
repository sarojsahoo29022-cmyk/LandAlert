from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import joblib
import json
import numpy as np
import pandas as pd
import os
from datetime import datetime

app = FastAPI(title="GeoShield ML API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "ml_model", "rf_landslide_model.pkl")
META_PATH = os.path.join(BASE_DIR, "ml_model", "model_meta.json")
DATA_PATH = os.path.join(BASE_DIR, "datasets", "ne_india_landslide_enriched.csv")
RAINFALL_CSV = os.path.join(BASE_DIR, "Rainfall_Data_LL.csv")

model_raw = None
pipeline = None
meta = None
training_data = None
rainfall_lookup = None

MONTH_COLS = {1: "JAN", 2: "FEB", 3: "MAR", 4: "APR", 5: "MAY", 6: "JUN",
              7: "JUL", 8: "AUG", 9: "SEP", 10: "OCT", 11: "NOV", 12: "DEC"}

STATE_TO_SUBDIVISION = {
    "Arunachal Pradesh": "Arunachal Pradesh",
    "Assam": "Assam & Meghalaya",
    "Meghalaya": "Assam & Meghalaya",
    "Manipur": "Naga Mani Mizo Tripura",
    "Mizoram": "Naga Mani Mizo Tripura",
    "Nagaland": "Naga Mani Mizo Tripura",
    "Tripura": "Naga Mani Mizo Tripura",
    "Sikkim": "Sub Himalayan West Bengal & Sikkim",
    "West Bengal": "Sub Himalayan West Bengal & Sikkim",
}

STATE_AVG_COORDS = {}


def load_model():
    global model_raw, pipeline, meta, training_data, rainfall_lookup, STATE_AVG_COORDS
    if model_raw is None:
        model_raw = joblib.load(MODEL_PATH)
    if pipeline is None:
        if isinstance(model_raw, dict) and "pipeline" in model_raw:
            pipeline = model_raw["pipeline"]
        else:
            pipeline = model_raw
    if meta is None:
        with open(META_PATH) as f:
            meta = json.load(f)
    if training_data is None:
        training_data = pd.read_csv(DATA_PATH)
    if rainfall_lookup is None:
        rainfall_lookup = _build_rainfall_lookup()
    if not STATE_AVG_COORDS and training_data is not None:
        for st in training_data["state"].unique():
            sub = training_data[training_data["state"] == st]
            STATE_AVG_COORDS[st] = {"lat": float(sub["latitude"].mean()), "lon": float(sub["longitude"].mean())}


def _build_rainfall_lookup():
    rf = pd.read_csv(RAINFALL_CSV)
    rf["SUBDIVISION"] = rf["SUBDIVISION"].str.strip()
    lookup = {}
    for _, row in rf.iterrows():
        key = (row["SUBDIVISION"], int(row["YEAR"]))
        monthly = {m: float(row[MONTH_COLS[m]]) for m in range(1, 13)}
        lookup[key] = monthly
    return lookup


def get_rainfall(state: str, year: int, month: int) -> float:
    subdiv = STATE_TO_SUBDIVISION.get(state)
    if subdiv is None or rainfall_lookup is None:
        return 0.0
    key = (subdiv, year)
    if key in rainfall_lookup:
        return rainfall_lookup[key].get(month, 0.0)
    close = [(k, abs(k[1] - year)) for k in rainfall_lookup if k[0] == subdiv]
    if close:
        best = min(close, key=lambda x: x[1])[0]
        return rainfall_lookup[best].get(month, 0.0)
    return 0.0


def _get_rainfall_for_state_month(state: str, month: int) -> float:
    if training_data is not None:
        year = datetime.now().year
        return get_rainfall(state, year, month)
    return 0.0


@app.on_event("startup")
async def startup():
    load_model()


class PredictRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000, le=2030)
    state: str
    temp_2m: Optional[float] = None
    rainfall_mm: Optional[float] = None


def get_risk_level(prob: float) -> str:
    if prob < 0.25:
        return "Low"
    elif prob < 0.50:
        return "Moderate"
    elif prob < 0.75:
        return "High"
    else:
        return "Very High"


def get_temp_for_month_state(state: str, month: int) -> float:
    if training_data is not None:
        subset = training_data[(training_data["state"] == state) & (training_data["month"] == month)]
        if len(subset) > 0:
            return float(subset["temp_2m"].mean())
    return 21.0


def _predict_features(state: str, month: int, year: int, temp: float, rainfall: float, lat: float = None, lon: float = None):
    if lat is None or lon is None:
        coords = STATE_AVG_COORDS.get(state, {"lat": 26.0, "lon": 92.0})
        lat = coords["lat"]
        lon = coords["lon"]
    is_monsoon = 1 if month in [6, 7, 8, 9] else 0
    features = pd.DataFrame([{
        "latitude": lat, "longitude": lon, "month": month,
        "temp_2m": temp, "is_monsoon": is_monsoon, "rainfall_mm": rainfall, "state": state,
    }])
    prob = float(pipeline.predict_proba(features)[0][1])
    prediction = int(pipeline.predict(features)[0])
    risk_level = get_risk_level(prob)
    return prob, prediction, risk_level


@app.get("/health")
async def health():
    load_model()
    m = {}
    if meta and "metrics" in meta:
        m = meta["metrics"]
    elif isinstance(model_raw, dict) and "metrics" in model_raw:
        m = model_raw["metrics"]
    return {
        "status": "healthy",
        "model_loaded": pipeline is not None,
        "scope": meta.get("scope", "North-East India") if meta else "unknown",
        "features": meta.get("feature_names", []) if meta else [],
        "metrics": {
            "accuracy": m.get("accuracy", 0.78),
            "precision": m.get("precision", 0.57),
            "recall": m.get("recall", 0.49),
            "f1": m.get("f1", 0.53),
            "roc_auc": m.get("roc_auc", 0.82),
            "confusion_matrix": m.get("confusion_matrix", []),
            "positive_rate_train": m.get("positive_rate_train", 0.25),
        },
    }


@app.get("/districts")
async def districts():
    district_list = [
        {"name": name, "state": info["state"], "lat": info["lat"], "lon": info["lon"]}
        for name, info in STATE_COORDS.items()
    ]
    return {"districts": district_list}


@app.post("/predict")
async def predict(req: PredictRequest):
    load_model()

    state = req.state.strip()
    month = req.month
    year = req.year

    temp = req.temp_2m
    if temp is None:
        temp = get_temp_for_month_state(state, month)

    rainfall = req.rainfall_mm
    if rainfall is None:
        rainfall = get_rainfall(state, year, month)

    lat = req.latitude
    lon = req.longitude
    if lat is None or lon is None:
        coords = STATE_AVG_COORDS.get(state, {"lat": 26.0, "lon": 92.0})
        lat = coords["lat"]
        lon = coords["lon"]

    is_monsoon = 1 if month in [6, 7, 8, 9] else 0
    prob, prediction, risk_level = _predict_features(state, month, year, temp, rainfall, lat, lon)

    factors = {
        "rainfall_mm": f"{rainfall:.0f} mm",
        "rainfall_intensity": "HEAVY" if rainfall > 300 else ("MODERATE" if rainfall > 100 else "LOW"),
        "temperature": "ELEVATED" if temp > 22 else "MODERATE",
        "monsoon": "ACTIVE" if is_monsoon else "INACTIVE",
        "location": f"{lat:.2f}, {lon:.2f}",
        "historical_susceptibility": risk_level.upper(),
    }

    explanation = (
        f"Model predicts {risk_level} risk ({prob*100:.0f}%) for {state} in {datetime(year, month, 1).strftime('%B %Y')}. "
        f"Rainfall: {rainfall:.0f} mm ({'heavy' if rainfall > 300 else 'moderate' if rainfall > 100 else 'low'}). "
        f"Temperature: {temp:.1f} C. "
        f"{'Monsoon active.' if is_monsoon else 'Non-monsoon period.'}"
    )

    return {
        "district": state,
        "landslide_probability": round(prob, 4),
        "risk_level": risk_level,
        "prediction": prediction,
        "factors": factors,
        "explanation": explanation,
    }


@app.get("/snapshot")
async def snapshot():
    load_model()
    states = ["Meghalaya", "Mizoram", "Manipur", "Sikkim", "Arunachal Pradesh",
              "Assam", "Nagaland", "Tripura", "West Bengal"]
    results = []
    current_month = datetime.now().month
    current_year = datetime.now().year

    for st in states:
        temp = get_temp_for_month_state(st, current_month)
        rainfall = get_rainfall(st, current_year, current_month)
        prob, _, risk_level = _predict_features(st, current_month, current_year, temp, rainfall)

        count = len(training_data[training_data["state"] == st]) if training_data is not None else 0
        events = int((training_data[(training_data["state"] == st) & (training_data["landslide_occurred"] == 1)].shape[0])) if training_data is not None else 0

        results.append({
            "state": st,
            "risk_level": risk_level,
            "probability": round(prob, 4),
            "locations": count,
            "events": events,
            "temp_2m": round(temp, 1),
            "rainfall_mm": round(rainfall, 1),
        })

    return {"states": results, "month": current_month, "year": current_year}


@app.get("/states")
async def states():
    load_model()
    state_list = training_data["state"].unique().tolist() if training_data is not None else []
    return {"states": state_list}


@app.get("/history/{state_name}")
async def history(state_name: str):
    load_model()
    if training_data is None:
        return {"events": []}

    subset = training_data[training_data["state"] == state_name].copy()
    if len(subset) == 0:
        return {"events": []}

    events = []
    landslides = subset[subset["landslide_occurred"] == 1]
    for _, row in landslides.iterrows():
        yr = int(row["year"])
        mo = int(row["month"])
        rf = get_rainfall(state_name, yr, mo)
        events.append({
            "year": yr,
            "month": mo,
            "temp_2m": round(float(row["temp_2m"]), 2),
            "rainfall_mm": round(rf, 1),
            "is_monsoon": bool(row["is_monsoon"]),
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
        })

    total = len(subset)
    positive = len(landslides)
    return {
        "state": state_name,
        "total_records": total,
        "landslide_events": positive,
        "prevalence": round(positive / total, 4) if total > 0 else 0,
        "events": events,
    }


@app.get("/risk-summary")
async def risk_summary():
    load_model()
    snapshot_data = await snapshot()
    summary = {"low": 0, "moderate": 0, "high": 0, "very-high": 0}
    for st in snapshot_data["states"]:
        level = st["risk_level"].lower().replace(" ", "-")
        if level in summary:
            summary[level] += 1
    return {"summary": summary, "total": sum(summary.values())}


@app.get("/alerts")
async def alerts():
    load_model()
    snapshot_data = await snapshot()
    alerts_list = []
    alert_id = 1
    for st in snapshot_data["states"]:
        if st["risk_level"] in ["High", "Very High"]:
            alerts_list.append({
                "id": f"a{alert_id}",
                "level": st["risk_level"].lower().replace(" ", "-"),
                "label": st["risk_level"].upper(),
                "type": "Landslide Risk",
                "location": f"{st['state']}, India",
                "time": datetime.now().strftime("%H:%M"),
                "text": (
                    f"ML model detects {'elevated' if st['risk_level'] == 'High' else 'critical'} "
                    f"landslide risk in {st['state']} ({st['probability']*100:.0f}% probability). "
                    f"Temp: {st.get('temp_2m', 'N/A')} C, Rainfall: {st.get('rainfall_mm', 'N/A')} mm."
                ),
                "status": "active" if st["risk_level"] == "Very High" else "monitoring",
            })
            alert_id += 1
    return {"alerts": alerts_list, "total": len(alerts_list)}


STATE_COORDS = {
    "Shillong": {"lat": 25.5788, "lon": 91.8933, "state": "Meghalaya"},
    "Aizawl": {"lat": 23.7271, "lon": 92.7176, "state": "Mizoram"},
    "Imphal": {"lat": 24.8170, "lon": 93.9368, "state": "Manipur"},
    "Gangtok": {"lat": 27.3389, "lon": 88.6065, "state": "Sikkim"},
    "Itanagar": {"lat": 27.0844, "lon": 93.6053, "state": "Arunachal Pradesh"},
    "Guwahati": {"lat": 26.1445, "lon": 91.7362, "state": "Assam"},
    "Kohima": {"lat": 25.6586, "lon": 94.1086, "state": "Nagaland"},
    "Agartala": {"lat": 23.8315, "lon": 91.2869, "state": "Tripura"},
    "Tura": {"lat": 25.5134, "lon": 90.2028, "state": "Meghalaya"},
    "Dibrugarh": {"lat": 27.4728, "lon": 94.9120, "state": "Assam"},
    "Pasighat": {"lat": 28.0664, "lon": 95.3262, "state": "Arunachal Pradesh"},
    "Tezpur": {"lat": 26.6528, "lon": 92.6936, "state": "Assam"},
    "Silchar": {"lat": 24.8333, "lon": 92.7789, "state": "Assam"},
    "Jowai": {"lat": 25.4993, "lon": 92.1940, "state": "Meghalaya"},
    "Nongstoin": {"lat": 25.5198, "lon": 91.2638, "state": "Meghalaya"},
    "Mokokchung": {"lat": 26.3236, "lon": 94.5634, "state": "Nagaland"},
    "Mon Town": {"lat": 26.7819, "lon": 94.8313, "state": "Nagaland"},
    "Tuensang": {"lat": 26.2670, "lon": 94.8243, "state": "Nagaland"},
    "Wokha": {"lat": 26.0882, "lon": 94.2598, "state": "Nagaland"},
    "Zunheboto": {"lat": 26.0113, "lon": 94.5197, "state": "Nagaland"},
    "Longleng": {"lat": 26.5321, "lon": 94.9258, "state": "Nagaland"},
    "Peren": {"lat": 25.5381, "lon": 93.7402, "state": "Nagaland"},
    "Dimapur": {"lat": 25.9044, "lon": 93.7264, "state": "Nagaland"},
    "Churachandpur": {"lat": 24.3333, "lon": 93.6833, "state": "Manipur"},
    "Thoubal": {"lat": 24.6333, "lon": 94.0167, "state": "Manipur"},
    "Ukhrul": {"lat": 25.1000, "lon": 94.3667, "state": "Manipur"},
    "Chandel": {"lat": 24.3333, "lon": 94.6833, "state": "Manipur"},
    "Senapati": {"lat": 25.4500, "lon": 94.0167, "state": "Manipur"},
    "Tamenglong": {"lat": 24.9833, "lon": 93.5000, "state": "Manipur"},
    "Darjeeling": {"lat": 27.0410, "lon": 88.2663, "state": "West Bengal"},
    "Kalimpong": {"lat": 27.0500, "lon": 88.4500, "state": "West Bengal"},
    "Kurseong": {"lat": 26.8833, "lon": 88.2833, "state": "West Bengal"},
    "Siliguri": {"lat": 26.7167, "lon": 88.4167, "state": "West Bengal"},
    "Namchi": {"lat": 27.1667, "lon": 88.3500, "state": "Sikkim"},
    "Gyalshing": {"lat": 27.2833, "lon": 88.2500, "state": "Sikkim"},
    "Mangan": {"lat": 27.5167, "lon": 88.5333, "state": "Sikkim"},
    "Rangpo": {"lat": 27.1833, "lon": 88.5333, "state": "Sikkim"},
    "Jorethang": {"lat": 27.1000, "lon": 88.3167, "state": "Sikkim"},
    "Singtam": {"lat": 27.2333, "lon": 88.5000, "state": "Sikkim"},
    "Rangia": {"lat": 26.4500, "lon": 91.6167, "state": "Assam"},
    "Nalbari": {"lat": 26.4333, "lon": 91.4333, "state": "Assam"},
    "Mangaldoi": {"lat": 26.4333, "lon": 92.0333, "state": "Assam"},
    "Nagaon": {"lat": 26.3500, "lon": 92.6833, "state": "Assam"},
    "Jorhat": {"lat": 26.7500, "lon": 94.2167, "state": "Assam"},
    "Sivasagar": {"lat": 26.9833, "lon": 94.6333, "state": "Assam"},
    "Lakhimpur": {"lat": 27.2333, "lon": 94.1000, "state": "Assam"},
    "Tinsukia": {"lat": 27.4833, "lon": 95.3500, "state": "Assam"},
    "Golaghat": {"lat": 26.5167, "lon": 93.9667, "state": "Assam"},
    "Karbi Anglong": {"lat": 26.1000, "lon": 93.3500, "state": "Assam"},
    "Dima Hasao": {"lat": 25.4000, "lon": 93.1000, "state": "Assam"},
    "Cachar": {"lat": 24.7833, "lon": 92.7833, "state": "Assam"},
    "Hailakandi": {"lat": 24.6833, "lon": 92.5667, "state": "Assam"},
    "Karimganj": {"lat": 24.8667, "lon": 92.3500, "state": "Assam"},
}
