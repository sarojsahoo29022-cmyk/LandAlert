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

DATA_PATH = "datasets/ne_india_landslide.csv"
MODEL_PATH = "ml/model_ne.joblib"
SNAPSHOT_PATH = "ml/ne_snapshot.json"

NUMERIC = ["month"]
CATEGORICAL = ["state"]
TARGET = "landslide_occurred"


def main():
    df = pd.read_csv(DATA_PATH)
    df = df.dropna(subset=NUMERIC + [TARGET]).copy()
    df[TARGET] = df[TARGET].astype(int)

    X = df[NUMERIC + CATEGORICAL]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pre = ColumnTransformer(
        [
            ("num", "passthrough", NUMERIC),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL),
        ]
    )
    clf = HistGradientBoostingClassifier(
        learning_rate=0.1, max_iter=300, l2_regularization=1.0, random_state=42
    )
    pipe = Pipeline([("pre", pre), ("clf", clf)])
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
    print("NE model metrics:")
    for k, v in metrics.items():
        print(f"  {k}: {v}")

    joblib.dump(
        {
            "pipeline": pipe,
            "numeric_features": NUMERIC,
            "categorical_features": CATEGORICAL,
            "target": TARGET,
            "metrics": metrics,
            "scope": "North-East India (susceptibility: location + season; no rainfall yet)",
        },
        MODEL_PATH,
    )
    print(f"Saved -> {MODEL_PATH}")

    # Per-state average risk across months for the dashboard snapshot.
    states = sorted(df["state"].unique())
    snap = []
    for st in states:
        sub = df[df["state"] == st]
        lat = sub["latitude"].mean()
        lon = sub["longitude"].mean()
        monthly = []
        for m in range(1, 13):
            monthly.append(
                float(
                    pipe.predict_proba(
                        pd.DataFrame(
                            [{"latitude": lat, "longitude": lon, "month": m, "year": 2024, "state": st}]
                        )
                    )[0, 1]
                )
            )
        risk = sum(monthly) / len(monthly)
        snap.append(
            {
                "state": st,
                "risk": round(risk, 4),
                "risk_level": "High" if risk >= 0.5 else ("Moderate" if risk >= 0.2 else "Low"),
                "peak_month": int(max(range(12), key=lambda i: monthly[i])) + 1,
                "events": int((sub[TARGET] == 1).sum()),
            }
        )
    snap.sort(key=lambda r: r["risk"], reverse=True)
    json.dump({"scope": "North-East India", "states": snap}, open(SNAPSHOT_PATH, "w"), indent=2)
    print(f"Saved snapshot -> {SNAPSHOT_PATH}")


if __name__ == "__main__":
    main()
