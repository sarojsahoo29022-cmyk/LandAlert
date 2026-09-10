'use client'

import { useEffect, useState } from 'react'
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { riskRainfallSeries as fallback } from '@/lib/mock-data'
import { fetchRiskRainfallCorrelation, type RiskRainfallDataPoint } from '@/lib/ml-api'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '12px',
      }}>
        <p style={{ margin: 0, fontWeight: 600 }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: 0, color: entry.color }}>
            {entry.name}: {entry.value}{entry.name === 'Rainfall' ? ' mm' : ''}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function RiskRainfallChart({ height = 180, stateName }: { height?: number; stateName?: string }) {
  const [data, setData] = useState<RiskRainfallDataPoint[]>(fallback)
  const [source, setSource] = useState<'live' | 'fallback'>('fallback')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const live = await fetchRiskRainfallCorrelation(stateName || 'Meghalaya')
      if (!cancelled && live.length > 0) {
        setData(live)
        setSource('live')
      }
    }
    load()
    return () => { cancelled = true }
  }, [stateName])

  return (
    <div className="risk-rainfall" style={{ width: '100%' }}>
      {source === 'live' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <span className="demo-tag" style={{ color: '#27966a', borderColor: '#27966a' }}>LIVE DATA</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 11 }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            yAxisId="left"
            dataKey="rainfall"
            name="Rainfall"
            fill="#3b82f6"
            fillOpacity={0.6}
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="risk"
            name="Risk"
            stroke="#c94145"
            strokeWidth={2}
            dot={{ r: 4, fill: '#c94145', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
