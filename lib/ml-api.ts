// Client-side bridge to the GeoShield FastAPI ML service (ml_api.py).
// All calls fail soft: if the service is not running, callers fall back to mock UI data.

export const ML_API_URL =
  process.env.NEXT_PUBLIC_ML_API_URL ?? '/api/ml'

export type RiskLevelRaw = 'Low' | 'Moderate' | 'High' | 'Very High'

export interface PredictFeatures {
  latitude?: number
  longitude?: number
  month: number
  year: number
  temp_2m?: number
  state: string
  elevation_m?: number
  slope_deg?: number
}

export interface TerrainData {
  elevation_m: number
  slope_deg: number
  elevation_zone: string
  slope_category: string
}

export interface PredictResult {
  district: string
  landslide_probability: number
  risk_level: string
  prediction: number
  factors: Record<string, string>
  explanation: string
  terrain?: TerrainData
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
  events: number
  temp_2m: number
  rainfall_mm: number
  elevation_m: number
  slope_deg: number
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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(`${ML_API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    clearTimeout(timeout)
    if (!res.ok) {
      console.warn(`[ML API] ${path} returned ${res.status}`)
      return null
    }
    return (await res.json()) as T
  } catch (e) {
    console.warn(`[ML API] ${path} failed:`, e instanceof Error ? e.message : e)
    return null
  }
}

export async function fetchModelMetrics(): Promise<ModelMetrics | null> {
  const data = await getJson<{ status: string; metrics: ModelMetrics }>('/health')
  return data?.metrics ?? null
}

export interface DistrictInfo {
  name: string
  state: string
  lat: number
  lon: number
}

export async function fetchDistricts(): Promise<DistrictInfo[] | null> {
  const data = await getJson<{ districts: DistrictInfo[] }>('/districts')
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

export interface SmsResult {
  state: string
  risk_level: string
  sms_result: {
    success: boolean
    sid?: string
    status?: string
    error?: string
  }
}

export async function sendAlertSms(
  phoneNumber: string,
): Promise<{ message: string; results: SmsResult[] } | null> {
  return getJson<{ message: string; results: SmsResult[] }>('/send-sms', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phoneNumber }),
  })
}

export async function fetchSmsStatus(): Promise<{
  configured: boolean
  phone_number: string
  account_sid: string
} | null> {
  return getJson<{ configured: boolean; phone_number: string; account_sid: string }>('/sms-status')
}

export async function fetchRiskSummary(): Promise<{
  low: number
  moderate: number
  high: number
  'very-high': number
} | null> {
  const data = await getJson<{ summary: Record<string, number> }>('/risk-summary')
  if (!data?.summary) return null
  const s = data.summary
  return {
    low: s.low ?? 0,
    moderate: s.moderate ?? 0,
    high: s.high ?? 0,
    'very-high': s['very-high'] ?? 0,
  }
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
      rainfall_mm: number
      is_monsoon: boolean
      latitude: number
      longitude: number
      elevation_m: number
      slope_deg: number
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

export interface RiskTrendPoint {
  label: string
  value: number
}

export async function fetchRiskTrend(stateName: string = 'Meghalaya'): Promise<RiskTrendPoint[]> {
  const history = await fetchHistory(stateName)
  if (!history || !history.events || history.events.length === 0) return []

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const points: RiskTrendPoint[] = history.events.map((e) => {
    const riskEstimate = e.is_monsoon
      ? Math.min(95, 40 + (e.rainfall_mm || 0) * 0.3 + (e.temp_2m || 0) * 0.5)
      : Math.max(10, 25 + (e.rainfall_mm || 0) * 0.15)

    return {
      label: `${monthNames[e.month - 1]} ${String(e.year).slice(2)}`,
      value: Math.round(riskEstimate),
    }
  })

  return points
}

export interface RainfallDataPoint {
  label: string
  value: number
}

export async function fetchRainfallSeries(stateName: string = 'Meghalaya'): Promise<RainfallDataPoint[]> {
  const history = await fetchHistory(stateName)
  if (!history || !history.events || history.events.length === 0) return []

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const byMonth: Record<number, number[]> = {}
  history.events.forEach((e) => {
    if (!byMonth[e.month]) byMonth[e.month] = []
    byMonth[e.month].push(e.rainfall_mm || 0)
  })

  const points: RainfallDataPoint[] = []
  for (let m = 1; m <= 12; m++) {
    const vals = byMonth[m]
    if (vals && vals.length > 0) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      points.push({ label: monthNames[m - 1], value: Math.round(avg) })
    }
  }

  return points
}

export interface RiskRainfallDataPoint {
  label: string
  rainfall: number
  risk: number
}

export async function fetchRiskRainfallCorrelation(
  stateName: string = 'Meghalaya',
): Promise<RiskRainfallDataPoint[]> {
  const history = await fetchHistory(stateName)
  if (!history || !history.events || history.events.length === 0) return []

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return history.events.map((e) => {
    const riskEstimate = e.is_monsoon
      ? Math.min(95, 40 + (e.rainfall_mm || 0) * 0.3 + (e.temp_2m || 0) * 0.5)
      : Math.max(10, 25 + (e.rainfall_mm || 0) * 0.15)

    return {
      label: `${monthNames[e.month - 1]} ${String(e.year).slice(2)}`,
      rainfall: Math.round(e.rainfall_mm || 0),
      risk: Math.round(riskEstimate),
    }
  })
}
