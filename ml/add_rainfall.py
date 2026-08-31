import pandas as pd
import numpy as np
import joblib
import json
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix,
)

LANDSLIDE_DATA = "datasets/ne_india_landslide_enriched.csv"
RAINFALL_DATA = "Rainfall_Data_LL.csv"
MODEL_OUT = "ml/model_ne_rainfall.joblib"
SNAPSHOT_OUT = "ml/ne_snapshot_rainfall.json"

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
    print("Loading rainfall lookup...")
    rainfall_lookup = build_rainfall_lookup()
    print(f"  {len(rainfall_lookup)} subdivision-year entries loaded")

    df = pd.read_csv(LANDSLIDE_DATA)
    df = df.dropna(subset=["latitude", "longitude", "month", "year", "state", "temp_2m", "is_monsoon", "landslide_occurred"]).copy()
    df["landslide_occurred"] = df["landslide_occurred"].astype(int)

    print(f"Enriching {len(df)} rows with rainfall data...")
    rainfall_monthly = []
    rainfall_annual = []
    for _, row in df.iterrows():
        rm, ra = get_rainfall(rainfall_lookup, row["state"], int(row["year"]), int(row["month"]))
        rainfall_monthly.append(rm)
        rainfall_annual.append(ra)

    df["rainfall_mm"] = rainfall_monthly
    df["rainfall_annual"] = rainfall_annual

    nonzero = (df["rainfall_mm"] > 0).sum()
    print(f"  {nonzero}/{len(df)} rows have non-zero rainfall ({nonzero/len(df)*100:.1f}%)")

    NUMERIC = ["latitude", "longitude", "month", "temp_2m", "is_monsoon", "rainfall_mm"]
    CATEGORICAL = ["state"]
    TARGET = "landslide_occurred"

    X = df[NUMERIC + CATEGORICAL]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pre = ColumnTransformer([
        ("num", "passthrough", NUMERIC),
        ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL),
    ])
    clf = HistGradientBoostingClassifier(
        learning_rate=0.05,
        max_iter=400,
        max_depth=5,
        l2_regularization=0.5,
        random_state=42,
    )
    pipe = Pipeline([("pre", pre), ("clf", clf)])
    pipe.fit(X_train, y_train)

    proba = pipe.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)
    metrics = {
        "accuracy": round(accuracy_score(y_test, pred), 4),
        "precision": round(precision_score(y_test, pred), 4),
        "recall": round(recall_score(y_test, pred), 4),
        "f1": round(f1_score(y_test, pred), 4),
        "roc_auc": round(roc_auc_score(y_test, proba), 4),
        "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
        "positive_rate_train": round(float(y_train.mean()), 4),
    }
    print("\n=== Model with Rainfall Feature ===")
    for k, v in metrics.items():
        print(f"  {k}: {v}")

    importances = {}
    if hasattr(pipe.named_steps["clf"], "feature_importances_"):
        feat_names = NUMERIC + list(pipe.named_steps["pre"].named_transformers_["cat"].get_feature_names_out(CATEGORICAL))
        imp = pipe.named_steps["clf"].feature_importances_
        for name, val in zip(feat_names, imp):
            importances[name] = round(float(val), 4)
        print("\nFeature importances:")
        for k, v in sorted(importances.items(), key=lambda x: -x[1]):
            print(f"  {k}: {v}")

    joblib.dump({
        "pipeline": pipe,
        "numeric_features": NUMERIC,
        "categorical_features": CATEGORICAL,
        "target": TARGET,
        "metrics": metrics,
        "feature_importances": importances,
        "scope": "North-East India with Rainfall (NASA POWER + IMD)",
    }, MODEL_OUT)
    print(f"\nSaved model -> {MODEL_OUT}")

    monthly_temp_map = {1: 13.33, 2: 16.0, 3: 18.89, 4: 22.05, 5: 23.35, 6: 24.68,
                        7: 24.59, 8: 24.5, 9: 23.8, 10: 21.5, 11: 17.8, 12: 14.2}

    monthly_rainfall_map = {}
    for st in df["state"].unique():
        monthly_rainfall_map[st] = {}
        for m in range(1, 13):
            vals = df[(df["state"] == st) & (df["month"] == m)]["rainfall_mm"]
            monthly_rainfall_map[st][m] = float(vals.mean()) if len(vals) > 0 else 0.0

    states = sorted(df["state"].unique())
    snap = []
    for st in states:
        sub = df[df["state"] == st]
        lat = sub["latitude"].mean()
        lon = sub["longitude"].mean()
        monthly = []
        for m in range(1, 13):
            t2m = monthly_temp_map[m]
            is_mon = 1 if 6 <= m <= 9 else 0
            rf_mm = monthly_rainfall_map.get(st, {}).get(m, 0.0)
            test_row = pd.DataFrame([{
                "latitude": lat, "longitude": lon, "month": m,
                "temp_2m": t2m, "is_monsoon": is_mon, "rainfall_mm": rf_mm, "state": st,
            }])
            monthly.append(float(pipe.predict_proba(test_row)[0, 1]))
        risk = sum(monthly) / len(monthly)
        peak_m = int(max(range(12), key=lambda i: monthly[i])) + 1
        snap.append({
            "state": st,
            "risk": round(risk, 4),
            "risk_level": "High" if risk >= 0.5 else ("Moderate" if risk >= 0.2 else "Low"),
            "peak_month": peak_m,
            "events": int((sub[TARGET] == 1).sum()),
        })
    snap.sort(key=lambda r: r["risk"], reverse=True)
    json.dump({"scope": "North-East India (with Rainfall)", "states": snap},
              open(SNAPSHOT_OUT, "w"), indent=2)
    print(f"Saved snapshot -> {SNAPSHOT_OUT}")


if __name__ == "__main__":
    main()
