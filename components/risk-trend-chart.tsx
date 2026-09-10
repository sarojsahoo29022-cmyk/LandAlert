'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { riskTrend as fallback } from '@/lib/mock-data'
import { fetchRiskTrend, type RiskTrendPoint } from '@/lib/ml-api'

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
        <p style={{ margin: 0, color: 'var(--high)' }}>Risk: {payload[0].value}</p>
      </div>
    )
  }
  return null
}

export function RiskTrendChart({ height = 160, stateName }: { height?: number; stateName?: string }) {
  const [data, setData] = useState<RiskTrendPoint[]>(fallback)
  const [source, setSource] = useState<'live' | 'fallback'>('fallback')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const live = await fetchRiskTrend(stateName || 'Meghalaya')
      if (!cancelled && live.length > 0) {
        setData(live)
        setSource('live')
      }
    }
    load()
    return () => { cancelled = true }
  }, [stateName])

  const forecastIndex = Math.max(0, Math.floor(data.length / 2))

  return (
    <div className="chart" style={{ width: '100%' }}>
      {source === 'live' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <span className="demo-tag" style={{ color: '#27966a', borderColor: '#27966a' }}>LIVE DATA</span>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#df762d" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#df762d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            x={data[forecastIndex]?.label}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            label={{ value: 'Now', position: 'insideTopRight', fontSize: 10, fill: 'var(--muted-foreground)' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#df762d"
            strokeWidth={2}
            fill="url(#riskGradient)"
            dot={{ r: 4, fill: '#df762d', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
