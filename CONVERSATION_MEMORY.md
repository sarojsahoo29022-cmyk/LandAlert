# LandAlert Project Memory
# Save this file for next session - Start from here

## PROJECT: LandAlert
## SIH PROBLEM: SIH26001
## TITLE: AI-Based Early Warning and Landslide Risk Monitoring System in NER

## CURRENT DATE: August 31, 2026

---

## WHAT HAS BEEN COMPLETED

### 1. Frontend (Phase 1) - DONE
- Full Next.js 16 app with TypeScript + Tailwind CSS 4
- 5 screens: Dashboard, Risk Map, Analytics, Alerts, Methodology
- 28+ UI components
- Responsive design, mobile support

### 2. ML Model v2 - DONE (Rainfall Added)
- **Model**: HistGradientBoosting (sklearn Pipeline)
- **Trained on**: `datasets/ne_india_landslide_enriched.csv` (1,772 samples) + `Rainfall_Data_LL.csv`
- **Features**: latitude, longitude, month, temp_2m, is_monsoon, rainfall_mm, state
- **Accuracy**: 78.0%, Precision: 57.1%, Recall: 49.4%, F1: 53.0%, ROC-AUC: 81.8%
- **Model saved**: `ml_model/rf_landslide_model.pkl` (Pipeline dict with "pipeline" key)
- **Metadata**: `ml_model/model_meta.json`
- **Backup**: `ml/model_ne_rainfall.joblib`

### 3. FastAPI Backend v2 - DONE (Updated for Rainfall)
- **File**: `ml_api.py` (root directory)
- **Run command**: `python -m uvicorn ml_api:app --host 127.0.0.1 --port 8000`
- **8 endpoints** - all updated with rainfall support:
  - GET /health - Model metrics + features list
  - POST /predict - Risk prediction with rainfall data
  - GET /snapshot - All 9 NER states with rainfall + temp
  - GET /alerts - ML-generated alerts with rainfall info
  - GET /risk-summary - Low/moderate/high counts
  - GET /history/{state} - Historical landslide records with rainfall
  - GET /districts - 107 searchable locations
  - GET /states - All state names

### 4. Frontend Integration - DONE
- `lib/ml-api.ts` - Updated with real API calls + mock fallback
- Dashboard - Loads snapshot on mount, real predictions on search
- Analytics - Live model metrics from API
- Alerts - ML-generated alerts from /alerts endpoint
- LocationSearch - Passes search term to ML prediction

### 5. Build Status
- `npm run build` - SUCCESS
- No TypeScript errors

---

## HOW TO RUN

```bash
# Terminal 1: Start ML API
cd C:\Users\Saroj\OneDrive\Desktop\LandAlert
ml\.venv\Scripts\python.exe -m uvicorn ml_api:app --host 127.0.0.1 --port 8000

# Terminal 2: Start Frontend
cd C:\Users\Saroj\OneDrive\Desktop\LandAlert
npm run dev
```

---

## MODEL COMPARISON

| Metric | v1 (temp only) | v2 (+ rainfall) |
|--------|----------------|-----------------|
| Accuracy | 71.0% | 78.0% |
| Precision | 45.0% | 57.1% |
| Recall | 79.0% | 49.4% |
| F1 | 58.0% | 53.0% |
| ROC-AUC | 75.0% | 81.8% |
| Features | 4 | 7 |

---

## WHAT NEEDS TO BE DONE NEXT

### Priority 1: Add Slope/Terrain Data (USER IS PREPARING)
- User is preparing slope and terrain datasets
- Once available, merge with training data
- Add slope (degrees) and elevation (meters) as features

### Priority 2: Frontend Enhancements
- Add real map (Leaflet/OpenStreetMap)
- Add rainfall trend chart with real data
- Add elevation/slope display in location details

---

## DATASETS AVAILABLE

| Dataset | Location | Features |
|---------|----------|----------|
| ne_india_landslide_enriched.csv | datasets/ | lat, lon, month, year, state, landslide_occurred, temp_2m, is_monsoon |
| Rainfall_Data_LL.csv | Root | Monthly rainfall by subdivision (1901-2015), lat/lon |
| ne_india_landslide.csv | datasets/ | lat, lon, month, year, state, landslide_occurred |
| Global_Landslide_Catalog | datasets/ | Global landslide events |
| POWER_Regional_Daily | datasets/ | NASA temperature data |
| nepal_landslide_flood.csv | datasets/ | Nepal landslide/flood data |

### Rainfall Data Mapping
- Arunachal Pradesh -> Arunachal Pradesh subdivision
- Assam, Meghalaya -> Assam & Meghalaya subdivision
- Manipur, Mizoram, Nagaland, Tripura -> Naga Mani Mizo Tripura subdivision
- Sikkim, West Bengal -> Sub Himalayan West Bengal & Sikkim subdivision

---

## KEY FILES TO REMEMBER

| File | Purpose |
|------|---------|
| ml_api.py | FastAPI backend v2 (with rainfall support) |
| ml_model/rf_landslide_model.pkl | Trained Pipeline (dict with "pipeline" key) |
| ml_model/model_meta.json | Model metadata + metrics |
| ml/add_rainfall.py | Script to retrain model with rainfall |
| ml/train_ne.py | Original training script (temp only) |
| lib/ml-api.ts | Frontend API client |
| datasets/ne_india_landslide_enriched.csv | Training data |
| Rainfall_Data_LL.csv | IMD rainfall data by subdivision |

---

## API TEST RESULTS (Working - v2)

- /health: status=healthy, model_loaded=True, features=[lat,lon,month,temp_2m,is_monsoon,rainfall_mm]
- /predict Meghalaya Jul: risk=Low (6.5%), rainfall=429mm
- /predict Sikkim Jan: risk=Low (0.05%), rainfall=3mm
- /snapshot: 9 states, differentiated risk levels
  - Tripura: High (59.2%)
  - Sikkim: Moderate (36.1%)
  - West Bengal: Moderate (42.0%)
  - Others: Low
- /alerts: Generated for High/Very High risk states
- /history Meghalaya: 11/44 events with rainfall data
- /districts: 107 districts

---

## CONVERSATION SUMMARY

- Phase A-C: Model training, API, frontend integration - DONE
- Phase D: Added rainfall data from Rainfall_Data_LL.csv to model - DONE
- Model v2: 78% accuracy (up from 71%), differentiated state predictions
- User is preparing slope/terrain datasets for next feature addition

---

## NEXT SESSION STARTER

When continuing:
1. Check if ML API is running: `curl http://127.0.0.1:8000/health`
2. If not running: `ml\.venv\Scripts\python.exe -m uvicorn ml_api:app --host 127.0.0.1 --port 8000`
3. Start frontend: `npm run dev`
4. Continue with: Add slope/terrain data when user provides datasets
