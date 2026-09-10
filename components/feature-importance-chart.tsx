'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { fetchFeatureImportance, type FeatureImportance } from '@/lib/ml-api'

const FEATURE_LABELS: Record<string, string> = {
  rainfall_mm: 'Rainfall',
  temp_2m: 'Temperature',
  longitude: 'Longitude',
  month: 'Month',
  latitude: 'Latitude',
  slope_deg: 'Slope',
  elevation_m: 'Elevation',
}

const FEATURE_COLORS: Record<string, string> = {
  rainfall_mm: '#3b82f6',
  temp_2m: '#f97316',
  longitude: '#8b5cf6',
  month: '#06b6d4',
  latitude: '#64748b',
  slope_deg: '#ef4444',
  elevation_m: '#22c55e',
}

export function FeatureImportanceChart() {
  const [features, setFeatures] = useState<FeatureImportance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await fetchFeatureImportance()
      if (data && data.features) {
        setFeatures(data.features)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="chart-loading">Loading feature importance...</div>
  }

  if (features.length === 0) {
    return <div className="chart-loading">No importance data available</div>
  }

  const chartData = features.map((f) => ({
    name: FEATURE_LABELS[f.feature] || f.feature,
    importance: f.importance,
    absImportance: f.abs_importance,
    weightPct: f.weight_pct,
    direction: f.direction,
  }))

  return (
    <div className="feature-importance-chart">
      <div className="chart-header">
        <span className="section-kicker">MODEL FEATURE IMPORTANCE</span>
        <h3>What drives the prediction?</h3>
        <p className="chart-subtitle">
          Permutation importance — how much each feature affects model accuracy
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            type="number"
            domain={['dataMin - 0.01', 'dataMax + 0.01']}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(v: number) => `${(v * 100).toFixed(1)}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }}
            width={80}
          />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 8,
              color: '#e2e8f0',
            }}
            formatter={(value: any, name: any) => [
              `${(Number(value) * 100).toFixed(2)}%`,
              'Importance',
            ]}
            labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
          />
          <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={FEATURE_COLORS[features[index]?.feature] || '#64748b'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="importance-legend">
        {features.slice(0, 4).map((f) => (
          <div key={f.feature} className="legend-item">
            <span
              className="legend-dot"
              style={{ background: FEATURE_COLORS[f.feature] || '#64748b' }}
            />
            <span className="legend-label">
              {FEATURE_LABELS[f.feature] || f.feature}
            </span>
            <span className="legend-value">
              {f.direction === 'positive' ? '+' : ''}{(f.importance * 100).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
