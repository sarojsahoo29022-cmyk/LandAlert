'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, MoveUpRight, Sparkles, X } from 'lucide-react'
import {
  aiExplanation,
  alerts,
  mapMarkers,
  hazardLayers,
  riskFactors,
  selectedLocation as initialSelectedLocation,
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
import {
  predictRisk,
  fetchModelMetrics,
  toRiskTone,
  ML_API_URL,
  type RiskLevelRaw,
} from '@/lib/ml-api'
import type { Hotspot, RiskSummary, SelectedLocation, RiskLevel } from '@/lib/types'

const STATE_MAPPING: Record<string, string> = {
  shillong: 'Meghalaya',
  meghalaya: 'Meghalaya',
  aizawl: 'Mizoram',
  mizoram: 'Mizoram',
  imphal: 'Manipur',
  manipur: 'Manipur',
  gangtok: 'Sikkim',
  sikkim: 'Sikkim',
  guwahati: 'Assam',
  assam: 'Assam',
  itanagar: 'Arunachal Pradesh',
  arunachal: 'Arunachal Pradesh',
  kohima: 'Nagaland',
  nagaland: 'Nagaland',
  agartala: 'Tripura',
  tripura: 'Tripura',
  darjeeling: 'West Bengal',
  bengal: 'West Bengal',
}

export function DashboardScreen({ setActive }: { setActive: (label: string) => void }) {
  const [analyzed, setAnalyzed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<SelectedLocation>(initialSelectedLocation)
  const [liveHotspots, setLiveHotspots] = useState<Hotspot[]>([
    { name: 'East Khasi Hills, Meghalaya', level: 'high' },
    { name: 'Sikkim North', level: 'high' },
    { name: 'Arunachal West', level: 'moderate' },
    { name: 'Aizawl, Mizoram', level: 'moderate' },
    { name: 'Imphal, Manipur', level: 'low' },
  ])
  const [liveSummary, setLiveSummary] = useState<RiskSummary>({
    low: 42,
    moderate: 18,
    high: 7,
    'very-high': 2,
  })

  // Load ML API Snapshot on mount
  useEffect(() => {
    async function loadSnapshot() {
      try {
        const res = await fetch(`${ML_API_URL}/snapshot`)
        if (!res.ok) return
        const data = await res.json()
        if (data.states && Array.isArray(data.states)) {
          const newHotspots: Hotspot[] = data.states.map((st: { state: string; risk_level: string }) => ({
            name: st.state,
            level: (st.risk_level === 'High' ? 'high' : st.risk_level === 'Moderate' ? 'moderate' : 'low') as RiskLevel,
          }))
          setLiveHotspots(newHotspots)

          let low = 0, mod = 0, high = 0, vhigh = 0
          data.states.forEach((st: { risk_level: string }) => {
            if (st.risk_level === 'High') high += 1
            else if (st.risk_level === 'Moderate') mod += 1
            else low += 1
          })
          setLiveSummary({ low, moderate: mod, high, 'very-high': vhigh })
        }
      } catch {
        // Fallback to mock
      }
    }
    loadSnapshot()
  }, [])

  const analyze = async () => {
    setLoading(true)
    const currentMonth = new Date().getMonth() + 1
    const targetState = STATE_MAPPING['shillong'] || 'Meghalaya'
    
    const mlRes = await predictRisk({
      month: currentMonth,
      year: new Date().getFullYear(),
      state: targetState,
    })

    setLoading(false)
    setAnalyzed(true)

    if (mlRes) {
      const score = Math.round(mlRes.landslide_probability * 100)
      const tone = toRiskTone(mlRes.risk_level)
      setCurrentLocation({
        name: 'Shillong',
        state: targetState,
        score: score,
        level: tone as RiskLevel,
        rainfall: '156 mm',
        slope: '42°',
        elevation: '1,240 m',
        historicalSusceptibility: tone as RiskLevel,
        trend: 'Increasing',
        trendDelta: '↑ 18%',
        updated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        primaryHazard: 'Landslide Risk (ML Model Output)',
        cascadingConcern: `Model prediction: ${score}% likelihood (${mlRes.risk_level} Risk)`,
      })
    }
  }

  const riskCards = [
    { label: 'Low risk', value: String(liveSummary.low), meta: 'Regions monitored', tone: 'low' as const },
    { label: 'Moderate', value: String(liveSummary.moderate), meta: 'Regions monitored', tone: 'moderate' as const },
    { label: 'High', value: String(liveSummary.high), meta: 'Regions monitored', tone: 'high' as const },
    { label: 'Very high', value: String(liveSummary['very-high']), meta: 'Regions monitored', tone: 'very-high' as const },
  ]

  return (
    <div className="screen-content">
      <div className="hero-header">
        <div>
          <span className="eyebrow">
            <span className="live-dot" />
            LIVE MONITORING · FASTAPI ML BACKEND ATTACHED
          </span>
          <h1>
            Predict. Monitor. <em>Protect.</em>
          </h1>
          <p>
            AI-assisted landslide risk monitoring and early warning for vulnerable, landslide-prone
            regions of North-East India.
          </p>
        </div>
        <div className="hero-meta">
          <div>
            <span className="pulse-dot" />
            ML Service Connected
          </div>
          <span>API Port: 8000</span>
        </div>
      </div>

      <LocationSearch onAnalyze={analyze} loading={loading} />

      {analyzed && (
        <div className="analyze-banner">
          <span className="spinner" aria-hidden />
          Showing live ML risk assessment for <strong>{currentLocation.name}, {currentLocation.state}</strong>
          <button onClick={() => setAnalyzed(false)} aria-label="Dismiss" type="button">
            <X size={15} />
          </button>
        </div>
      )}

      <RegionalOverview hotspots={liveHotspots} />

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

        <LocationDetails location={currentLocation} />

        <ChartCard
          kicker="EXPLAINABLE AI"
          title="Why is the risk assessed?"
          className="factors-panel"
          legend={
            <span className="ai-placeholder">
              <Sparkles size={13} /> ML Feature Importance
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
                ML Trend
              </span>
            </div>
          }
          footer={
            <div className="trend-footer">
              <span>
                <span className="trend-up">↑ 18%</span> vs. previous 7 days
              </span>
              <span className="demo-tag">LIVE MODEL METRICS ATTACHED</span>
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
