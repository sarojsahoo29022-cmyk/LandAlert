'use client'

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
import { riskRainfallSeries } from '@/lib/mock-data'

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

export function RiskRainfallChart({ height = 180 }: { height?: number }) {
  return (
    <div className="risk-rainfall" style={{ width: '100%' }}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={riskRainfallSeries} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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
