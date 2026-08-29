'use client'

import { useEffect, useState } from 'react'
import { Activity, AlertTriangle } from 'lucide-react'
import { ChartCard } from './chart-card'
import { StatusBadge } from './status-badge'
import {
  fetchDistricts,
  predictRisk,
  toRiskTone,
  type PredictFeatures,
} from '@/lib/ml-api'

const STATES = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Tripura',
  'Sikkim',
  'West Bengal',
]

const FIELDS: { key: keyof PredictFeatures; label: string; step: string }[] = [
  { key: 'month', label: 'Month (1-12)', step: '1' },
  { key: 'year', label: 'Year', step: '1' },
]

const DEFAULTS: PredictFeatures = {
  month: 7,
  year: 2024,
  state: 'Meghalaya',
}

export function RiskPredictor() {
  const [form, setForm] = useState<PredictFeatures>(DEFAULTS)
  const [districts, setDistricts] = useState<string[]>([])
  const [result, setResult] = useState<null | { probability: number; level: string }>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    fetchDistricts().then((d) => {
      if (d && d.length > 0) {
        setDistricts(d)
        setForm((f) => (STATES.includes(f.state) ? f : { ...f, state: d[0] }))
      } else {
        setOffline(true)
      }
    })
  }, [])

  function update(key: keyof PredictFeatures, value: string) {
    setForm((f) => ({ ...f, [key]: key === 'state' ? value : Number(value) }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    const res = await predictRisk(form)
    setLoading(false)
    if (!res) {
      setError('Model service unavailable. Start the FastAPI server (ml/api.py).')
      return
    }
    setResult({ probability: res.landslide_probability, level: res.risk_level })
  }

  return (
    <ChartCard
      kicker="LIVE MODEL"
      title="Landslide risk predictor (North-East India)"
      legend={
        offline ? (
          <span className="demo-tag">SERVICE OFFLINE</span>
        ) : (
          <span className="demo-tag">FastAPI /predict</span>
        )
      }
    >
      <form className="predict-form" onSubmit={onSubmit}>
        <label className="predict-field full">
          <span>State</span>
          <select value={form.state} onChange={(e) => update('state', e.target.value)}>
            {(districts.length > 0 ? districts : STATES).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        {FIELDS.map((f) => (
          <label key={f.key} className="predict-field">
            <span>{f.label}</span>
            <input
              type="number"
              step={f.step}
              value={form[f.key] as number}
              onChange={(e) => update(f.key, e.target.value)}
            />
          </label>
        ))}

        <button className="secondary-button" type="submit" disabled={loading}>
          <Activity size={16} />
          {loading ? 'Predicting...' : 'Predict risk'}
        </button>
      </form>

      {error && (
        <p className="explanation" style={{ color: 'var(--high)' }}>
          <AlertTriangle size={14} style={{ verticalAlign: '-2px' }} /> {error}
        </p>
      )}

      {result && (
        <div className="model-stats">
          <div>
            <span>Probability</span>
            <strong>{(result.probability * 100).toFixed(1)}%</strong>
            <small>landslide likelihood</small>
          </div>
          <div>
            <span>Risk level</span>
            <strong>
              <StatusBadge tone={toRiskTone(result.level as 'Low' | 'Moderate' | 'High')}>
                {result.level}
              </StatusBadge>
            </strong>
            <small>model output</small>
          </div>
        </div>
      )}
      <p className="explanation" style={{ marginTop: 14 }}>
        Model is trained on real North-East India landslide events (NASA GLC). It estimates
        location/season susceptibility; add rainfall data to make it trigger-based.
      </p>
    </ChartCard>
  )
}
