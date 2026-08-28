import type {
  Alert,
  HazardLayer,
  HistoricalEvent,
  Hotspot,
  MapMarker,
  ModelMetric,
  RegionalOverviewData,
  RiskFactor,
  RiskLevel,
  RiskRainfallPoint,
  RiskSummary,
  SelectedLocation,
  TrendPoint,
  RainfallPoint,
} from './types'

/**
 * Centralised demonstration data for the LandAlert UI prototype.
 *
 * IMPORTANT: every value below is mock/static data for design purposes only.
 * It is intentionally structured so a real API, GeoJSON feed or ML service can
 * replace these exports later without changing the UI components.
 */

export const riskSummary: RiskSummary = {
  low: 42,
  moderate: 18,
  high: 7,
  'very-high': 2,
}

export const regionalOverview: RegionalOverviewData = {
  monitoredLocations: 69,
  elevatedZones: 9,
  activeWarnings: 2,
  updatedAgo: '2 min ago',
}

export const hotspots: Hotspot[] = [
  { name: 'East Khasi Hills', level: 'very-high' },
  { name: 'Wayanad, Kerala', level: 'very-high' },
  { name: 'Aizawl', level: 'high' },
  { name: 'Chamoli, Uttarakhand', level: 'high' },
  { name: 'Imphal', level: 'high' },
  { name: 'Gangtok', level: 'moderate' },
]

export const mapMarkers: MapMarker[] = [
  { id: 'shillong', name: 'Shillong', x: 41, y: 52, score: 82, level: 'very-high', hazard: 'landslide' },
  { id: 'aizawl', name: 'Aizawl', x: 56, y: 64, score: 68, level: 'high', hazard: 'landslide' },
  { id: 'imphal', name: 'Imphal', x: 64, y: 49, score: 61, level: 'high', hazard: 'landslide' },
  { id: 'gangtok', name: 'Gangtok', x: 31, y: 33, score: 47, level: 'moderate', hazard: 'landslide' },
  { id: 'tura', name: 'Tura', x: 30, y: 60, score: 22, level: 'low', hazard: 'landslide' },
  { id: 'wayanad', name: 'Wayanad', x: 72, y: 80, score: 79, level: 'very-high', hazard: 'landslide' },
  { id: 'kodagu', name: 'Kodagu', x: 67, y: 83, score: 58, level: 'high', hazard: 'landslide' },
  { id: 'chamoli', name: 'Chamoli', x: 39, y: 16, score: 71, level: 'high', hazard: 'landslide' },
  { id: 'mandi', name: 'Mandi', x: 34, y: 24, score: 54, level: 'moderate', hazard: 'landslide' },
  { id: 'konkan', name: 'Konkan', x: 60, y: 76, score: 49, level: 'moderate', hazard: 'landslide' },
  { id: 'nilgiris', name: 'Nilgiris', x: 65, y: 88, score: 63, level: 'high', hazard: 'landslide' },
]

export const hazardLayers: HazardLayer[] = [
  { id: 'landslide', name: 'Landslide Risk', enabledByDefault: true },
  { id: 'extreme-rainfall', name: 'Extreme Rainfall', enabledByDefault: false, futureIntegration: true },
  { id: 'debris-flow', name: 'Debris Flow', enabledByDefault: false, futureIntegration: true },
  { id: 'flash-flood', name: 'Flash Flood', enabledByDefault: false, futureIntegration: true },
  { id: 'mountain-hazard', name: 'Mountain Hazard', enabledByDefault: false, futureIntegration: true },
  { id: 'historical', name: 'Historical Events', enabledByDefault: true },
]

export const riskFactors: RiskFactor[] = [
  { name: 'Rainfall', impact: 'HIGH IMPACT', width: '92%', tone: 'high' },
  { name: 'Slope', impact: 'HIGH IMPACT', width: '84%', tone: 'high' },
  { name: 'Historical susceptibility', impact: 'MEDIUM IMPACT', width: '57%', tone: 'moderate' },
  { name: 'Elevation', impact: 'LOWER IMPACT', width: '31%', tone: 'low' },
]

export const selectedLocation: SelectedLocation = {
  name: 'Shillong',
  state: 'Meghalaya',
  score: 82,
  level: 'high',
  rainfall: '156 mm',
  slope: '42°',
  elevation: '1,240 m',
  historicalSusceptibility: 'moderate',
  trend: 'Increasing',
  trendDelta: '↑ 18%',
  updated: '10:42 AM',
  primaryHazard: 'Landslide Risk',
  cascadingConcern: 'Heavy rainfall → slope instability → possible downstream impact',
}

export const aiExplanation =
  'Heavy recent rainfall combined with steep terrain is contributing significantly to the current risk assessment.'

export const alerts: Alert[] = [
  {
    id: 'a1',
    level: 'very-high',
    label: 'VERY HIGH',
    type: 'Landslide Risk',
    location: 'East Khasi Hills',
    time: '10:42 AM',
    text: 'Heavy rainfall and elevated landslide risk detected.',
    status: 'active',
  },
  {
    id: 'a2',
    level: 'high',
    label: 'HIGH',
    type: 'Rainfall Risk',
    location: 'Aizawl, Mizoram',
    time: '09:18 AM',
    text: 'Rainfall intensity increasing across monitored slopes.',
    status: 'monitoring',
  },
  {
    id: 'a3',
    level: 'high',
    label: 'HIGH',
    type: 'Potential Downstream Hazard',
    location: 'Example Valley',
    time: '08:54 AM',
    text: 'Terrain conditions indicate elevated downstream hazard potential.',
    status: 'monitoring',
    cascading: true,
  },
  {
    id: 'a4',
    level: 'moderate',
    label: 'MODERATE',
    type: 'Landslide Risk',
    location: 'Gangtok, Sikkim',
    time: 'Yesterday',
    text: 'Slope conditions remain under observation.',
    status: 'resolved',
  },
  {
    id: 'a5',
    level: 'low',
    label: 'LOW',
    type: 'Rainfall Risk',
    location: 'Tawang, Arunachal Pradesh',
    time: 'Yesterday',
    text: 'Rainfall has returned to baseline.',
    status: 'resolved',
  },
  {
    id: 'a6',
    level: 'very-high',
    label: 'VERY HIGH',
    type: 'Landslide Risk',
    location: 'Wayanad, Kerala',
    time: '10:05 AM',
    text: 'Demonstration: historic landslide terrain under heavy rainfall.',
    status: 'monitoring',
  },
  {
    id: 'a7',
    level: 'high',
    label: 'HIGH',
    type: 'Rainfall Risk',
    location: 'Chamoli, Uttarakhand',
    time: '09:40 AM',
    text: 'Slope instability monitored (demonstration data).',
    status: 'monitoring',
  },
]

export const historicalEvents: HistoricalEvent[] = [
  { date: '30 Jul 2024', location: 'Wayanad, Kerala', rainfall: '170 mm', risk: 'very-high', status: 'Recorded' },
  { date: '18 Aug 2026', location: 'East Khasi Hills', rainfall: '142 mm', risk: 'very-high', status: 'Recorded' },
  { date: '11 Aug 2025', location: 'Chamoli, Uttarakhand', rainfall: '120 mm', risk: 'high', status: 'Recorded' },
  { date: '04 Aug 2026', location: 'Aizawl', rainfall: '98 mm', risk: 'high', status: 'Recorded' },
  { date: '22 Jul 2026', location: 'Gangtok', rainfall: '76 mm', risk: 'moderate', status: 'Recorded' },
  { date: '09 Jul 2026', location: 'Imphal', rainfall: '61 mm', risk: 'moderate', status: 'Recorded' },
]

export const modelMetrics: ModelMetric[] = [
  { label: 'Accuracy', value: '—', note: 'DEMO' },
  { label: 'Precision', value: '—', note: 'DEMO' },
  { label: 'Recall', value: '—', note: 'DEMO' },
  { label: 'F1 Score', value: '—', note: 'DEMO' },
]

export const riskTrend: TrendPoint[] = [
  { label: 'Aug 22', value: 58 },
  { label: 'Aug 24', value: 64 },
  { label: 'Aug 26', value: 71 },
  { label: 'Today', value: 82 },
  { label: 'Aug 30', value: 74 },
]

export const rainfallSeries: RainfallPoint[] = [
  { label: '01', value: 32 },
  { label: '02', value: 48 },
  { label: '03', value: 38 },
  { label: '04', value: 72 },
  { label: '05', value: 55 },
  { label: '06', value: 82 },
  { label: '07', value: 68 },
  { label: '08', value: 96 },
  { label: '09', value: 76 },
  { label: '10', value: 63 },
  { label: '11', value: 88 },
  { label: '12', value: 72 },
]

export const riskRainfallSeries: RiskRainfallPoint[] = [
  { label: 'W1', rainfall: 40, risk: 38 },
  { label: 'W2', rainfall: 55, risk: 46 },
  { label: 'W3', rainfall: 72, risk: 58 },
  { label: 'W4', rainfall: 88, risk: 71 },
  { label: 'W5', rainfall: 96, risk: 82 },
  { label: 'W6', rainfall: 74, risk: 66 },
]

export const navItems: { label: string; icon: string }[] = [
  { label: 'Dashboard', icon: 'Activity' },
  { label: 'Risk Map', icon: 'MapPin' },
  { label: 'Analytics', icon: 'SlidersHorizontal' },
  { label: 'Alerts', icon: 'Bell' },
  { label: 'Methodology', icon: 'FileText' },
]

export const severityColorVar: Record<RiskLevel, string> = {
  low: 'var(--low)',
  moderate: 'var(--moderate)',
  high: 'var(--high)',
  'very-high': 'var(--very-high)',
}

export const severityHex: Record<RiskLevel, string> = {
  low: '#27966a',
  moderate: '#c99518',
  high: '#df762d',
  'very-high': '#c94145',
}
