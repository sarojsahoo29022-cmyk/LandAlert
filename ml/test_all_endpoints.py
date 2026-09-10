import sys
import asyncio
sys.path.insert(0, ".")
import ml_api

ml_api.load_model()

async def run_all_tests():
    print("\n--- TEST 1: HEALTH ---")
    health = await ml_api.health()
    print("Health status:", health.get("status"))
    print("Model loaded:", health.get("model_loaded"))
    print("Features count:", len(health.get("features", [])))
    assert health.get("status") == "healthy"

    print("\n--- TEST 2: PREDICT (STANDARD) ---")
    req = ml_api.PredictRequest(
        state="Meghalaya", month=7, year=2026, latitude=25.58, longitude=91.89
    )
    pred = await ml_api.predict(req)
    print("Probability:", pred["landslide_probability"])
    print("Risk Level:", pred["risk_level"])
    assert "landslide_probability" in pred

    print("\n--- TEST 3: FEATURE IMPORTANCE ---")
    fi = await ml_api.feature_importance()
    print("Top feature:", fi["features"][0]["feature"], "->", fi["features"][0]["importance"])
    assert len(fi["features"]) > 0

    print("\n--- TEST 4: PREDICT EXPLAIN ---")
    exp = await ml_api.predict_explain(req)
    print("Explanation:", exp["explanation"])
    print("Top drivers:", exp["top_risk_drivers"])
    assert "contributions" in exp

    print("\n--- TEST 5: SNAPSHOT ---")
    snap = await ml_api.snapshot()
    print("States in snapshot:", len(snap["states"]))
    assert len(snap["states"]) == 9

    print("\n--- TEST 6: ALERTS ---")
    alerts = await ml_api.alerts()
    print("Alerts count:", alerts["total"])
    assert "alerts" in alerts

    print("\n--- TEST 7: SMS STATUS ---")
    status = await ml_api.sms_status()
    print("Twilio Configured:", status["configured"])
    print("Twilio Phone:", status["phone_number"])
    assert status["configured"] is True

    print("\n[SUCCESS] ALL 7 BACKEND API ENDPOINTS TESTED AND WORKING PERFECTLY!")

if __name__ == "__main__":
    asyncio.run(run_all_tests())
