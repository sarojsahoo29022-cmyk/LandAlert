"""
Deploy the trained model to ml_model/ directory.
Updates both the model file and metadata JSON.

Usage:
    cd C:\\Users\\Saroj\\OneDrive\\Desktop\\LandAlert
    ml\\.venv\\Scripts\\python.exe ml\\deploy_model.py
"""

import joblib
import shutil
import json
import os

# Prefer terrain model (v3), fallback to rainfall model (v2)
MODEL_CANDIDATES = [
    "ml/model_ne_terrain.joblib",
    "ml/model_ne_rainfall.joblib",
]

MODEL_OUT = "ml_model/rf_landslide_model.pkl"
META_OUT = "ml_model/model_meta.json"


def main():
    # Find the best available model
    model_path = None
    for candidate in MODEL_CANDIDATES:
        if os.path.exists(candidate):
            model_path = candidate
            break
    
    if model_path is None:
        print("ERROR: No trained model found!")
        print("  Expected one of:", MODEL_CANDIDATES)
        return
    
    print(f"Loading model from {model_path}...")
    m = joblib.load(model_path)
    
    print(f"\nModel info:")
    print(f"  Numeric features: {m['numeric_features']}")
    print(f"  Categorical features: {m['categorical_features']}")
    print(f"  Scope: {m['scope']}")
    print(f"\nMetrics:")
    for k, v in m["metrics"].items():
        if k != "confusion_matrix":
            print(f"  {k}: {v}")
    
    if m.get("feature_importances"):
        print(f"\nFeature importances:")
        for k, v in sorted(m["feature_importances"].items(), key=lambda x: -x[1]):
            print(f"  {k}: {v}")
    
    # Copy model
    shutil.copy(model_path, MODEL_OUT)
    print(f"\nCopied model -> {MODEL_OUT}")
    
    # Build metadata
    meta = {
        "feature_names": m["numeric_features"],
        "state_mapping": {
            "Arunachal Pradesh": 0, "Assam": 1, "Manipur": 2,
            "Meghalaya": 3, "Mizoram": 4, "Nagaland": 5,
            "Other": 6, "Sikkim": 7, "Tripura": 8, "West Bengal": 9
        },
        "target_names": ["No Landslide", "Landslide"],
        "metrics": m["metrics"],
        "feature_importances": m.get("feature_importances", {}),
        "native_feature_importances": m.get("native_feature_importances", {}),
        "scope": m["scope"],
        "model_version": "v3_terrain" if "terrain" in model_path else "v2_rainfall",
    }
    
    with open(META_OUT, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Updated -> {META_OUT}")


if __name__ == "__main__":
    main()
