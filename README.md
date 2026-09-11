<div align="center">

# GeoShield

### AI-Based Early Warning and Landslide Risk Monitoring System for NE India

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5-F7931E?style=flat-square&logo=scikitlearn)

*Smart India Hackathon (SIH26001) — Detect → Understand → Visualize → Monitor → Support Early Action*

</div>

---

## Overview

GeoShield is a full-stack early warning platform that combines **machine learning**, **interactive maps**, and **cascading hazard analysis** to monitor and predict landslide risks across North-Eastern India. It ingests environmental data (rainfall, terrain, elevation, slope, temperature), runs it through a trained **HistGradientBoosting classifier**, and presents risk insights through a polished dashboard with real-time alerts and SMS notifications.

---

## Features

- **Interactive Risk Map** — Leaflet/OpenStreetMap with state-level risk markers and filtering
- **ML-Powered Predictions** — HistGradientBoosting model trained on enriched historical landslide data
- **Feature Importance Analysis** — Recharts-powered visualization of model feature contributions
- **Risk Explainability** — Understand WHY a location is high-risk with top risk drivers
- **Hazard Cascade Analysis** — Visualize potential cascading hazards (rainfall → landslide → flooding)
- **SMS Alerts** — Twilio-powered manual SMS notifications for high-risk situations
- **Regional Analytics** — Model metrics, rainfall-risk correlation charts, and historical event logs
- **Location Search** — Search any location in NE India for instant risk assessment

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Charts | Recharts (feature importance, risk trends, rainfall correlation) |
| Maps | Leaflet, React-Leaflet, OpenStreetMap |
| ML Backend | FastAPI, scikit-learn, joblib, pandas, numpy |
| Model | HistGradientBoostingClassifier (76.9% accuracy, 79.2% ROC-AUC) |
| Alerts | Twilio SMS API (manual send) |

---

## Project Structure

```
GeoShield/
├── app/                        # Next.js app router
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main page
├── components/
│   ├── screens/                # Screen-level components
│   │   ├── dashboard.tsx       # Main dashboard with AI analysis
│   │   ├── risk-map.tsx        # Interactive Leaflet risk map
│   │   ├── analytics.tsx       # Charts, metrics, history
│   │   ├── alerts.tsx          # Alert management panel
│   │   └── methodology.tsx     # ML methodology documentation
│   ├── leaflet-map.tsx         # Map renderer with state markers
│   ├── feature-importance-chart.tsx  # Recharts feature importance
│   ├── hazard-chain.tsx        # Cascading hazard visualization
│   ├── subscribe-form.tsx      # SMS send button
│   └── ...                     # Shared UI components
├── lib/
│   ├── ml-api.ts               # Client-side ML API bridge
│   ├── mock-data.ts            # Fallback mock data
│   └── types.ts                # TypeScript type definitions
├── ml_api.py                   # FastAPI ML server
├── ml/                         # ML training & test scripts
├── ml_model/                   # Trained model artifacts
├── datasets/                   # Training datasets
├── requirements.txt            # Python dependencies
└── .env.example                # Environment variable template
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **Python** 3.10 or later
- **npm** or pnpm

### Step 1: Clone & Install

```bash
git clone https://github.com/sarojsahoo29022-cmyk/GeoShield.git
cd GeoShield
npm install
pip install -r requirements.txt
```

### Step 2: Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Twilio credentials (optional, for SMS):

```
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1xxxxxxxxxx
TWILIO_TO_NUMBERS=+91xxxxxxxxxx,+91xxxxxxxxxx
```

### Step 3: Start Everything

```bash
npm run dev
```

This starts both the ML API (port 8000) and Next.js frontend (port 3000).

Open **http://localhost:3000**

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health and model status |
| `/predict` | POST | Predict landslide risk for a location |
| `/predict-explain` | POST | Prediction with feature contributions |
| `/predict-live` | POST | Live prediction with auto-filled data |
| `/feature-importance` | GET | Model feature importance rankings |
| `/snapshot` | GET | Current risk snapshot for all NE India states |
| `/alerts` | GET | Active risk alerts based on ML predictions |
| `/history/{state}` | GET | Historical landslide events for a state |
| `/risk-summary` | GET | Aggregated risk level counts |
| `/districts` | GET | List of all districts for search |
| `/send-sms` | POST | Send SMS alert via Twilio |
| `/sms-status` | GET | Twilio configuration status |

---

## ML Model

The landslide prediction model uses a **HistGradientBoostingClassifier** trained on:

- Historical landslide event records from NE India (1,773 samples)
- Monthly rainfall data by meteorological subdivision
- Terrain features (elevation, slope)
- Environmental variables (temperature, monsoon flag, coordinates, state)

### Model Performance

| Metric | Value |
|--------|-------|
| Accuracy | 76.9% |
| Precision | 57.7% |
| Recall | 43.8% |
| F1 Score | 50.0% |
| ROC-AUC | 79.2% |

### Top Features

1. Rainfall (most important)
2. Elevation
3. Slope
4. Latitude
5. Temperature

---

## Screens

- **Dashboard** — Overview with regional risk summary, AI analysis, feature importance chart
- **Risk Map** — Interactive Leaflet map with risk level and hazard type filters
- **Analytics** — Model metrics, rainfall-risk charts, hazard cascade timeline
- **Alerts** — Filterable alert feed with manual SMS send capability
- **Methodology** — Transparent documentation of the ML pipeline

---

## How to Run (Development)

```bash
# Start both frontend and backend
npm run dev

# Or run separately:
# Terminal 1 - ML API
python -m uvicorn ml_api:app --host 127.0.0.1 --port 8000

# Terminal 2 - Frontend
npm run dev
```

---

## License

This project is for educational and research purposes (Smart India Hackathon SIH26001).

---

<div align="center">

Built for disaster resilience in North-Eastern India

</div>
