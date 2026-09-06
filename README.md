<div align="center">

# LandAlert

### AI-Powered Landslide Risk Monitoring & Early Warning System

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss)

*Real-time landslide risk intelligence for North-Eastern India using machine learning, geospatial mapping, and cascading hazard analysis.*

</div>

---

## Overview

LandAlert is a full-stack early warning platform that combines **machine learning**, **interactive maps**, and **hazard cascade modeling** to monitor and predict landslide risks across vulnerable regions of North-Eastern India. It ingests environmental data (rainfall, terrain, elevation, slope), runs it through a trained Random Forest classifier, and presents risk insights through a polished dashboard with real-time alerts.

---

## Features

- **Interactive Risk Map** — Leaflet/OpenStreetMap integration with state-level risk markers
- **ML-Powered Predictions** — Random Forest model trained on enriched historical landslide data
- **Hazard Cascade Analysis** — Visualize how landslides trigger debris flows, flash floods, and mountain hazards
- **Real-Time Alerts** — Filterable alert system with severity levels and status tracking
- **Regional Analytics** — Model performance metrics, rainfall-risk correlation charts, and historical event logs
- **Location Search** — Search any location in NE India to get instant risk assessment
- **Terrain Analysis** — Elevation, slope, and terrain classification for each district

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| Maps | Leaflet, React-Leaflet, OpenStreetMap |
| ML Backend | FastAPI, scikit-learn, joblib, pandas, numpy |
| Model | Random Forest classifier for landslide susceptibility |
| Charts | Custom SVG charts (risk trends, rainfall correlation) |

---

## Project Structure

```
LandAlert/
├── app/                    # Next.js app router
│   ├── layout.tsx          # Root layout with metadata
│   └── page.tsx            # Main page
├── components/
│   ├── screens/            # Screen-level components
│   │   ├── dashboard.tsx   # Main dashboard with AI analysis
│   │   ├── risk-map.tsx    # Interactive Leaflet risk map
│   │   ├── analytics.tsx   # Charts, metrics, history
│   │   ├── alerts.tsx      # Alert management panel
│   │   └── methodology.tsx # ML methodology documentation
│   ├── leaflet-map.tsx     # Map renderer with state markers
│   ├── hazard-chain.tsx    # Cascading hazard visualization
│   └── ...                 # Shared UI components
├── lib/
│   ├── ml-api.ts           # Client-side ML API bridge
│   ├── mock-data.ts        # Fallback mock data
│   └── types.ts            # TypeScript type definitions
├── ml_api.py               # FastAPI ML server (serves predictions)
├── ml/                     # ML training & data pipeline scripts
├── ml_model/               # Trained model artifacts
├── datasets/               # Training datasets (gitignored)
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
└── Rainfall_Data_LL.csv    # Rainfall reference data
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **Python** 3.10 or later
- **pnpm** (recommended) or npm

---

## How to Run (Full ML Model Setup)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/LandAlert.git
cd LandAlert
```

### Step 2: Install Frontend Dependencies

```bash
pnpm install
```

> If you don't have pnpm, install it first:
> ```bash
> npm install -g pnpm
> ```

### Step 3: Install Python ML Dependencies

```bash
pip install -r requirements.txt
```

Or install manually:

```bash
pip install fastapi uvicorn scikit-learn joblib pandas numpy pydantic
```

### Step 4: Configure Environment Variables

Copy the example env file and set the ML API URL:

```bash
cp .env.example .env.local
```

The `.env.local` should contain:

```
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

### Step 5: Start the ML API Server (Required for live predictions)

Open a **new terminal** and run:

```bash
python ml_api.py
```

You should see output like:

```
INFO:     Started server process
INFO:     Waiting for application startup.
[startup] Terrain lookup loaded: XXX entries
[startup] State avg coords computed for 9 states
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

> The ML server must be running for the dashboard to show real predictions.

### Step 6: Start the Frontend (in a second terminal)

```bash
pnpm dev
```

You should see:

```
  ▲ Next.js 16.3.3
  - Local: http://localhost:3000
```

### Step 7: Open in Browser

Navigate to:

```
http://localhost:3000
```

The dashboard will now show **real ML predictions** from the Random Forest model.

---

## Quick Summary (Run in 4 Commands)

```bash
git clone https://github.com/your-username/LandAlert.git
cd LandAlert
pnpm install
pip install -r requirements.txt
```

Then open **two terminals**:

```bash
# Terminal 1 — ML API
python ml_api.py

# Terminal 2 — Frontend
pnpm dev
```

Open **http://localhost:3000**

---

## ML Model

The landslide prediction model uses a **Random Forest Classifier** trained on:

- Historical landslide event records from NE India
- Monthly rainfall data by meteorological subdivision
- Terrain features (elevation, slope, elevation zone, slope category)
- Environmental variables (temperature, geographic coordinates)

### Training the Model

```bash
cd ml
python train.py
```

This produces the model artifact at `ml_model/rf_landslide_model.pkl`.

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health and model metrics |
| `/predict` | POST | Predict landslide risk for a location |
| `/snapshot` | GET | Current risk snapshot for all NE India states |
| `/alerts` | GET | Active risk alerts based on ML predictions |
| `/history/{state}` | GET | Historical landslide events for a state |
| `/risk-summary` | GET | Aggregated risk level counts |

### Model Performance

The trained model achieves:

- **Accuracy**: ~78%
- **Precision**: ~57%
- **Recall**: ~49%
- **F1 Score**: ~53%
- **ROC AUC**: ~82%

---

## Screenshots

The app includes five main screens:

- **Dashboard** — Overview with regional risk summary, AI analysis, and quick actions
- **Risk Map** — Interactive Leaflet map with color-coded risk markers across NE India
- **Analytics** — Model metrics, rainfall-risk charts, hazard cascade timeline
- **Alerts** — Filterable alert feed with severity and status filters
- **Methodology** — Transparent documentation of the ML pipeline

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Dashboard shows no data | Make sure `python ml_api.py` is running in a separate terminal |
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| `pnpm: command not found` | Run `npm install -g pnpm` |
| Port 8000 already in use | Kill the process or use `uvicorn ml_api:app --port 8001` and update `.env.local` |
| Port 3000 already in use | Next.js will auto-pick the next port, check terminal output |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is for educational and research purposes.

---

<div align="center">

Built for disaster resilience in North-Eastern India

</div>
