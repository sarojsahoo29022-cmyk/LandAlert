# GeoShield / LandAlert — Conversation Memory

## Project
- Next.js (App Router) dashboard: AI-Based Landslide Early Warning & Risk Monitoring System for North-Eastern India.
- Demo/prototype for Smart India Hackathon. Currently uses mock/demo data (no real ML yet).
- Working dir: C:\Users\Saroj\OneDrive\Desktop\LandAlert

## Branding changes done (session 1)
- Renamed visible project name to **GeoShield** (kept relevant to landslide context):
  - `components/logo.tsx`: name "GeoShield", subtitle "AI LANDSLIDE INTELLIGENCE"
  - `components/footer.tsx`: "GeoShield — AI-Based Landslide Early Warning & Risk Monitoring System"
  - `app/layout.tsx`: title "GeoShield · AI Landslide Intelligence"
  - `components/sidebar.tsx`: "GeoShield v0.1 · Demo"
- Left internal identifiers (`landalert-app.tsx`) and methodology prose as-is (optional cleanup pending).
- User confirmed sidebar top is the right place for brand name. Declined adding compact logo to navbar for now ("if required i will tell you").

## Pending: ML model training (main goal)
User will provide datasets and wants a machine-learning landslide model trained.
Agreed plan / open questions to resolve when they return:
1. Dataset format (CSV/GeoJSON?) + feature columns + label type (binary yes/no, risk score, or hazard-chain forecast).
2. Prediction target: binary, probability/risk score, or hazard-chain forecasting.
3. Serving approach: Python API (FastAPI) called by Next app, OR precompute static predictions.
4. Verify Python availability in this PowerShell/Node environment before starting.

## Ready-to-run scaffolding (not yet created)
- Python training script (pandas + scikit-learn / XGBoost / PyTorch depending on data size).
- Export model as joblib/ONNX and integrate predictions into the dashboard.

## How to continue
When user says "continue": read this file, ask for the dataset + answers to the 3 questions above, then build the training pipeline.
