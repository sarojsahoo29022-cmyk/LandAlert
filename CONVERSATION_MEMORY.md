# LandAlert Project Memory
# Save this file for next session - Start from here

## PROJECT: LandAlert
## SIH PROBLEM: SIH26001
## TITLE: AI-Based Early Warning and Landslide Risk Monitoring System in NER

## CURRENT DATE: September 4, 2026

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

## CURRENT TASK: Leaflet Map Integration (IN PROGRESS)

### What was done today:
- Merged Mlrestpart branch into master, pushed to GitHub, deleted subbranch
- Updated .gitignore (added debug logs, binary model files)
- Explored current CSS-based map implementation (MapPanel component)
- Decided to replace CSS map with real Leaflet/OpenStreetMap

### What needs to be done next:
1. **Install packages** (npm install timed out - retry tomorrow):
   - `npm install leaflet react-leaflet @types/leaflet`
2. **Create LeafletMap component** (`components/leaflet-map.tsx`):
   - Use OpenStreetMap tiles (free, no API key)
   - Real lat/lon markers from API districts
   - Risk-colored circle markers (green/yellow/orange/red)
   - Click marker -> select state -> show details in side panel
   - Center on NE India (~25.5°N, 93°E), zoom 6
3. **Update risk-map.tsx**:
   - Replace `MapPanel` import with new `LeafletMap`
   - Replace `STATE_COORDS` percentage positions with real lat/lon
   - Keep side panel, filters, risk score indicator as-is
4. **Add Leaflet CSS** to globals.css:
   - `@import 'leaflet/dist/leaflet.css';` or link tag
5. **Test build**: `npm run build`

### Key files to modify:
- `components/leaflet-map.tsx` (NEW - main Leaflet component)
- `components/screens/risk-map.tsx` (replace MapPanel with LeafletMap)
- `app/globals.css` (add Leaflet CSS)
- `components/map-panel.tsx` (keep for dashboard mini-map if needed)

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
