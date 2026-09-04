"""
Add terrain features (elevation + slope) to the NE India landslide model.

Pipeline:
1. Load terrain lookup from fetch_terrain.py
2. Merge with enriched training data
3. Retrain HistGradientBoostingClassifier with 9 features
4. Deploy model to ml_model/

Features (v3 with terrain):
  - latitude, longitude, month, temp_2m, is_monsoon, rainfall_mm, elevation_m, slope_deg, state

Usage:
    cd C:\\Users\\Saroj\\OneDrive\\Desktop\\LandAlert
    ml\\.venv\\Scripts\\python.exe ml\\add_terrain.py
"""

import pandas as pd
import numpy as np
import joblib
import json
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix,
)

LANDSLIDE_DATA = "datasets/ne_india_landslide_enriched.csv"
RAINFALL_DATA = "Rainfall_Data_LL.csv"
TERRAIN_DATA = "datasets/ne_terrain_lookup.csv"
MODEL_OUT = "ml/model_ne_terrain.joblib"
SNAPSHOT_OUT = "ml/ne_snapshot_terrain.json"
DEPLOY_MODEL = "ml_model/rf_landslide_model.pkl"
DEPLOY_META = "ml_model/model_meta.json"

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

MONTH_COLS = {1: "JAN", 2: "FEB", 3: "MAR", 4: "APR", 5: "MAY", 6: "JUN",
              7: "JUL", 8: "AUG", 9: "SEP", 10: "OCT", 11: "NOV", 12: "DEC"}


def build_rainfall_lookup():
    rf = pd.read_csv(RAINFALL_DATA)
    rf["SUBDIVISION"] = rf["SUBDIVISION"].str.strip()
    lookup = {}
    for _, row in rf.iterrows():
        key = (row["SUBDIVISION"], int(row["YEAR"]))
        monthly = {m: float(row[MONTH_COLS[m]]) for m in range(1, 13)}
        annual = float(row["ANNUAL"]) if pd.notna(row["ANNUAL"]) else sum(monthly.values())
        lookup[key] = {"monthly": monthly, "annual": annual}
    return lookup


def get_rainfall(lookup, state, year, month):
    subdiv = STATE_TO_SUBDIVISION.get(state)
    if subdiv is None:
        return 0.0, 0.0
    key = (subdiv, year)
    if key in lookup:
        return lookup[key]["monthly"].get(month, 0.0), lookup[key]["annual"]
    close_keys = [(k, abs(k[1] - year)) for k in lookup if k[0] == subdiv]
    if close_keys:
        best = min(close_keys, key=lambda x: x[1])[0]
        return lookup[best]["monthly"].get(month, 0.0), lookup[best]["annual"]
    return 0.0, 0.0


def main():
    print("=" * 60)
    print("TERRAIN-ENRICHED LANDSLIDE MODEL (v3)")
    print("=" * 60)

    # Step 1: Load terrain lookup
    print(f"\nLoading terrain data from {TERRAIN_DATA}...")
    terrain_df = pd.read_csv(TERRAIN_DATA)
    terrain_lookup = {}
    for _, row in terrain_df.iterrows():
        terrain_lookup[(row["latitude"], row["longitude"])] = {
            "elevation_m": row["elevation_m"],
            "slope_deg": row["slope_deg"],
        }
    print(f"  {len(terrain_lookup)} coordinate -> terrain mappings loaded")

    # Step 2: Load and enrich base data
    print(f"\nLoading training data from {LANDSLIDE_DATA}...")
    df = pd.read_csv(LANDSLIDE_DATA)
    df = df.dropna(subset=["latitude", "longitude", "month", "year", "state",
                           "temp_2m", "is_monsoon", "landslide_occurred"]).copy()
    df["landslide_occurred"] = df["landslide_occurred"].astype(int)
    print(f"  {len(df)} rows loaded")

    # Step 3: Add rainfall
    print("\nAdding rainfall data...")
    rainfall_lookup = build_rainfall_lookup()
    rainfall_monthly = []
    for _, row in df.iterrows():
        rm, _ = get_rainfall(rainfall_lookup, row["state"], int(row["year"]), int(row["month"]))
        rainfall_monthly.append(rm)
    df["rainfall_mm"] = rainfall_monthly
    print(f"  {sum(1 for r in rainfall_monthly if r > 0)}/{len(df)} rows have rainfall > 0")

    # Step 4: Add terrain features
    print("\nMerging terrain data...")
    elevation = []
    slope = []
    matched = 0
    for _, row in df.iterrows():
        key = (row["latitude"], row["longitude"])
        terrain = terrain_lookup.get(key, {})
        elev = terrain.get("elevation_m")
        slp = terrain.get("slope_deg")
        
        # Fallback: use state-based defaults if terrain not found
        if elev is None:
            elev = _default_elevation(row["state"], row["latitude"])
        if slp is None:
            slp = _default_slope(row["state"], row["latitude"])
        
        elevation.append(elev)
        slope.append(slp)
        if terrain:
            matched += 1
    
    df["elevation_m"] = elevation
    df["slope_deg"] = slope
    print(f"  {matched}/{len(df)} rows matched to terrain lookup")
    print(f"  Elevation range: {df['elevation_m'].min():.0f}m - {df['elevation_m'].max():.0f}m")
    print(f"  Slope range: {df['slope_deg'].min():.1f}° - {df['slope_deg'].max():.1f}°")

    # Step 5: Train model
    NUMERIC = ["latitude", "longitude", "month", "temp_2m", "is_monsoon",
               "rainfall_mm", "elevation_m", "slope_deg"]
    CATEGORICAL = ["state"]
    TARGET = "landslide_occurred"

    X = df[NUMERIC + CATEGORICAL]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTraining set: {len(X_train)} samples ({y_train.mean():.1%} positive)")
    print(f"Test set: {len(X_test)} samples ({y_test.mean():.1%} positive)")

    pre = ColumnTransformer([
        ("num", "passthrough", NUMERIC),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL),
    ])
    clf = HistGradientBoostingClassifier(
        learning_rate=0.05,
        max_iter=500,
        max_depth=6,
        l2_regularization=0.5,
        min_samples_leaf=10,
        random_state=42,
    )
    pipe = Pipeline([("pre", pre), ("clf", clf)])
    
    print("\nTraining model...")
    pipe.fit(X_train, y_train)

    # Step 6: Evaluate
    proba = pipe.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    
    metrics = {
        "accuracy": round(accuracy_score(y_test, pred), 4),
        "precision": round(precision_score(y_test, pred, zero_division=0), 4),
        "recall": round(recall_score(y_test, pred, zero_division=0), 4),
        "f1": round(f1_score(y_test, pred, zero_division=0), 4),
        "roc_auc": round(roc_auc_score(y_test, proba), 4),
        "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
        "positive_rate_train": round(float(y_train.mean()), 4),
    }

    print("\n" + "=" * 60)
    print("MODEL METRICS (v3 with Terrain)")
    print("=" * 60)
    for k, v in metrics.items():
        if k != "confusion_matrix":
            print(f"  {k}: {v}")
    print(f"  confusion_matrix: {metrics['confusion_matrix']}")

    # Step 7: Feature importance via permutation
    print("\nComputing permutation feature importance...")
    feature_names = NUMERIC + list(
        pipe.named_steps["pre"].named_transformers_["cat"]
        .get_feature_names_out(CATEGORICAL)
    )
    
    perm_imp = permutation_importance(pipe, X_test, y_test, n_repeats=10, random_state=42)
    importances = {}
    for name, imp_val in zip(feature_names, perm_imp.importances_mean):
        importances[name] = round(float(imp_val), 4)
    
    print("\nFeature importances (permutation):")
    for k, v in sorted(importances.items(), key=lambda x: -x[1]):
        print(f"  {k}: {v}")

    # Also get native feature importances if available
    native_importances = {}
    if hasattr(pipe.named_steps["clf"], "feature_importances_"):
        imp = pipe.named_steps["clf"].feature_importances_
        for name, val in zip(feature_names, imp):
            native_importances[name] = round(float(val), 4)
        print("\nNative feature importances (histogram-based):")
        for k, v in sorted(native_importances.items(), key=lambda x: -x[1]):
            print(f"  {k}: {v}")

    # Step 8: Save model
    joblib.dump({
        "pipeline": pipe,
        "numeric_features": NUMERIC,
        "categorical_features": CATEGORICAL,
        "target": TARGET,
        "metrics": metrics,
        "feature_importances": importances,
        "native_feature_importances": native_importances,
        "scope": "North-East India with Rainfall + Terrain (SRTM)",
    }, MODEL_OUT)
    print(f"\nSaved model -> {MODEL_OUT}")

    # Step 9: Generate per-state snapshot
    monthly_temp_map = {1: 13.33, 2: 16.0, 3: 18.89, 4: 22.05, 5: 23.35, 6: 24.68,
                        7: 24.59, 8: 24.5, 9: 23.8, 10: 21.5, 11: 17.8, 12: 14.2}

    monthly_rainfall_map = {}
    for st in df["state"].unique():
        monthly_rainfall_map[st] = {}
        for m in range(1, 13):
            vals = df[(df["state"] == st) & (df["month"] == m)]["rainfall_mm"]
            monthly_rainfall_map[st][m] = float(vals.mean()) if len(vals) > 0 else 0.0

    # Average terrain per state
    state_terrain = {}
    for st in df["state"].unique():
        sub = df[df["state"] == st]
        state_terrain[st] = {
            "elevation_m": float(sub["elevation_m"].mean()),
            "slope_deg": float(sub["slope_deg"].mean()),
        }

    states = sorted(df["state"].unique())
    snap = []
    for st in states:
        sub = df[df["state"] == st]
        lat = sub["latitude"].mean()
        lon = sub["longitude"].mean()
        terrain = state_terrain[st]
        
        monthly = []
        for m in range(1, 13):
            t2m = monthly_temp_map[m]
            is_mon = 1 if 6 <= m <= 9 else 0
            rf_mm = monthly_rainfall_map.get(st, {}).get(m, 0.0)
            test_row = pd.DataFrame([{
                "latitude": lat, "longitude": lon, "month": m,
                "temp_2m": t2m, "is_monsoon": is_mon, "rainfall_mm": rf_mm,
                "elevation_m": terrain["elevation_m"],
                "slope_deg": terrain["slope_deg"],
                "state": st,
            }])
            monthly.append(float(pipe.predict_proba(test_row)[0, 1]))
        
        risk = sum(monthly) / len(monthly)
        peak_m = int(max(range(12), key=lambda i: monthly[i])) + 1
        snap.append({
            "state": st,
            "risk": round(risk, 4),
            "risk_level": "Very High" if risk >= 0.7 else
                         ("High" if risk >= 0.5 else
                          ("Moderate" if risk >= 0.25 else "Low")),
            "peak_month": peak_m,
            "events": int((sub[TARGET] == 1).sum()),
            "avg_elevation_m": round(terrain["elevation_m"], 0),
            "avg_slope_deg": round(terrain["slope_deg"], 1),
        })
    
    snap.sort(key=lambda r: r["risk"], reverse=True)
    json.dump({"scope": "North-East India (Rainfall + Terrain)", "states": snap},
              open(SNAPSHOT_OUT, "w"), indent=2)
    print(f"Saved snapshot -> {SNAPSHOT_OUT}")

    # Print risk summary
    print("\nState Risk Summary:")
    for s in snap:
        print(f"  {s['state']:20s}: {s['risk_level']:10s} ({s['risk']:.1%}) "
              f"elev={s['avg_elevation_m']:.0f}m slope={s['avg_slope_deg']:.1f}°")


def _default_elevation(state, lat):
    """Fallback elevation based on state and latitude."""
    ranges = {
        "Arunachal Pradesh": (500, 3000),
        "Assam": (50, 500),
        "Manipur": (500, 2000),
        "Meghalaya": (300, 1500),
        "Mizoram": (500, 1800),
        "Nagaland": (500, 2500),
        "Sikkim": (800, 4000),
        "Tripura": (100, 700),
        "West Bengal": (100, 2500),
    }
    r = ranges.get(state, (300, 1500))
    lat_factor = (lat - 21) / 9
    return r[0] + (r[1] - r[0]) * lat_factor


def _default_slope(state, lat):
    """Fallback slope based on state."""
    ranges = {
        "Arunachal Pradesh": (20, 40),
        "Assam": (5, 15),
        "Manipur": (15, 30),
        "Meghalaya": (15, 35),
        "Mizoram": (15, 35),
        "Nagaland": (15, 35),
        "Sikkim": (25, 50),
        "Tripura": (10, 25),
        "West Bengal": (10, 40),
    }
    r = ranges.get(state, (10, 30))
    lat_factor = (lat - 21) / 9
    return r[0] + (r[1] - r[0]) * lat_factor * 0.7


if __name__ == "__main__":
    main()
