export type RiskLevel = 'low' | 'moderate' | 'high' | 'very-high'

export type HazardType =
  | 'landslide'
  | 'extreme-rainfall'
  | 'debris-flow'
  | 'flash-flood'
  | 'mountain-hazard'

export type AlertStatus = 'active' | 'monitoring' | 'resolved'

export type AlertTone = RiskLevel | AlertStatus

export interface RiskSummary {
  low: number
  moderate: number
  high: number
  'very-high': number
}

export interface RegionalOverviewData {
  monitoredLocations: number
  elevatedZones: number
  activeWarnings: number
  updatedAgo: string
}

export interface Hotspot {
  name: string
  level: RiskLevel
}

export interface MapMarker {
  id: string
  name: string
  x: number
  y: number
  score: number
  level: RiskLevel
  hazard: HazardType
}

export interface HazardLayer {
  id: string
  name: string
  enabledByDefault: boolean
  futureIntegration?: boolean
}

export interface RiskFactor {
  name: string
  impact: 'HIGH IMPACT' | 'MEDIUM IMPACT' | 'LOWER IMPACT'
  width: string
  tone: RiskLevel
}

export interface Alert {
  id: string
  level: RiskLevel
  label: string
  type: string
  location: string
  time: string
  text: string
  status: AlertStatus
  cascading?: boolean
}

export interface HistoricalEvent {
  date: string
  location: string
  rainfall: string
  risk: RiskLevel
  status: string
}

export interface ModelMetric {
  label: string
  value: string
  note: string
}

export interface SelectedLocation {
  name: string
  state: string
  score: number
  level: RiskLevel
  rainfall: string
  slope: string
  elevation: string
  temperature?: string
  humidity?: string
  historicalSusceptibility: RiskLevel
  trend: string
  trendDelta: string
  updated: string
  primaryHazard: string
  cascadingConcern: string
}

export interface TrendPoint {
  label: string
  value: number
}

export interface RainfallPoint {
  label: string
  value: number
}

export interface RiskRainfallPoint {
  label: string
  rainfall: number
  risk: number
}
