'use client'

import { useEffect, useState, useCallback } from 'react'
import { Download, ChevronDown, CloudRain } from 'lucide-react'
import {
  rainfallSeries,
} from '@/lib/mock-data'
import { ChartCard } from '../chart-card'
import { RiskTrendChart } from '../risk-trend-chart'
import { RiskRainfallChart } from '../risk-rainfall-chart'
import { DataTable } from '../data-table'
import { StatusBadge } from '../status-badge'
import { HazardCascadeTimeline } from '../hazard-cascade-timeline'
import { RiskPredictor } from '../risk-predictor'
import { fetchModelMetrics, fetchHistory, type ModelMetrics } from '@/lib/ml-api'
import type { HistoricalEvent } from '@/lib/types'

const STATES = [
  'Meghalaya', 'Mizoram', 'Manipur', 'Sikkim', 'Arunachal Pradesh',
  'Assam', 'Nagaland', 'Tripura', 'West Bengal',
]

export function AnalyticsScreen() {
  const [liveMetrics, setLiveMetrics] = useState<ModelMetrics | null>(null)
  const [selectedState, setSelectedState] = useState('Meghalaya')
  const [historicalEvents, setHistoricalEvents] = useState<HistoricalEvent[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    fetchModelMetrics().then(setLiveMetrics)
  }, [])

  const loadHistory = useCallback(async (state: string) => {
    setLoadingHistory(true)
    const data = await fetchHistory(state)
    if (data && data.events) {
      const events: HistoricalEvent[] = data.events.slice(0, 10).map((e) => ({
        date: `${e.year}-${String(e.month).padStart(2, '0')}`,
        location: state,
        rainfall: e.rainfall_mm ? `${Math.round(e.rainfall_mm)} mm` : (e.is_monsoon ? 'Monsoon' : 'Non-monsoon'),
        risk: e.is_monsoon ? 'moderate' : 'low',
        status: 'Recorded',
      }))
      setHistoricalEvents(events)
    } else {
      setHistoricalEvents([])
    }
    setLoadingHistory(false)
  }, [])

  useEffect(() => {
    loadHistory(selectedState)
  }, [selectedState, loadHistory])

  const metricTiles = liveMetrics
    ? [
        { label: 'Accuracy', value: liveMetrics.accuracy.toFixed(3), note: 'test set' },
        { label: 'Precision', value: liveMetrics.precision.toFixed(3), note: 'test set' },
        { label: 'Recall', value: liveMetrics.recall.toFixed(3), note: 'test set' },
        { label: 'F1 Score', value: liveMetrics.f1.toFixed(3), note: 'test set' },
        { label: 'ROC-AUC', value: liveMetrics.roc_auc.toFixed(3), note: 'test set' },
      ]
    : [
        { label: 'Accuracy', value: '--', note: 'Waiting for model' },
        { label: 'Precision', value: '--', note: 'Waiting for model' },
        { label: 'Recall', value: '--', note: 'Waiting for model' },
        { label: 'F1 Score', value: '--', note: 'Waiting for model' },
      ]

  const handleExport = () => {
    const exportData = {
      modelMetrics: liveMetrics,
      historicalEvents,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `landalert-analytics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="screen-content">
      <div className="screen-header">
        <div>
          <span className="eyebrow">ANALYTICS</span>
          <h1>Risk intelligence</h1>
          <p>Explore historical patterns and model-ready indicators across the region.</p>
        </div>
        <button className="secondary-button" type="button" onClick={handleExport}>
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
                ML Trend
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
            <select
              className="select-chip"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 8px', color: 'var(--foreground)', fontSize: '12px' }}
            >
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          }
        >
          {loadingHistory ? (
            <div className="empty-state">
              <p>Loading historical data...</p>
            </div>
          ) : historicalEvents.length > 0 ? (
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
          ) : (
            <div className="empty-state">
              <p>No historical events found for {selectedState}.</p>
            </div>
          )}
        </ChartCard>

        <ChartCard
          kicker="MODEL PERFORMANCE"
          title="Landslide model evaluation"
          className="model-panel"
          legend={
            liveMetrics ? (
              <span className="demo-tag" style={{ color: '#27966a', borderColor: '#27966a' }}>
                LIVE
              </span>
            ) : (
              <span className="demo-tag">LOADING</span>
            )
          }
        >
          <p className="explanation">
            {liveMetrics
              ? 'Live metrics from the trained Random Forest classifier (test set). Trained on NE India landslide data with temperature, monsoon, and seasonal features.'
              : 'Connecting to ML service at port 8000...'}
          </p>
          <div className="model-stats">
            {metricTiles.map((m) => (
              <div key={m.label}>
                <span>{m.label}</span>
                <strong>{m.value}</strong>
                <small>{m.note}</small>
              </div>
            ))}
          </div>
        </ChartCard>

        <RiskPredictor />

        <HazardCascadeTimeline />
      </div>
    </div>
  )
}
