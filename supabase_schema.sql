-- LandAlert Supabase Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)

-- ============================================================
-- TABLE 1: locations - Monitored locations in NE India
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  latitude DECIMAL(10, 6) NOT NULL,
  longitude DECIMAL(10, 6) NOT NULL,
  elevation_m DECIMAL(10, 2),
  slope_deg DECIMAL(6, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for location lookups
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations(latitude, longitude);

-- ============================================================
-- TABLE 2: predictions - ML prediction history
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
  id BIGSERIAL PRIMARY KEY,
  location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
  location_name VARCHAR(200),
  state VARCHAR(100),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  risk_level VARCHAR(20) NOT NULL,
  probability DECIMAL(6, 4) NOT NULL,
  rainfall_mm DECIMAL(10, 2),
  temperature_c DECIMAL(6, 2),
  elevation_m DECIMAL(10, 2),
  slope_deg DECIMAL(6, 2),
  factors JSONB,
  explanation TEXT,
  data_status VARCHAR(20),
  model_version VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for prediction queries
CREATE INDEX IF NOT EXISTS idx_predictions_state ON predictions(state);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_risk ON predictions(risk_level);

-- ============================================================
-- TABLE 3: alerts - Generated alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  prediction_id BIGINT REFERENCES predictions(id) ON DELETE SET NULL,
  location_name VARCHAR(200),
  state VARCHAR(100),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT,
  risk_level VARCHAR(20),
  probability DECIMAL(6, 4),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for alert queries
CREATE INDEX IF NOT EXISTS idx_alerts_state ON alerts(state);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);

-- ============================================================
-- TABLE 4: sensor_readings - Live sensor data
-- ============================================================
CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  location_id BIGINT REFERENCES locations(id) ON DELETE SET NULL,
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  rainfall_mm DECIMAL(10, 2),
  temperature_c DECIMAL(6, 2),
  humidity_pct DECIMAL(5, 2),
  wind_speed_kmh DECIMAL(6, 2),
  pressure_hpa DECIMAL(7, 2),
  source VARCHAR(50),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_sensor_location ON sensor_readings(location_id);
CREATE INDEX IF NOT EXISTS idx_sensor_recorded ON sensor_readings(recorded_at DESC);

-- ============================================================
-- TABLE 5: prediction_history - Simplified history for charts
-- ============================================================
CREATE TABLE IF NOT EXISTS prediction_history (
  id BIGSERIAL PRIMARY KEY,
  location_name VARCHAR(200),
  state VARCHAR(100),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  risk_level VARCHAR(20),
  probability DECIMAL(6, 4),
  rainfall_mm DECIMAL(10, 2),
  temperature_c DECIMAL(6, 2),
  elevation_m DECIMAL(10, 2),
  slope_deg DECIMAL(6, 2),
  data_status VARCHAR(20),
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history queries
CREATE INDEX IF NOT EXISTS idx_history_state ON prediction_history(state);
CREATE INDEX IF NOT EXISTS idx_history_created ON prediction_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_month_year ON prediction_history(year, month);

-- ============================================================
-- Enable Row Level Security (RLS) - Optional but recommended
-- ============================================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_history ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the frontend)
CREATE POLICY "Allow public read on locations" ON locations FOR SELECT USING (true);
CREATE POLICY "Allow public read on predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Allow public read on alerts" ON alerts FOR SELECT USING (true);
CREATE POLICY "Allow public read on sensor_readings" ON sensor_readings FOR SELECT USING (true);
CREATE POLICY "Allow public read on prediction_history" ON prediction_history FOR SELECT USING (true);

-- Allow service role full access (for the backend API)
CREATE POLICY "Allow service role all on locations" ON locations FOR ALL USING (true);
CREATE POLICY "Allow service role all on predictions" ON predictions FOR ALL USING (true);
CREATE POLICY "Allow service role all on alerts" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow service role all on sensor_readings" ON sensor_readings FOR ALL USING (true);
CREATE POLICY "Allow service role all on prediction_history" ON prediction_history FOR ALL USING (true);

-- ============================================================
-- Insert initial NE India locations
-- ============================================================
INSERT INTO locations (name, state, district, latitude, longitude, elevation_m, slope_deg) VALUES
  ('Shillong', 'Meghalaya', 'East Khasi Hills', 25.5788, 91.8933, 1496, 2.58),
  ('Aizawl', 'Mizoram', 'Aizawl', 23.7271, 92.7176, 1020, 5.30),
  ('Imphal', 'Manipur', 'Imphal West', 24.8170, 93.9368, 786, 3.20),
  ('Gangtok', 'Sikkim', 'East Sikkim', 27.3389, 88.6065, 1650, 7.58),
  ('Itanagar', 'Arunachal Pradesh', 'Papum Pare', 27.0844, 93.6053, 340, 4.10),
  ('Guwahati', 'Assam', 'Kamrup Metro', 26.1445, 91.7362, 55, 1.20),
  ('Kohima', 'Nagaland', 'Kohima', 25.6586, 94.1086, 1444, 6.80),
  ('Agartala', 'Tripura', 'West Tripura', 23.8315, 91.2869, 15, 0.80),
  ('Tura', 'Meghalaya', 'West Garo Hills', 25.5134, 90.2028, 330, 3.50),
  ('Dibrugarh', 'Assam', 'Dibrugarh', 27.4728, 94.9120, 108, 1.10),
  ('Pasighat', 'Arunachal Pradesh', 'East Siang', 28.0664, 95.3262, 154, 2.80),
  ('Tezpur', 'Assam', 'Sonitpur', 26.6528, 92.6936, 64, 0.90),
  ('Silchar', 'Assam', 'Cachar', 24.8333, 92.7789, 22, 0.60),
  ('Jowai', 'Meghalaya', 'Jaintia Hills', 25.4993, 92.1940, 1340, 4.20),
  ('Nongstoin', 'Meghalaya', 'West Khasi Hills', 25.5198, 91.2638, 1400, 5.10),
  ('Mokokchung', 'Nagaland', 'Mokokchung', 26.3236, 94.5634, 1240, 6.20),
  ('Mon Town', 'Nagaland', 'Mon', 26.7819, 94.8313, 890, 8.50),
  ('Tuensang', 'Nagaland', 'Tuensang', 26.2670, 94.8243, 1100, 7.10),
  ('Wokha', 'Nagaland', 'Wokha', 26.0882, 94.2598, 1350, 5.80),
  ('Zunheboto', 'Nagaland', 'Zunheboto', 26.0113, 94.5197, 1800, 6.90),
  ('Longleng', 'Nagaland', 'Longleng', 26.5321, 94.9258, 1070, 5.40),
  ('Peren', 'Nagaland', 'Peren', 25.5381, 93.7402, 1450, 7.20),
  ('Dimapur', 'Nagaland', 'Dimapur', 25.9044, 93.7264, 195, 1.50),
  ('Churachandpur', 'Manipur', 'Churachandpur', 24.3333, 93.6833, 914, 4.80),
  ('Thoubal', 'Manipur', 'Thoubal', 24.6333, 94.0167, 768, 2.90),
  ('Ukhrul', 'Manipur', 'Ukhrul', 25.1000, 94.3667, 1890, 8.20),
  ('Chandel', 'Manipur', 'Chandel', 24.3333, 94.6833, 830, 5.60),
  ('Senapati', 'Manipur', 'Senapati', 25.4500, 94.0167, 1680, 7.80),
  ('Tamenglong', 'Manipur', 'Tamenglong', 24.9833, 93.5000, 910, 6.10),
  ('Darjeeling', 'West Bengal', 'Darjeeling', 27.0410, 88.2663, 2200, 9.50),
  ('Kalimpong', 'West Bengal', 'Kalimpong', 27.0500, 88.4500, 1250, 7.20),
  ('Kurseong', 'West Bengal', 'Darjeeling', 26.8833, 88.2833, 1480, 6.80),
  ('Siliguri', 'West Bengal', 'Darjeeling', 26.7167, 88.4167, 40, 0.50),
  ('Namchi', 'Sikkim', 'South Sikkim', 27.1667, 88.3500, 1350, 5.80),
  ('Gyalshing', 'Sikkim', 'West Sikkim', 27.2833, 88.2500, 960, 6.40),
  ('Mangan', 'Sikkim', 'North Sikkim', 27.5167, 88.5333, 960, 7.10),
  ('Rangpo', 'Sikkim', 'East Sikkim', 27.1833, 88.5333, 380, 3.20),
  ('Jorethang', 'Sikkim', 'South Sikkim', 27.1000, 88.3167, 300, 2.80),
  ('Singtam', 'Sikkim', 'East Sikkim', 27.2333, 88.5000, 460, 3.90)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Enable Realtime for live updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE predictions;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
