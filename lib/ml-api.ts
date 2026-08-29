// Client-side bridge to the GeoShield FastAPI ML service (ml/api.py).
// All calls fail soft: if the service is not running, callers fall back to mock UI data.

export const ML_API_URL =
  process.env.NEXT_PUBLIC_ML_API_URL ?? 'http://127.0.0.1:8000'

export type RiskLevelRaw = 'Low' | 'Moderate' | 'High'

export interface PredictFeatures {
  latitude?: number
  longitude?: number
  month: number
  year: number
  state: string
}

export interface PredictResult {
  district: string
  landslide_probability: number
  risk_level: RiskLevelRaw
  prediction: number
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
  const data = await getJson<{ metrics: ModelMetrics }>('/health')
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

// Map API risk level ("High") to UI tone ("high") for StatusBadge.
export function toRiskTone(level: RiskLevelRaw): 'low' | 'moderate' | 'high' {
  if (level === 'High') return 'high'
  if (level === 'Moderate') return 'moderate'
  return 'low'
}
