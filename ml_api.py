from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import joblib
import json
import numpy as np
import pandas as pd
import os
import math
import httpx
from datetime import datetime
from twilio.rest import Client as TwilioClient
from dotenv import load_dotenv

load_dotenv()
load_dotenv(".env.local")

app = FastAPI(title="LandAlert ML API", version="4.0.0")

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
TERRAIN_CSV = os.path.join(BASE_DIR, "datasets", "ne_terrain_lookup.csv")

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# Initialize Twilio client
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

model_raw = None
pipeline = None
meta = None
training_data = None
rainfall_lookup = None
terrain_lookup = None

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
    global model_raw, pipeline, meta, training_data, rainfall_lookup, terrain_lookup, STATE_AVG_COORDS
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
    if terrain_lookup is None:
        terrain_lookup = _build_terrain_lookup()
        print(f"[startup] Terrain lookup loaded: {len(terrain_lookup)} entries")
    if not STATE_AVG_COORDS and training_data is not None:
        for st in training_data["state"].unique():
            sub = training_data[training_data["state"] == st]
            avg_lat = float(sub["latitude"].mean())
            avg_lon = float(sub["longitude"].mean())
            
            # Compute average terrain for this state from all coordinates
            state_terrains = []
            for _, row in sub.iterrows():
                key = (round(row["latitude"], 4), round(row["longitude"], 4))
                if key in terrain_lookup:
                    state_terrains.append(terrain_lookup[key])
            
            if state_terrains:
                elev_vals = [t["elevation_m"] for t in state_terrains if t.get("elevation_m") is not None and not np.isnan(t.get("elevation_m"))]
                slope_vals = [t["slope_deg"] for t in state_terrains if t.get("slope_deg") is not None and not np.isnan(t.get("slope_deg"))]
                avg_elev = float(np.mean(elev_vals)) if elev_vals else 500.0
                avg_slope = float(np.mean(slope_vals)) if slope_vals else 20.0
            else:
                avg_elev = 500.0
                avg_slope = 20.0
            
            if np.isnan(avg_elev):
                avg_elev = 500.0
            if np.isnan(avg_slope):
                avg_slope = 20.0
            
            STATE_AVG_COORDS[st] = {
                "lat": avg_lat,
                "lon": avg_lon,
                "elevation_m": avg_elev,
                "slope_deg": avg_slope,
            }
        print(f"[startup] State avg coords computed for {len(STATE_AVG_COORDS)} states")
        for st, coords in list(STATE_AVG_COORDS.items())[:3]:
            print(f"  {st}: elev={coords['elevation_m']:.0f}m, slope={coords['slope_deg']:.1f}deg")


def _build_rainfall_lookup():
    rf = pd.read_csv(RAINFALL_CSV)
    rf["SUBDIVISION"] = rf["SUBDIVISION"].str.strip()
    lookup = {}
    for _, row in rf.iterrows():
        key = (row["SUBDIVISION"], int(row["YEAR"]))
        monthly = {m: float(row[MONTH_COLS[m]]) for m in range(1, 13)}
        lookup[key] = monthly
    return lookup


def _build_terrain_lookup():
    """Load terrain lookup from CSV (elevation + slope per coordinate)."""
    lookup = {}
    if os.path.exists(TERRAIN_CSV):
        try:
            terrain_df = pd.read_csv(TERRAIN_CSV)
            for _, row in terrain_df.iterrows():
                key = (round(row["latitude"], 4), round(row["longitude"], 4))
                lookup[key] = {
                    "elevation_m": float(row["elevation_m"]),
                    "slope_deg": float(row["slope_deg"]),
                }
        except Exception as e:
            print(f"Warning: Could not load terrain data: {e}")
    return lookup


def _get_terrain_for_coords(lat: float, lon: float) -> dict:
    """Get terrain data for coordinates, with fallback to state defaults."""
    if terrain_lookup:
        # Try exact match first
        key = (round(lat, 4), round(lon, 4))
        if key in terrain_lookup:
            return terrain_lookup[key]
        
        # Try nearest neighbor (within 0.05 degrees ~ 5km)
        min_dist = float("inf")
        best = None
        for (tlat, tlon), terrain in terrain_lookup.items():
            dist = ((lat - tlat) ** 2 + (lon - tlon) ** 2) ** 0.5
            if dist < min_dist and dist < 0.05:
                min_dist = dist
                best = terrain
        if best:
            return best
    
    # Fallback: return default terrain
    return {"elevation_m": 500.0, "slope_deg": 20.0}


def _get_state_terrain(state: str) -> dict:
    """Get average terrain for a state."""
    if STATE_AVG_COORDS and state in STATE_AVG_COORDS:
        return {
            "elevation_m": STATE_AVG_COORDS[state].get("elevation_m", 500),
            "slope_deg": STATE_AVG_COORDS[state].get("slope_deg", 20),
        }
    return {"elevation_m": 500.0, "slope_deg": 20.0}


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


def send_sms(to_number: str, message: str) -> dict:
    """Send SMS via Twilio."""
    if not twilio_client:
        return {"success": False, "error": "Twilio client not configured"}
    
    try:
        sms = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to_number
        )
        return {"success": True, "sid": sms.sid, "status": sms.status}
    except Exception as e:
        return {"success": False, "error": str(e)}


def send_alert_sms(alerts: list, to_number: str) -> list:
    """Send SMS alerts for High and Very High risk states."""
    results = []
    for alert in alerts:
        if alert.get("risk_level") in ["High", "Very High"]:
            message = (
                f"LandAlert: {alert['risk_level'].upper()} landslide risk in {alert['state']} "
                f"({alert['probability']*100:.0f}% probability). "
                f"Rainfall: {alert.get('rainfall_mm', 0):.0f}mm, "
                f"Elevation: {alert.get('elevation_m', 0):.0f}m, "
                f"Slope: {alert.get('slope_deg', 0):.1f}°. "
                f"Monitor conditions closely."
            )
            result = send_sms(to_number, message)
            results.append({
                "state": alert["state"],
                "risk_level": alert["risk_level"],
                "sms_result": result
            })
    return results


# ============================================================
# LIVE DATA SERVICES (Open-Meteo - Free, no API key required)
# ============================================================

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
HTTP_TIMEOUT = 10.0


async def geocode_location(query: str) -> dict:
    """Convert location name to lat/lon using Open-Meteo Geocoding API."""
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(GEOCODING_URL, params={
                "name": query,
                "count": 5,
                "language": "en",
                "format": "json",
            })
            resp.raise_for_status()
            data = resp.json()
            results = data.get("results", [])
            if not results:
                return {"success": False, "error": "Location not found"}
            best = results[0]
            return {
                "success": True,
                "latitude": best["latitude"],
                "longitude": best["longitude"],
                "name": best.get("name", query),
                "admin1": best.get("admin1", ""),
                "country": best.get("country", "India"),
                "elevation": best.get("elevation", None),
                "timezone": best.get("timezone", "Asia/Kolkata"),
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


async def fetch_live_weather(lat: float, lon: float) -> dict:
    """Fetch current weather from Open-Meteo API."""
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(WEATHER_URL, params={
                "latitude": lat,
                "longitude": lon,
                "current": ",".join([
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation",
                    "rain",
                    "wind_speed_10m",
                    "pressure_msl",
                ]),
                "timezone": "Asia/Kolkata",
            })
            resp.raise_for_status()
            data = resp.json()
            current = data.get("current", {})
            return {
                "success": True,
                "temperature_2m": current.get("temperature_2m", None),
                "relative_humidity_2m": current.get("relative_humidity_2m", None),
                "precipitation_mm": current.get("precipitation", None),
                "rain_mm": current.get("rain", None),
                "wind_speed_kmh": current.get("wind_speed_10m", None),
                "pressure_hpa": current.get("pressure_msl", None),
                "time": current.get("time", None),
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


async def fetch_forecast_rainfall(lat: float, lon: float, days: int = 3) -> dict:
    """Fetch recent + forecast rainfall from Open-Meteo."""
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(WEATHER_URL, params={
                "latitude": lat,
                "longitude": lon,
                "daily": "precipitation_sum",
                "past_days": days,
                "forecast_days": 1,
                "timezone": "Asia/Kolkata",
            })
            resp.raise_for_status()
            data = resp.json()
            daily = data.get("daily", {})
            precip_values = daily.get("precipitation_sum", [])
            precip_values = [v for v in precip_values if v is not None]
            if not precip_values:
                return {"success": True, "total_mm": 0.0, "daily": [], "source": "open-meteo"}
            total = sum(precip_values)
            return {
                "success": True,
                "total_mm": round(total, 1),
                "daily": precip_values,
                "source": "open-meteo",
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


async def fetch_elevation(lat: float, lon: float) -> dict:
    """Fetch elevation from Open-Meteo DEM API."""
    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(ELEVATION_URL, params={
                "latitude": lat,
                "longitude": lon,
            })
            resp.raise_for_status()
            data = resp.json()
            elevations = data.get("elevation", [])
            elev = elevations[0] if elevations else None
            return {
                "success": elev is not None,
                "elevation_m": elev,
                "source": "open-meteo-dem",
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


async def fetch_elevation_grid(lat: float, lon: float, grid_size: int = 3, spacing: float = 0.003) -> dict:
    """Fetch elevation grid around a point for slope calculation.
    spacing ~0.003 degrees ~ 300m for local slope estimation."""
    try:
        lats = []
        lons = []
        half = grid_size // 2
        for i in range(grid_size):
            for j in range(grid_size):
                lats.append(round(lat + (i - half) * spacing, 6))
                lons.append(round(lon + (j - half) * spacing, 6))

        lat_str = ",".join(str(v) for v in lats)
        lon_str = ",".join(str(v) for v in lons)

        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(ELEVATION_URL, params={
                "latitude": lat_str,
                "longitude": lon_str,
            })
            resp.raise_for_status()
            data = resp.json()
            elevations = data.get("elevation", [])

            if len(elevations) != grid_size * grid_size:
                return {"success": False, "error": "Incomplete elevation grid"}

            grid = []
            idx = 0
            for i in range(grid_size):
                row = []
                for j in range(grid_size):
                    row.append(elevations[idx])
                    idx += 1
                grid.append(row)

            center = grid[half][half]
            slope_deg = _compute_slope_from_grid(grid, spacing)

            return {
                "success": True,
                "elevation_m": center,
                "slope_deg": round(slope_deg, 2),
                "source": "open-meteo-dem",
                "grid_size": grid_size,
                "spacing_deg": spacing,
            }
    except Exception as e:
        return {"success": False, "error": str(e)}


def _compute_slope_from_grid(grid: list, spacing_deg: float) -> float:
    """Compute slope in degrees from an elevation grid using central differences.
    
    Uses the 3x3 elevation grid to compute partial derivatives:
      dz/dx = (E[right] - E[left]) / (2 * dx_meters)
      dz/dy = (E[bottom] - E[top]) / (2 * dy_meters)
    slope = atan(sqrt(dz_dx^2 + dz_dy^2))
    """
    size = len(grid)
    half = size // 2

    # Convert spacing in degrees to approximate meters
    lat_m = 111320.0  # meters per degree latitude
    lon_m = 111320.0 * math.cos(math.radians(grid[half][half]))  # adjusted for latitude
    dx = spacing_deg * lon_m
    dy = spacing_deg * lat_m

    # Central differences
    dz_dx = (grid[half][half + 1] - grid[half][half - 1]) / (2 * dx) if half + 1 < size and half - 1 >= 0 else 0
    dz_dy = (grid[half + 1][half] - grid[half - 1][half]) / (2 * dy) if half + 1 < size and half - 1 >= 0 else 0

    slope_rad = math.atan(math.sqrt(dz_dx ** 2 + dz_dy ** 2))
    return math.degrees(slope_rad)


async def reverse_geocode_state(lat: float, lon: float) -> str:
    """Determine NE India state from coordinates using nearest-district heuristic."""
    best_state = "Assam"
    min_dist = float("inf")
    for name, info in STATE_COORDS.items():
        dist = ((lat - info["lat"]) ** 2 + (lon - info["lon"]) ** 2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            best_state = info["state"]
    return best_state


async def fetch_live_data_bundle(lat: float, lon: float) -> dict:
    """Fetch all live data for a location in parallel.
    Returns weather, terrain, and slope data."""
    import asyncio

    weather_task = fetch_live_weather(lat, lon)
    forecast_task = fetch_forecast_rainfall(lat, lon, days=3)
    grid_task = fetch_elevation_grid(lat, lon, grid_size=3, spacing=0.003)

    results = await asyncio.gather(
        weather_task, forecast_task, grid_task, return_exceptions=True
    )

    weather = results[0] if isinstance(results[0], dict) else {"success": False, "error": str(results[0])}
    forecast = results[1] if isinstance(results[1], dict) else {"success": False, "error": str(results[1])}
    terrain = results[2] if isinstance(results[2], dict) else {"success": False, "error": str(results[2])}

    # Assemble live values
    temp = weather.get("temperature_2m") if weather.get("success") else None
    rainfall = forecast.get("total_mm", 0.0) if forecast.get("success") else None
    elevation_m = terrain.get("elevation_m") if terrain.get("success") else None
    slope_deg = terrain.get("slope_deg") if terrain.get("success") else None

    data_status = {
        "weather": "LIVE" if weather.get("success") else "FALLBACK",
        "rainfall": "LIVE" if forecast.get("success") else "FALLBACK",
        "terrain": "LIVE" if terrain.get("success") else "FALLBACK",
        "overall": "LIVE" if all([weather.get("success"), forecast.get("success"), terrain.get("success")]) else "PARTIAL",
    }

    return {
        "temp_2m": temp,
        "rainfall_mm": rainfall,
        "elevation_m": elevation_m,
        "slope_deg": slope_deg,
        "weather_raw": weather,
        "forecast_raw": forecast,
        "terrain_raw": terrain,
        "data_status": data_status,
    }


PREDICTION_HISTORY_PATH = os.path.join(BASE_DIR, "datasets", "prediction_history.json")


def _load_prediction_history() -> list:
    if os.path.exists(PREDICTION_HISTORY_PATH):
        try:
            with open(PREDICTION_HISTORY_PATH) as f:
                return json.load(f)
        except Exception:
            pass
    return []


def _save_prediction(entry: dict):
    history = _load_prediction_history()
    history.append(entry)
    # Keep last 500 predictions
    if len(history) > 500:
        history = history[-500:]
    os.makedirs(os.path.dirname(PREDICTION_HISTORY_PATH), exist_ok=True)
    with open(PREDICTION_HISTORY_PATH, "w") as f:
        json.dump(history, f, indent=2)


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
    elevation_m: Optional[float] = None
    slope_deg: Optional[float] = None


class SendSmsRequest(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+[1-9]\d{1,14}$")
    send_to_all: bool = False


class PredictLiveRequest(BaseModel):
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


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


def _predict_features(state: str, month: int, year: int, temp: float, rainfall: float,
                      lat: float = None, lon: float = None,
                      elevation_m: float = None, slope_deg: float = None):
    state_coords = STATE_AVG_COORDS.get(state, {"lat": 26.0, "lon": 92.0, "elevation_m": 500, "slope_deg": 20})
    
    if lat is None or lon is None:
        lat = state_coords["lat"]
        lon = state_coords["lon"]
    
    if elevation_m is None or slope_deg is None:
        if lat == state_coords["lat"] and lon == state_coords["lon"]:
            elevation_m = state_coords.get("elevation_m", 500.0)
            slope_deg = state_coords.get("slope_deg", 20.0)
        else:
            terrain = _get_terrain_for_coords(lat, lon)
            if elevation_m is None:
                elevation_m = terrain.get("elevation_m", 500.0)
            if slope_deg is None:
                slope_deg = terrain.get("slope_deg", 20.0)
    
    if elevation_m is None or np.isnan(elevation_m):
        elevation_m = 500.0
    if slope_deg is None or np.isnan(slope_deg):
        slope_deg = 20.0

    is_monsoon = 1 if month in [6, 7, 8, 9] else 0
    
    # Build features based on model version
    feature_names = meta.get("feature_names", []) if meta else []
    
    if "elevation_m" in feature_names and "slope_deg" in feature_names:
        # v3 model with terrain
        features = pd.DataFrame([{
            "latitude": lat, "longitude": lon, "month": month,
            "temp_2m": temp, "is_monsoon": is_monsoon, "rainfall_mm": rainfall,
            "elevation_m": elevation_m, "slope_deg": slope_deg, "state": state,
        }])
    else:
        # v2 model without terrain
        features = pd.DataFrame([{
            "latitude": lat, "longitude": lon, "month": month,
            "temp_2m": temp, "is_monsoon": is_monsoon, "rainfall_mm": rainfall, "state": state,
        }])
    
    prob = float(pipeline.predict_proba(features)[0][1])
    prediction = int(pipeline.predict(features)[0])
    risk_level = get_risk_level(prob)
    return prob, prediction, risk_level, elevation_m, slope_deg


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


@app.get("/feature-importance")
async def feature_importance():
    """Return model feature importance (permutation importance) for explainability."""
    load_model()
    
    perm_importance = meta.get("feature_importances", {}) if meta else {}
    native_importance = meta.get("native_feature_importances", {}) if meta else {}
    
    # Build ranked list sorted by absolute importance
    features = []
    for fname, score in perm_importance.items():
        if fname.startswith("state_"):
            continue  # Skip one-hot encoded state features
        features.append({
            "feature": fname,
            "importance": round(score, 4),
            "abs_importance": round(abs(score), 4),
            "direction": "positive" if score > 0 else "negative" if score < 0 else "neutral",
        })
    
    features.sort(key=lambda x: x["abs_importance"], reverse=True)
    
    # Add rank
    for i, f in enumerate(features):
        f["rank"] = i + 1
    
    # Compute normalized weights (0-100 scale)
    max_imp = max((f["abs_importance"] for f in features), default=1)
    if max_imp > 0:
        for f in features:
            f["weight_pct"] = round((f["abs_importance"] / max_imp) * 100, 1)
    else:
        for f in features:
            f["weight_pct"] = 0
    
    return {
        "features": features,
        "model_version": meta.get("model_version", "unknown") if meta else "unknown",
        "total_features": len(features),
        "method": "permutation_importance",
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

    elevation_m = req.elevation_m
    slope_deg = req.slope_deg

    is_monsoon = 1 if month in [6, 7, 8, 9] else 0
    prob, prediction, risk_level, elev, slope = _predict_features(
        state, month, year, temp, rainfall, lat, lon, elevation_m, slope_deg
    )

    # Classify terrain steepness
    slope_category = "FLAT" if slope < 5 else ("MODERATE" if slope < 20 else ("STEEP" if slope < 35 else "VERY STEEP"))
    
    # Classify elevation zone
    elev_zone = "LOWLAND" if elev < 300 else ("HILLS" if elev < 1000 else ("MOUNTAIN" if elev < 3000 else "HIGH MOUNTAIN"))

    factors = {
        "rainfall_mm": f"{rainfall:.0f} mm",
        "rainfall_intensity": "HEAVY" if rainfall > 300 else ("MODERATE" if rainfall > 100 else "LOW"),
        "temperature": "ELEVATED" if temp > 22 else "MODERATE",
        "monsoon": "ACTIVE" if is_monsoon else "INACTIVE",
        "elevation": f"{elev:.0f} m ({elev_zone})",
        "slope": f"{slope:.1f} degrees ({slope_category})",
        "location": f"{lat:.2f}, {lon:.2f}",
        "historical_susceptibility": risk_level.upper(),
    }

    explanation = (
        f"Model predicts {risk_level} risk ({prob*100:.0f}%) for {state} in {datetime(year, month, 1).strftime('%B %Y')}. "
        f"Rainfall: {rainfall:.0f} mm ({'heavy' if rainfall > 300 else 'moderate' if rainfall > 100 else 'low'}). "
        f"Temperature: {temp:.1f} C. "
        f"Elevation: {elev:.0f} m ({elev_zone}). Slope: {slope:.1f} deg ({slope_category}). "
        f"{'Monsoon active.' if is_monsoon else 'Non-monsoon period.'}"
    )

    return {
        "district": state,
        "landslide_probability": round(prob, 4),
        "risk_level": risk_level,
        "prediction": prediction,
        "factors": factors,
        "explanation": explanation,
        "terrain": {
            "elevation_m": round(elev, 1),
            "slope_deg": round(slope, 2),
            "elevation_zone": elev_zone,
            "slope_category": slope_category,
        },
    }


@app.post("/predict-explain")
async def predict_explain(req: PredictRequest):
    """Predict and return per-prediction feature contribution analysis.
    
    Uses feature deviation from training means to estimate each factor's
    contribution to the risk score (SHAP-like approximation).
    """
    load_model()
    
    state = req.state.strip()
    month = req.month
    year = req.year

    temp = req.temp_2m if req.temp_2m is not None else get_temp_for_month_state(state, month)
    rainfall = req.rainfall_mm if req.rainfall_mm is not None else get_rainfall(state, year, month)

    lat = req.latitude
    lon = req.longitude
    if lat is None or lon is None:
        coords = STATE_AVG_COORDS.get(state, {"lat": 26.0, "lon": 92.0})
        lat = coords["lat"]
        lon = coords["lon"]

    elevation_m = req.elevation_m
    slope_deg = req.slope_deg
    if elevation_m is None or slope_deg is None:
        terrain = _get_terrain_for_coords(lat, lon)
        if elevation_m is None:
            elevation_m = terrain.get("elevation_m", 500.0)
        if slope_deg is None:
            slope_deg = terrain.get("slope_deg", 20.0)

    prob, prediction, risk_level, elev, slope = _predict_features(
        state, month, year, temp, rainfall, lat, lon, elevation_m, slope_deg
    )

    # Compute training set means for deviation analysis
    train_means = {}
    train_stds = {}
    if training_data is not None:
        numeric_cols = ["latitude", "longitude", "month", "temp_2m", "rainfall_mm", "elevation_m", "slope_deg"]
        for col in numeric_cols:
            if col in training_data.columns:
                vals = training_data[col].dropna()
                train_means[col] = float(vals.mean())
                train_stds[col] = float(vals.std()) if vals.std() > 0 else 1.0

    # Feature values for this prediction
    pred_values = {
        "latitude": lat,
        "longitude": lon,
        "month": month,
        "temp_2m": temp,
        "rainfall_mm": rainfall,
        "elevation_m": elev,
        "slope_deg": slope,
    }

    # Compute deviations and estimated contributions
    perm_imp = meta.get("feature_importances", {}) if meta else {}
    contributions = []
    
    for fname, imp_score in perm_imp.items():
        if fname.startswith("state_") or fname == "is_monsoon":
            continue
        
        val = pred_values.get(fname, 0)
        mean = train_means.get(fname, val)
        std = train_stds.get(fname, 1.0)
        deviation = (val - mean) / std  # z-score
        
        # Contribution = importance * deviation direction
        contribution = imp_score * deviation
        
        contributions.append({
            "feature": fname,
            "value": round(val, 2),
            "training_mean": round(mean, 2),
            "deviation_zscore": round(deviation, 2),
            "importance": round(imp_score, 4),
            "contribution": round(contribution, 4),
            "direction": "increases_risk" if contribution > 0 else "decreases_risk" if contribution < 0 else "neutral",
            "impact_level": "HIGH" if abs(contribution) > 0.01 else "MEDIUM" if abs(contribution) > 0.005 else "LOW",
        })

    contributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    # Build explanation text
    top_factors = [c for c in contributions if c["direction"] == "increases_risk"][:3]
    decrease_factors = [c for c in contributions if c["direction"] == "decreases_risk"][:2]

    explanation_parts = [f"ML model predicts {risk_level} risk ({prob*100:.0f}%) for {state}."]
    
    if top_factors:
        inc_names = [f["feature"].replace("_mm", "").replace("_m", "").replace("_deg", "").replace("_2m", "") for f in top_factors]
        explanation_parts.append(f"Primary risk drivers: {', '.join(inc_names)}.")
    
    if decrease_factors:
        dec_names = [f["feature"].replace("_mm", "").replace("_m", "").replace("_deg", "").replace("_2m", "") for f in decrease_factors]
        explanation_parts.append(f"Factors reducing risk: {', '.join(dec_names)}.")

    return {
        "risk_level": risk_level,
        "probability": round(prob, 4),
        "contributions": contributions,
        "explanation": " ".join(explanation_parts),
        "top_risk_drivers": [c["feature"] for c in contributions if c["direction"] == "increases_risk"][:3],
        "top_risk_reducers": [c["feature"] for c in contributions if c["direction"] == "decreases_risk"][:2],
    }


@app.get("/geocode")
async def geocode(q: str = ""):
    """Geocode a location name to coordinates using Open-Meteo."""
    if not q.strip():
        return {"success": False, "error": "Query is empty"}
    result = await geocode_location(q.strip())
    return result


@app.post("/predict-live")
async def predict_live(req: PredictLiveRequest):
    """Full live prediction: geocode -> weather -> terrain -> slope -> ML model.
    
    This is the main endpoint for the live data flow.
    Input: location name or coordinates.
    Output: risk prediction with live environmental data.
    """
    load_model()

    # Step 1: Resolve coordinates
    lat = req.latitude
    lon = req.longitude
    location_name = req.location.strip()

    if lat is None or lon is None:
        geo = await geocode_location(location_name)
        if not geo.get("success"):
            return {
                "success": False,
                "error": f"Could not geocode location: {location_name}",
                "data_status": {"overall": "FAILED"},
            }
        lat = geo["latitude"]
        lon = geo["longitude"]
        if not location_name or location_name == "":
            location_name = geo.get("name", "Unknown")
        location_name = f"{location_name}, {geo.get('admin1', '')}, {geo.get('country', '')}".strip(", ")

    # Step 2: Determine state from coordinates
    state = await reverse_geocode_state(lat, lon)

    # Step 3: Fetch live environmental data
    live = await fetch_live_data_bundle(lat, lon)

    # Step 4: Resolve feature values (live -> fallback to historical)
    now = datetime.now()
    month = now.month
    year = now.year
    is_monsoon = 1 if month in [5, 6, 7, 8, 9] else 0

    temp = live["temp_2m"] if live["temp_2m"] is not None else get_temp_for_month_state(state, month)
    rainfall = live["rainfall_mm"] if live["rainfall_mm"] is not None else get_rainfall(state, year, month)
    elevation_m = live["elevation_m"] if live["elevation_m"] is not None else 500.0
    slope_deg = live["slope_deg"] if live["slope_deg"] is not None else 20.0

    # Safety defaults
    if temp is None or (isinstance(temp, float) and math.isnan(temp)):
        temp = 21.0
    if rainfall is None or (isinstance(rainfall, float) and math.isnan(rainfall)):
        rainfall = 0.0
    if elevation_m is None or (isinstance(elevation_m, float) and math.isnan(elevation_m)):
        elevation_m = 500.0
    if slope_deg is None or (isinstance(slope_deg, float) and math.isnan(slope_deg)):
        slope_deg = 20.0

    # Step 5: ML prediction
    prob, prediction, risk_level, elev, slope = _predict_features(
        state, month, year, temp, rainfall, lat, lon, elevation_m, slope_deg
    )

    # Step 6: Classify terrain
    slope_category = "FLAT" if slope < 5 else ("MODERATE" if slope < 20 else ("STEEP" if slope < 35 else "VERY STEEP"))
    elev_zone = "LOWLAND" if elev < 300 else ("HILLS" if elev < 1000 else ("MOUNTAIN" if elev < 3000 else "HIGH MOUNTAIN"))

    # Step 7: Build factors
    factors = {
        "rainfall_mm": f"{rainfall:.0f} mm",
        "rainfall_intensity": "HEAVY" if rainfall > 300 else ("MODERATE" if rainfall > 100 else "LOW"),
        "temperature": f"{temp:.1f} C",
        "temperature_status": "ELEVATED" if temp > 22 else ("MODERATE" if temp > 15 else "LOW"),
        "monsoon": "ACTIVE" if is_monsoon else "INACTIVE",
        "elevation": f"{elev:.0f} m ({elev_zone})",
        "slope": f"{slope:.1f} degrees ({slope_category})",
        "location": f"{lat:.4f}, {lon:.4f}",
        "historical_susceptibility": risk_level.upper(),
    }

    # Step 8: Explanation
    explanation = (
        f"LandAlert analysis for {location_name} ({state}). "
        f"ML model predicts {risk_level} risk ({prob*100:.0f}% probability) "
        f"in {now.strftime('%B %Y')}. "
        f"Live rainfall: {rainfall:.0f} mm ({'heavy' if rainfall > 300 else 'moderate' if rainfall > 100 else 'low'}). "
        f"Temperature: {temp:.1f} C. "
        f"Elevation: {elev:.0f} m ({elev_zone}). Slope: {slope:.1f} deg ({slope_category}). "
        f"{'Monsoon active.' if is_monsoon else 'Non-monsoon period.'}"
    )

    # Save to prediction history
    try:
        _save_prediction({
            "location": location_name,
            "state": state,
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "risk_level": risk_level,
            "probability": round(prob, 4),
            "rainfall_mm": round(rainfall, 1),
            "temperature_c": round(temp, 1),
            "elevation_m": round(elev, 1),
            "slope_deg": round(slope, 2),
            "data_status": live["data_status"]["overall"],
            "timestamp": now.isoformat(),
        })
    except Exception:
        pass

    return {
        "success": True,
        "location": location_name,
        "state": state,
        "latitude": round(lat, 4),
        "longitude": round(lon, 4),
        "landslide_probability": round(prob, 4),
        "risk_level": risk_level,
        "prediction": prediction,
        "factors": factors,
        "explanation": explanation,
        "terrain": {
            "elevation_m": round(elev, 1),
            "slope_deg": round(slope, 2),
            "elevation_zone": elev_zone,
            "slope_category": slope_category,
        },
        "live_data": {
            "weather": {
                "temperature_c": round(temp, 1),
                "humidity_pct": live["weather_raw"].get("relative_humidity_2m"),
                "wind_speed_kmh": live["weather_raw"].get("wind_speed_kmh"),
                "pressure_hpa": live["weather_raw"].get("pressure_hpa"),
                "precipitation_mm": live["weather_raw"].get("precipitation_mm"),
            },
            "rainfall_forecast": {
                "recent_days_mm": live["forecast_raw"].get("total_mm", 0),
                "daily_breakdown": live["forecast_raw"].get("daily", []),
            },
            "terrain": {
                "elevation_m": round(elev, 1),
                "slope_deg": round(slope, 2),
                "elevation_zone": elev_zone,
                "slope_category": slope_category,
            },
        },
        "data_status": live["data_status"],
        "timestamp": now.isoformat(),
        "month": month,
        "year": year,
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
        prob, _, risk_level, elev, slope = _predict_features(st, current_month, current_year, temp, rainfall)

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
            "elevation_m": round(elev, 0),
            "slope_deg": round(slope, 1),
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
        terrain = _get_terrain_for_coords(float(row["latitude"]), float(row["longitude"]))
        events.append({
            "year": yr,
            "month": mo,
            "temp_2m": round(float(row["temp_2m"]), 2),
            "rainfall_mm": round(rf, 1),
            "is_monsoon": bool(row["is_monsoon"]),
            "latitude": float(row["latitude"]),
            "longitude": float(row["longitude"]),
            "elevation_m": round(terrain.get("elevation_m", 0), 0),
            "slope_deg": round(terrain.get("slope_deg", 0), 1),
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
                    f"Temp: {st.get('temp_2m', 'N/A')} C, Rainfall: {st.get('rainfall_mm', 'N/A')} mm. "
                    f"Elevation: {st.get('elevation_m', 'N/A')} m, Slope: {st.get('slope_deg', 'N/A')} deg."
                ),
                "status": "active" if st["risk_level"] == "Very High" else "monitoring",
            })
            alert_id += 1
    return {"alerts": alerts_list, "total": len(alerts_list)}


@app.post("/send-sms")
async def send_sms_alert(req: SendSmsRequest):
    """Send SMS alerts to monitoring numbers."""
    load_model()
    snapshot_data = await snapshot()
    
    recipients = ["+918926071764", "+919078461972"]
    if req.phone_number and req.phone_number not in recipients:
        recipients.append(req.phone_number)

    results = []
    states_to_send = [st for st in snapshot_data["states"] if st["risk_level"] in ["High", "Very High", "Moderate"]]
    if not states_to_send and snapshot_data["states"]:
        states_to_send = snapshot_data["states"][:2]
    
    for st in states_to_send:
        message = (
            f"LandAlert Monitor: {st['risk_level'].upper()} landslide risk in {st['state']}. "
            f"Risk: {st['probability']*100:.0f}%. "
            f"Rainfall: {st.get('rainfall_mm', 0):.0f}mm. "
            f"Elevation: {st.get('elevation_m', 0):.0f}m. "
            f"Slope: {st.get('slope_deg', 0):.1f}deg. "
            f"Please monitor this region."
        )
        for recipient in recipients:
            result = send_sms(recipient, message)
            results.append({
                "state": st["state"],
                "risk_level": st["risk_level"],
                "sent_to": recipient,
                "sms_result": result,
            })
    
    return {"message": f"SMS attempted for {len(results)} alert(s)", "results": results}


@app.get("/sms-status")
async def sms_status():
    """Check Twilio SMS configuration status."""
    return {
        "configured": twilio_client is not None,
        "phone_number": TWILIO_PHONE_NUMBER if TWILIO_PHONE_NUMBER else "Not set",
        "account_sid": TWILIO_ACCOUNT_SID[:8] + "..." if TWILIO_ACCOUNT_SID else "Not set"
    }


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
