import joblib
import shutil
import json

m = joblib.load("ml/model_ne_rainfall.joblib")
print("numeric:", m["numeric_features"])
print("categorical:", m["categorical_features"])
print("metrics:", m["metrics"])
print("importances:", m.get("feature_importances", {}))

shutil.copy("ml/model_ne_rainfall.joblib", "ml_model/rf_landslide_model.pkl")

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
    "scope": m["scope"]
}
with open("ml_model/model_meta.json", "w") as f:
    json.dump(meta, f, indent=2)

print("\nCopied model -> ml_model/rf_landslide_model.pkl")
print("Updated -> ml_model/model_meta.json")
