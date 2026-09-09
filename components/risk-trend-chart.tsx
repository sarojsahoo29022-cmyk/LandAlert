'use client'

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
import { riskTrend } from '@/lib/mock-data'

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

export function RiskTrendChart({ height = 160 }: { height?: number }) {
  const forecastIndex = 3

  return (
    <div className="chart" style={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={riskTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
            x={riskTrend[forecastIndex]?.label}
            stroke="var(--muted-foreground)"
            strokeDasharray="3 3"
            label={{ value: 'Today', position: 'insideTopRight', fontSize: 10, fill: 'var(--muted-foreground)' }}
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
