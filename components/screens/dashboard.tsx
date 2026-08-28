'use client'

import { useState } from 'react'
import { ChevronRight, MoveUpRight, Sparkles, X } from 'lucide-react'
import {
  aiExplanation,
  alerts,
  hotspots,
  mapMarkers,
  hazardLayers,
  riskFactors,
  riskSummary,
  selectedLocation,
} from '@/lib/mock-data'
import { LocationSearch } from '../location-search'
import { RegionalOverview } from '../regional-overview'
import { RiskCard } from '../risk-card'
import { MapPanel } from '../map-panel'
import { LocationDetails } from '../location-details'
import { RiskFactorBar } from '../risk-factor-bar'
import { RiskTrendChart } from '../risk-trend-chart'
import { HazardChain } from '../hazard-chain'
import { AlertCard } from '../alert-card'
import { ChartCard } from '../chart-card'
import { StatusBadge } from '../status-badge'

const riskCards = [
  { label: 'Low risk', value: String(riskSummary.low), meta: 'Areas monitored', tone: 'low' as const },
  { label: 'Moderate', value: String(riskSummary.moderate), meta: 'Areas monitored', tone: 'moderate' as const },
  { label: 'High', value: String(riskSummary.high), meta: 'Areas monitored', tone: 'high' as const },
  { label: 'Very high', value: String(riskSummary['very-high']), meta: 'Areas monitored', tone: 'very-high' as const },
]

export function DashboardScreen({ setActive }: { setActive: (label: string) => void }) {
  const [analyzed, setAnalyzed] = useState(false)
  const [loading, setLoading] = useState(false)

  const analyze = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setAnalyzed(true)
    }, 700)
  }

  return (
    <div className="screen-content">
      <div className="hero-header">
        <div>
          <span className="eyebrow">
            <span className="live-dot" />
            LIVE MONITORING · DEMO ENVIRONMENT
          </span>
          <h1>
            Predict. Monitor. <em>Protect.</em>
          </h1>
          <p>
            AI-assisted landslide risk monitoring and early warning for vulnerable, landslide-prone
            regions of India.
          </p>
        </div>
        <div className="hero-meta">
          <div>
            <span className="pulse-dot" />
            System operational
          </div>
          <span>Last data update · 10:42 AM</span>
        </div>
      </div>

      <LocationSearch onAnalyze={analyze} loading={loading} />

      {analyzed && (
        <div className="analyze-banner">
          <span className="spinner" aria-hidden />
          Showing risk assessment for <strong>Shillong, Meghalaya</strong>
          <button onClick={() => setAnalyzed(false)} aria-label="Dismiss" type="button">
            <X size={15} />
          </button>
        </div>
      )}

      <RegionalOverview hotspots={hotspots} />

      <div className="risk-cards">
        {riskCards.map((c) => (
          <RiskCard key={c.label} {...c} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="panel map-section">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">REGIONAL RISK MAP</span>
              <h2>Where attention is needed</h2>
            </div>
            <button className="text-button" onClick={() => setActive('Risk Map')} type="button">
              Open full map <MoveUpRight size={15} />
            </button>
          </div>
          <MapPanel markers={mapMarkers} layers={hazardLayers} />
        </section>

        <LocationDetails location={selectedLocation} />

        <ChartCard
          kicker="EXPLAINABLE AI"
          title="Why is the risk high?"
          className="factors-panel"
          legend={
            <span className="ai-placeholder">
              <Sparkles size={13} /> AI explanation placeholder
            </span>
          }
        >
          <div className="factor-list">
            {riskFactors.map((f) => (
              <RiskFactorBar key={f.name} {...f} />
            ))}
          </div>
          <p className="explanation">{aiExplanation}</p>
        </ChartCard>

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
          footer={
            <div className="trend-footer">
              <span>
                <span className="trend-up">↑ 18%</span> vs. previous 7 days
              </span>
              <span className="demo-tag">FORECAST IS DEMO DATA</span>
            </div>
          }
        >
          <RiskTrendChart />
        </ChartCard>

        <HazardChain />

        <section className="panel alerts-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">MONITORING FEED</span>
              <h2>Recent alerts</h2>
            </div>
            <button className="text-button" onClick={() => setActive('Alerts')} type="button">
              View all alerts <ChevronRight size={15} />
            </button>
          </div>
          <div className="alert-list">
            {alerts.slice(0, 3).map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
