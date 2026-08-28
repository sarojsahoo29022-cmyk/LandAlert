'use client'

import { Download, ChevronDown, CloudRain } from 'lucide-react'
import {
  historicalEvents,
  modelMetrics,
  rainfallSeries,
} from '@/lib/mock-data'
import { ChartCard } from '../chart-card'
import { RiskTrendChart } from '../risk-trend-chart'
import { RiskRainfallChart } from '../risk-rainfall-chart'
import { DataTable } from '../data-table'
import { StatusBadge } from '../status-badge'
import { HazardCascadeTimeline } from '../hazard-cascade-timeline'

export function AnalyticsScreen() {
  return (
    <div className="screen-content">
      <div className="screen-header">
        <div>
          <span className="eyebrow">ANALYTICS</span>
          <h1>Risk intelligence</h1>
          <p>Explore historical patterns and model-ready indicators across the region.</p>
        </div>
        <button className="secondary-button" type="button">
          <Download size={16} />
          Export report
        </button>
      </div>

      <div className="analytics-grid">
        <ChartCard
          kicker="SHILLONG · RISK TREND"
          title="Risk over time"
          className="trend-panel"
          legend={
            <div className="chart-legend">
              <span>
                <i className="line-dot current" />
                Current
              </span>
              <span>
                <i className="line-dot forecast" />
                Demo trend
              </span>
            </div>
          }
        >
          <RiskTrendChart />
        </ChartCard>

        <ChartCard
          kicker="REGIONAL PRECIPITATION"
          title="Rainfall analysis"
          legend={
            <span className="select-chip">
              Last 72 hours <ChevronDown size={14} />
            </span>
          }
        >
          <div className="bar-chart">
            {rainfallSeries.map((p, i) => (
              <div key={i} className="bar-col">
                <span style={{ height: `${p.value}%` }} />
                <small>{i % 3 === 0 ? `${String(i + 1).padStart(2, '0')}:00` : ''}</small>
              </div>
            ))}
          </div>
          <div className="chart-callout">
            <CloudRain size={15} />
            <span>
              <b>156 mm</b> accumulated rainfall
            </span>
            <StatusBadge tone="high">Above average</StatusBadge>
          </div>
        </ChartCard>

        <ChartCard
          kicker="CORRELATION"
          title="Risk vs rainfall"
          legend={<span className="demo-tag">DEMO DATA</span>}
        >
          <RiskRainfallChart />
          <div className="chart-legend rr-legend">
            <span>
              <i className="line-dot rain" />
              Rainfall (mm)
            </span>
            <span>
              <i className="line-dot risk" />
              Risk score
            </span>
          </div>
          <p className="explanation">
            Demonstration of the relationship between accumulated rainfall and modelled risk. Not a
            validated scientific result.
          </p>
        </ChartCard>

        <ChartCard
          kicker="EVENT RECORD"
          title="Historical events"
          legend={
            <button className="text-button" type="button">
              View archive <ChevronDown size={14} />
            </button>
          }
        >
          <DataTable
            columns={['Date', 'Location', 'Rainfall', 'Risk', 'Status']}
            rows={historicalEvents.map((e) => [e.date, e.location, e.rainfall, e.risk, e.status])}
            renderCell={(col, value) =>
              col === 'Risk' ? (
                <StatusBadge tone={value.toLowerCase().replace(' ', '-') as never}>{value}</StatusBadge>
              ) : (
                value
              )
            }
          />
        </ChartCard>

        <ChartCard
          kicker="MODEL PERFORMANCE"
          title="Evaluation (reserved)"
          className="model-panel"
          legend={<span className="demo-tag">PLACEHOLDER</span>}
        >
          <p className="explanation">
            Reserved for future machine-learning evaluation. Values below are placeholders and must not
            be interpreted as scientific accuracy.
          </p>
          <div className="model-stats">
            {modelMetrics.map((m) => (
              <div key={m.label}>
                <span>{m.label}</span>
                <strong>{m.value}</strong>
                <small>{m.note}</small>
              </div>
            ))}
          </div>
        </ChartCard>

        <HazardCascadeTimeline />
      </div>
    </div>
  )
}
