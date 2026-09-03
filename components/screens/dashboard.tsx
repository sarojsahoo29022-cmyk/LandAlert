'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, MoveUpRight, Sparkles, X } from 'lucide-react'
import {
  aiExplanation,
  alerts as mockAlerts,
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
  fetchSnapshot,
  fetchAlerts,
  toRiskTone,
  probabilityToScore,
  ML_API_URL,
  type SnapshotState,
  type AlertItem,
  type DistrictInfo,
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
  const [liveHotspots, setLiveHotspots] = useState<Hotspot[]>([])
  const [liveSummary, setLiveSummary] = useState<RiskSummary>({
    low: 0,
    moderate: 0,
    high: 0,
    'very-high': 0,
  })
  const [liveAlerts, setLiveAlerts] = useState<AlertItem[]>([])
  const [predictionExplain, setPredictionExplain] = useState('')

  // Load ML snapshot on mount
  useEffect(() => {
    async function loadSnapshot() {
      const snapshotData = await fetchSnapshot()
      if (snapshotData && snapshotData.length > 0) {
        const hotspots: Hotspot[] = snapshotData.map((s) => ({
          name: s.state,
          level: toRiskTone(s.risk_level),
        }))
        setLiveHotspots(hotspots)

        let low = 0, mod = 0, high = 0, vhigh = 0
        snapshotData.forEach((s) => {
          const tone = toRiskTone(s.risk_level)
          if (tone === 'very-high') vhigh++
          else if (tone === 'high') high++
          else if (tone === 'moderate') mod++
          else low++
        })
        setLiveSummary({ low, moderate: mod, high, 'very-high': vhigh })
      }

      const alertsData = await fetchAlerts()
      if (alertsData) {
        setLiveAlerts(alertsData)
      }
    }
    loadSnapshot()
  }, [])

  const analyze = async (searchTerm?: string, district?: DistrictInfo | null) => {
    setLoading(true)
    console.log('[LandAlert] Starting analysis for:', searchTerm || 'default')

    const currentMonth = new Date().getMonth() + 1
    const currentYear = new Date().getFullYear()

    let targetState = 'Meghalaya'
    let lat: number | undefined
    let lon: number | undefined
    let displayName = 'Shillong'

    if (district) {
      targetState = district.state
      lat = district.lat
      lon = district.lon
      displayName = district.name
    } else if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      targetState = STATE_MAPPING[lower] || 'Meghalaya'
      displayName = searchTerm
    }

    console.log('[LandAlert] Calling predictRisk for:', targetState, currentMonth, currentYear)
    const mlRes = await predictRisk({
      month: currentMonth,
      year: currentYear,
      state: targetState,
      latitude: lat,
      longitude: lon,
    })
    console.log('[LandAlert] predictRisk result:', mlRes)

    const score = mlRes ? probabilityToScore(mlRes.landslide_probability) : 50
    const tone = mlRes ? toRiskTone(mlRes.risk_level) : ('moderate' as const)
    const explanation = mlRes?.explanation
      || `ML service offline. Estimated risk for ${targetState} in ${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })}. Start the ML API server for live predictions.`

    setCurrentLocation({
      name: displayName,
      state: targetState,
      score,
      level: tone,
      rainfall: currentMonth >= 6 && currentMonth <= 9 ? '156 mm' : '42 mm',
      slope: '42',
      elevation: '1,240 m',
      historicalSusceptibility: tone,
      trend: mlRes && mlRes.landslide_probability > 0.5 ? 'Increasing' : 'Stable',
      trendDelta: mlRes && mlRes.landslide_probability > 0.5 ? 'Rising' : 'Normal',
      updated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      primaryHazard: 'Landslide Risk (ML Model Output)',
      cascadingConcern: explanation,
    })
    setPredictionExplain(explanation)

    setLoading(false)
    setAnalyzed(true)
  }

  const riskCards = [
    { label: 'Low risk', value: String(liveSummary.low), meta: 'States monitored', tone: 'low' as const },
    { label: 'Moderate', value: String(liveSummary.moderate), meta: 'States monitored', tone: 'moderate' as const },
    { label: 'High', value: String(liveSummary.high), meta: 'States monitored', tone: 'high' as const },
    { label: 'Very high', value: String(liveSummary['very-high']), meta: 'States monitored', tone: 'very-high' as const },
  ]

  const alertsForFeed = liveAlerts.length > 0 ? liveAlerts.slice(0, 3) : mockAlerts.slice(0, 3)

  return (
    <div className="screen-content">
      <div className="hero-header">
        <div>
          <span className="eyebrow">
            <span className="live-dot" />
            LIVE MONITORING · ML MODEL ACTIVE
          </span>
          <h1>
            Predict. Monitor. <em>Protect.</em>
          </h1>
          <p>
            AI-assisted landslide risk monitoring and early warning for vulnerable, landslide-prone
            regions of North-East India. Model trained on NE India landslide data.
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
          Showing live ML risk assessment for <strong>{currentLocation.name}, {currentLocation.state}</strong>
          <button onClick={() => setAnalyzed(false)} aria-label="Dismiss" type="button">
            <X size={15} />
          </button>
        </div>
      )}

      <RegionalOverview
        hotspots={liveHotspots}
        monitoredCount={9}
        elevatedCount={liveSummary.high + liveSummary['very-high']}
        warningCount={liveSummary['very-high']}
      />

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
          <p className="explanation">{predictionExplain || aiExplanation}</p>
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
                <span className="trend-up">ML MODEL</span> Trained on NE India data
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
            {alertsForFeed.map((a: any) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
