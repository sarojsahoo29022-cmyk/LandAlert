import json
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
)

DATA_PATH = "datasets/nepal_landslide_flood.csv"
MODEL_PATH = "ml/model.joblib"
SNAPSHOT_PATH = "ml/predictions_snapshot.json"

NUMERIC = [
    "T2M",
    "precipitation",
    "rainfall_3day_sum",
    "rainfall_7day_sum",
    "rainfall_30day_sum",
    "temp_7day_avg",
]
CATEGORICAL = ["district"]
TARGET = "landslide_occurred"


def load_data():
    df = pd.read_csv(DATA_PATH)
    needed = NUMERIC + CATEGORICAL + [TARGET, "date"]
    df = df[needed].copy()
    df[TARGET] = df[TARGET].astype(int)
    before = len(df)
    df = df.dropna(subset=NUMERIC + [TARGET])
    df["district"] = df["district"].astype(str)
    print(f"Loaded {before} rows, kept {len(df)} after dropping missing features")
    return df


def build_pipeline():
    pre = ColumnTransformer(
        [
            ("num", "passthrough", NUMERIC),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL),
        ]
    )
    clf = HistGradientBoostingClassifier(
        learning_rate=0.1,
        max_iter=300,
        max_depth=None,
        l2_regularization=1.0,
        random_state=42,
    )
    return Pipeline([("pre", pre), ("clf", clf)])


def main():
    df = load_data()
    X = df[NUMERIC + CATEGORICAL]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipe = build_pipeline()
    print("Training model...")
    pipe.fit(X_train, y_train)

    proba = pipe.predict_proba(X_test)[:, 1]
    pred = (proba >= 0.5).astype(int)

    metrics = {
        "accuracy": accuracy_score(y_test, pred),
        "precision": precision_score(y_test, pred),
        "recall": recall_score(y_test, pred),
        "f1": f1_score(y_test, pred),
        "roc_auc": roc_auc_score(y_test, proba),
        "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
        "positive_rate_train": float(y_train.mean()),
    }
    print("Evaluation metrics:")
    for k, v in metrics.items():
        print(f"  {k}: {v}")

    joblib.dump(
        {
            "pipeline": pipe,
            "numeric_features": NUMERIC,
            "categorical_features": CATEGORICAL,
            "target": TARGET,
            "metrics": metrics,
        },
        MODEL_PATH,
    )
    print(f"Saved model -> {MODEL_PATH}")

    snapshot = build_snapshot(df, pipe)
    with open(SNAPSHOT_PATH, "w") as f:
        json.dump(snapshot, f, indent=2)
    print(f"Saved per-district snapshot -> {SNAPSHOT_PATH}")


def risk_level(p):
    if p >= 0.5:
        return "High"
    if p >= 0.2:
        return "Moderate"
    return "Low"


def build_snapshot(df, pipe):
    latest = df.sort_values("date").groupby("district").tail(1).copy()
    proba = pipe.predict_proba(latest[NUMERIC + CATEGORICAL])[:, 1]
    latest["risk"] = proba
    latest["risk_level"] = latest["risk"].apply(risk_level)
    out = []
    for _, row in latest.iterrows():
        out.append(
            {
                "district": row["district"],
                "date": row["date"],
                "risk": round(float(row["risk"]), 4),
                "risk_level": row["risk_level"],
                "precipitation": float(row["precipitation"]),
                "rainfall_7day_sum": float(row["rainfall_7day_sum"]),
            }
        )
    out.sort(key=lambda r: r["risk"], reverse=True)
    return {"generated_from": "latest record per district", "districts": out}


if __name__ == "__main__":
    main()
