# LandAlert Project Memory
# Save this file for next session - Start from here

## PROJECT: LandAlert
## SIH PROBLEM: SIH26001
## TITLE: AI-Based Early Warning and Landslide Risk Monitoring System in NER

## CURRENT DATE: September 7, 2026

---

## PROJECT OVERVIEW (For New Members / Team)

### What is the Problem?
North-Eastern India (Assam, Meghalaya, Sikkim, Mizoram, Manipur, Nagaland, Tripura, Arunachal Pradesh, West Bengal) is highly prone to landslides due to heavy monsoon rainfall, steep terrain, and mountainous geography. Every year, landslides destroy roads, houses, and infrastructure, and sometimes even kill people. Currently, there is no centralized AI-powered system that can predict landslide risk in real-time, show it on a map, and alert authorities before disaster strikes. Disaster response teams have to rely on manual reports and old data, which causes delays and loss of life.

### What Existing Solutions Are There?
Right now, the Geological Survey of India (GSI) and state disaster management departments use basic historical records and manual inspections. Some researchers have published static susceptibility maps, but these are not interactive, not real-time, and not accessible to field officers. There is no single dashboard that combines machine learning predictions, live rainfall data, terrain analysis, and interactive maps in one place for authorities to use during monsoon season.

### What SIH Expects from Us?
Smart India Hackathon (SIH26001) wants us to build an AI-Based Early Warning and Landslide Risk Monitoring System for the North-East Region. The expected solution should:
- Let users search any location and analyze its landslide risk
- Generate a risk score (Low/Moderate/High/Very High)
- Explain WHY the risk is high (contributing factors like rainfall, slope, temperature)
- Visualize risk on an interactive GIS map
- Track historical trends
- Show a potential hazard chain (heavy rain → slope instability → landslide → river disruption → downstream flooding)
- Provide an alert/early warning system for authorities
- Be practical, explainable, and useful for disaster management decision-making

### What is Our Solution (LandAlert)?
LandAlert is a full-stack AI-powered early warning platform that does exactly what SIH asks for. We trained a Machine Learning model (HistGradientBoosting Classifier) on 1,773 real landslide records from NASA's Global Landslide Catalog, enriched with IMD rainfall data, NASA temperature data, and SRTM terrain data (elevation + slope). The system has a Next.js frontend with 5 screens, a Python FastAPI backend with 8 API endpoints, and an interactive Leaflet/OpenStreetMap-based risk map. Users can search any NE India district, click "Analyze Risk," and instantly get a risk score, risk level, terrain details (elevation, slope, elevation zone), and contributing factors (rainfall impact, temperature impact, etc.). The system also shows a hazard chain concept explaining how heavy rainfall can lead to slope instability, then landslides, then possible river disruption and downstream flooding.

### Full Functionality of LandAlert
1. **Dashboard** - Overview of regional risk summary, AI analysis after prediction, quick actions
2. **Risk Map** - Real Leaflet/OpenStreetMap with 9 state markers, color-coded by risk level (green/yellow/orange/red), clickable markers showing elevation, slope, risk score
3. **Analytics** - Model performance metrics (Accuracy 76.9%, ROC-AUC 79.2%), historical landslide events table, rainfall-risk relationship
4. **Alerts** - ML-generated alerts for High/Very High risk areas, filterable by severity, alert count badge in sidebar
5. **Methodology** - Transparent documentation of the ML pipeline and model features
6. **Location Search** - 54 searchable districts with autocomplete
7. **Risk Prediction** - POST /predict endpoint returns risk score, risk level, contributing factors, terrain data
8. **Hazard Cascade** - Visual 5-step chain: Rainfall → Instability → Landslide → River Disruption → Flooding (marked as conceptual)
9. **Terrain Analysis** - Real elevation (8m to 4,036m) and slope (0° to 32.4°) from SRTM 90m data
10. **Historical Data** - Past landslide events for each state from NASA catalog
11. **Regional Overview** - Monitored locations count, elevated zones, active warnings, hotspot list with severity badges

---

## WHAT HAS BEEN COMPLETED

### 1. Frontend (Phase 1) - DONE
- Full Next.js 16 app with TypeScript + Tailwind CSS 4
- 5 screens: Dashboard, Risk Map, Analytics, Alerts, Methodology
- 28+ UI components
- Responsive design, mobile support

### 2. ML Model v3 - DONE (Terrain Added)
- **Model**: HistGradientBoosting (sklearn Pipeline)
- **Trained on**: `datasets/ne_india_landslide_enriched.csv` (1,772 samples) + `Rainfall_Data_LL.csv` + `datasets/ne_terrain_lookup.csv`
- **Features**: latitude, longitude, month, temp_2m, is_monsoon, rainfall_mm, elevation_m, slope_deg, state
- **Accuracy**: 76.9%, Precision: 54.9%, Recall: 43.8%, F1: 48.8%, ROC-AUC: 79.2%
- **Terrain data source**: Open-Elevation API (SRTM 90m resolution)
- **Model saved**: `ml_model/rf_landslide_model.pkl` (Pipeline dict with "pipeline" key)
- **Metadata**: `ml_model/model_meta.json`
- **Backup**: `ml/model_ne_terrain.joblib`

### 3. FastAPI Backend v3 - DONE (Terrain Support)
- **File**: `ml_api.py` (root directory)
- **Run command**: `ml\.venv\Scripts\python.exe -m uvicorn ml_api:app --host 127.0.0.1 --port 8000`
- **8 endpoints** - all updated with terrain support:
  - GET /health - Model metrics + features list (9 features)
  - POST /predict - Risk prediction with rainfall + terrain data
  - GET /snapshot - All 9 NER states with rainfall + temp + elevation + slope
  - GET /alerts - ML-generated alerts with terrain info
  - GET /risk-summary - Low/moderate/high counts
  - GET /history/{state} - Historical landslide records with terrain
  - GET /districts - 54 searchable locations
  - GET /states - All state names

### 4. Frontend Integration - DONE
- `lib/ml-api.ts` - Updated with terrain types (TerrainData, PredictResult with terrain)
- Dashboard - Loads snapshot on mount, real predictions with terrain on search
- Analytics - Live model metrics from API
- Alerts - ML-generated alerts from /alerts endpoint
- LocationSearch - Passes search term to ML prediction
- Risk Factors - Dynamically computed from API factors (Rainfall, Temperature, Elevation, Slope)
- Location Details - Shows real elevation/slope from API (no more hardcoded "42" and "1,240 m")

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

| Metric | v1 (temp only) | v2 (+ rainfall) | v3 (+ terrain) |
|--------|----------------|-----------------|----------------|
| Accuracy | 71.0% | 78.0% | 76.9% |
| Precision | 45.0% | 57.1% | 54.9% |
| Recall | 79.0% | 49.4% | 43.8% |
| F1 | 58.0% | 53.0% | 48.8% |
| ROC-AUC | 75.0% | 81.8% | 79.2% |
| Features | 4 | 7 | 9 |

Note: v3 shows slightly lower metrics because terrain features (elevation_m, slope_deg) have
low permutation importance in the current dataset - they correlate with lat/lon which are already
features. However, terrain data IS used by the model and is displayed in the UI for credibility.

---

## TERRAIN DATA

- **Source**: Open-Elevation API (https://open-elevation.com/) - SRTM 90m resolution
- **Script**: `ml/fetch_terrain.py` - Fetches elevation + computes slope from neighbors
- **Cache**: `datasets/_terrain_cache.json` - Cached API responses
- **Lookup**: `datasets/ne_terrain_lookup.csv` - 441 coordinate -> terrain mappings
- **Elevation range**: 8m - 4,036m
- **Slope range**: 0° - 32.4°
- **State averages**: Computed during API startup from all training coordinates

---

## DATASETS AVAILABLE

| Dataset | Location | Features |
|---------|----------|----------|
| ne_india_landslide_enriched.csv | datasets/ | lat, lon, month, year, state, landslide_occurred, temp_2m, is_monsoon |
| ne_terrain_lookup.csv | datasets/ | lat, lon, elevation_m, slope_deg (SRTM) |
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
| ml_api.py | FastAPI backend v3 (with terrain support) |
| ml_model/rf_landslide_model.pkl | Trained Pipeline (dict with "pipeline" key) |
| ml_model/model_meta.json | Model metadata + metrics |
| ml/add_terrain.py | Script to retrain model with terrain features |
| ml/add_rainfall.py | Script to retrain model with rainfall (v2) |
| ml/fetch_terrain.py | Fetches elevation data from Open-Elevation API |
| ml/deploy_model.py | Deploys model to ml_model/ directory |
| lib/ml-api.ts | Frontend API client (with terrain types) |
| datasets/ne_india_landslide_enriched.csv | Training data |
| datasets/ne_terrain_lookup.csv | Terrain lookup (441 coords) |
| Rainfall_Data_LL.csv | IMD rainfall data by subdivision |

---

## API TEST RESULTS (Working - v3)

- /health: status=healthy, model_loaded=True, features=[lat,lon,month,temp_2m,is_monsoon,rainfall_mm,elevation_m,slope_deg]
- /predict Meghalaya Jul: risk=Low (4.5%), elev=1438m, slope=2.58deg, zone=MOUNTAIN, cat=FLAT
- /predict Sikkim Aug: risk=Low (10.1%), elev=1530m, slope=7.58deg, zone=MOUNTAIN, cat=MODERATE
- /snapshot: 9 states with real terrain data
  - Arunachal Pradesh: High (69.9%), elev=1245m, slope=6.3deg
  - Sikkim: Moderate (38.6%), elev=1656m, slope=5.5deg
  - Others: Low
- /alerts: Generated for High/Very High risk states
- /history Meghalaya: 11/44 events with terrain data
- /districts: 54 districts

---

## CONVERSATION SUMMARY

- Phase A-C: Model training, API, frontend integration - DONE
- Phase D: Added rainfall data from Rainfall_Data_LL.csv to model - DONE
- Phase E: Added terrain data (elevation + slope) from SRTM via Open-Elevation API - DONE
- Model v3: 76.9% accuracy with 9 features (lat, lon, month, temp, monsoon, rainfall, elevation, slope, state)
- Frontend shows real terrain data in location details and risk factors

---

## NEXT SESSION STARTER

When continuing:
1. Check if ML API is running: `curl http://127.0.0.1:8000/health`
2. If not running: `ml\.venv\Scripts\python.exe -m uvicorn ml_api:app --host 127.0.0.1 --port 8000`
3. Start frontend: `npm run dev`

---

## CURRENT TASK: Leaflet Map Integration (COMPLETED ✅)

### What was done today (Sep 5):
- Installed leaflet, react-leaflet, @types/leaflet via pnpm
- Created `components/leaflet-map.tsx` - Real Leaflet/OpenStreetMap component
  - OpenStreetMap tiles (free, no API key)
  - Real lat/lon markers from STATE_GEO for all 9 NE India states
  - Risk-colored circle markers (green/yellow/orange/red) with divIcon
  - Click marker -> select state -> show details in side panel
  - Zoom controls, layer selector, search bar, risk legend
  - Dynamic import (SSR-safe for Next.js)
- Updated `components/screens/risk-map.tsx`:
  - Replaced `MapPanel` import with dynamic `LeafletMap`
  - Removed CSS-based STATE_COORDS (percentage positions)
  - Markers now use real lat/lng from LeafletMap's STATE_GEO
- Added Leaflet CSS + custom styles to `app/globals.css`
- `npm run build` - SUCCESS, no TypeScript errors
- Added elevation + slope to risk-map side panel (from ML API terrain data)

### Real coordinates for NE India states:
```typescript
const STATE_GEO: Record<string, { lat: number; lng: number }> = {
  'Meghalaya': { lat: 25.4670, lng: 91.3662 },
  'Assam': { lat: 26.2006, lng: 92.9376 },
  'Mizoram': { lat: 23.1645, lng: 92.9376 },
  'Manipur': { lat: 24.6637, lng: 93.9063 },
  'Sikkim': { lat: 27.5330, lng: 88.5122 },
  'Arunachal Pradesh': { lat: 28.2180, lng: 97.0840 },
  'Nagaland': { lat: 26.1584, lng: 94.5624 },
  'Tripura': { lat: 23.9408, lng: 92.0000 },
  'West Bengal': { lat: 22.9875, lng: 87.8550 },
}
```

---

## REMAINING PRIORITIES

### Priority 1: Real Map (Leaflet/OpenStreetMap) - IN PROGRESS
- Install leaflet, react-leaflet, @types/leaflet
- Replace CSS/SVG map with actual Leaflet map
- Add real markers with lat/lon positioning
- Add popups with risk details

### Priority 2: Real Charts
- Install recharts library
- Replace hand-drawn SVG with real charts from ML data

### Priority 3: Root README.md
- Create project README for hackathon submission

### Priority 4: Model Explainability
- Use permutation importance from actual model for risk factors
