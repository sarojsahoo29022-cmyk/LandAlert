// Client-side bridge to the GeoShield FastAPI ML service (ml_api.py).
// All calls fail soft: if the service is not running, callers fall back to mock UI data.

export const ML_API_URL =
  process.env.NEXT_PUBLIC_ML_API_URL ?? 'http://127.0.0.1:8000'

export type RiskLevelRaw = 'Low' | 'Moderate' | 'High' | 'Very High'

export interface PredictFeatures {
  latitude?: number
  longitude?: number
  month: number
  year: number
  temp_2m?: number
  state: string
}

export interface PredictResult {
  district: string
  landslide_probability: number
  risk_level: string
  prediction: number
  factors: Record<string, string>
  explanation: string
}

export interface ModelMetrics {
  accuracy: number
  precision: number
  recall: number
  f1: number
  roc_auc: number
  confusion_matrix: number[][]
  positive_rate_train: number
}

export interface SnapshotState {
  state: string
  risk_level: string
  probability: number
  locations: number
}

export interface AlertItem {
  id: string
  level: string
  label: string
  type: string
  location: string
  time: string
  text: string
  status: string
}

async function getJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${ML_API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function fetchModelMetrics(): Promise<ModelMetrics | null> {
  const data = await getJson<{ status: string; metrics: ModelMetrics }>('/health')
  return data?.metrics ?? null
}

export async function fetchDistricts(): Promise<string[] | null> {
  const data = await getJson<{ districts: string[] }>('/districts')
  return data?.districts ?? null
}

export async function predictRisk(
  features: PredictFeatures,
): Promise<PredictResult | null> {
  return getJson<PredictResult>('/predict', {
    method: 'POST',
    body: JSON.stringify(features),
  })
}

export async function fetchSnapshot(): Promise<SnapshotState[] | null> {
  const data = await getJson<{ states: SnapshotState[] }>('/snapshot')
  return data?.states ?? null
}

export async function fetchAlerts(): Promise<AlertItem[] | null> {
  const data = await getJson<{ alerts: AlertItem[] }>('/alerts')
  return data?.alerts ?? null
}

export async function fetchRiskSummary(): Promise<{
  low: number
  moderate: number
  high: number
  'very-high': number
} | null> {
  const data = await getJson<{ summary: Record<string, number> }>('/risk-summary')
  return data?.summary ?? null
}

export async function fetchHistory(stateName: string) {
  return getJson<{
    state: string
    total_records: number
    landslide_events: number
    prevalence: number
    events: {
      year: number
      month: number
      temp_2m: number
      is_monsoon: boolean
      latitude: number
      longitude: number
    }[]
  }>(`/history/${encodeURIComponent(stateName)}`)
}

export function toRiskTone(level: string): 'low' | 'moderate' | 'high' | 'very-high' {
  const lower = level.toLowerCase()
  if (lower.includes('very')) return 'very-high'
  if (lower === 'high') return 'high'
  if (lower === 'moderate') return 'moderate'
  return 'low'
}

export function probabilityToScore(prob: number): number {
  return Math.round(prob * 100)
}
