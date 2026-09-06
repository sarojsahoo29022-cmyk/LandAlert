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
| Deployment | Vercel (frontend), local FastAPI server (ML API) |

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
└── Rainfall_Data_LL.csv    # Rainfall reference data
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **Python** 3.10 or later
- **pnpm** (recommended) or npm

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/LandAlert.git
cd LandAlert
```

### 2. Install Frontend Dependencies

```bash
pnpm install
```

> If you don't have pnpm, install it first:
> ```bash
> npm install -g pnpm
> ```

### 3. Install Python Dependencies (for ML API)

```bash
pip install fastapi uvicorn scikit-learn joblib pandas numpy pydantic
```

### 4. Start the ML API Server (Optional — for live predictions)

```bash
python ml_api.py
```

The API runs at `http://localhost:8000`. The frontend will gracefully fall back to mock data if the ML server is not running.

### 5. Start the Development Server

```bash
pnpm dev
```

### 6. Open in Browser

Navigate to:

```
http://localhost:3000
```

You should see the LandAlert dashboard.

---

## Quick Start (Frontend Only)

If you just want to see the UI without the ML backend:

```bash
git clone https://github.com/your-username/LandAlert.git
cd LandAlert
pnpm install
pnpm dev
```

Then open **http://localhost:3000** — the dashboard works with mock data out of the box.

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
| `/predict` | POST | Predict landslide risk for a location |
| `/snapshot` | GET | Get current risk snapshot for all states |
| `/alerts` | GET | Get active risk alerts |
| `/history/{state}` | GET | Get historical landslide events |
| `/metrics` | GET | Get model performance metrics |

---

## Screenshots

The app includes five main screens:

- **Dashboard** — Overview with regional risk summary, AI analysis, and quick actions
- **Risk Map** — Interactive Leaflet map with color-coded risk markers across NE India
- **Analytics** — Model metrics, rainfall-risk charts, hazard cascade timeline
- **Alerts** — Filterable alert feed with severity and status filters
- **Methodology** — Transparent documentation of the ML pipeline

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
