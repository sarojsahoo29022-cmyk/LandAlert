'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, MoveUpRight, Sparkles, X } from 'lucide-react'
import {
  aiExplanation,
  alerts as mockAlerts,
  mapMarkers,
  hazardLayers,
  selectedLocation as initialSelectedLocation,
} from '@/lib/mock-data'
import { LocationSearch } from '../location-search'
import { RegionalOverview } from '../regional-overview'
import { RiskCard } from '../risk-card'
import { LeafletMap } from '../leaflet-map'
import { LocationDetails } from '../location-details'
import { RiskFactorBar } from '../risk-factor-bar'
import { FeatureImportanceChart } from '../feature-importance-chart'
import { RiskTrendChart } from '../risk-trend-chart'
import { HazardChain } from '../hazard-chain'
import { AlertCard } from '../alert-card'
import { ChartCard } from '../chart-card'
import {
  predictLive,
  fetchSnapshot,
  fetchAlerts,
  toRiskTone,
  probabilityToScore,
  ML_API_URL,
  type SnapshotState,
  type AlertItem,
  type DistrictInfo,
} from '@/lib/ml-api'
import type { Hotspot, RiskSummary, SelectedLocation, RiskLevel, RiskFactor } from '@/lib/types'

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
  const [dataStatus, setDataStatus] = useState<string>('INITIAL')
  const [liveWeather, setLiveWeather] = useState<{
    temperature_c: number | null
    humidity_pct: number | null
    wind_speed_kmh: number | null
    pressure_hpa: number | null
  } | null>(null)
  const [liveRiskFactors, setLiveRiskFactors] = useState<RiskFactor[]>([
    { name: 'Rainfall', impact: 'MEDIUM IMPACT', width: '50%', tone: 'moderate' },
    { name: 'Temperature', impact: 'MEDIUM IMPACT', width: '50%', tone: 'moderate' },
    { name: 'Elevation', impact: 'LOWER IMPACT', width: '30%', tone: 'low' },
    { name: 'Slope', impact: 'LOWER IMPACT', width: '30%', tone: 'low' },
  ])

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
    setDataStatus('LOADING')
    console.log('[LandAlert] Starting live analysis for:', searchTerm || 'default')

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
      displayName = searchTerm
    }

    console.log('[LandAlert] Calling predictLive for:', displayName, lat, lon)
    const mlRes = await predictLive(displayName, lat, lon)
    console.log('[LandAlert] predictLive result:', mlRes)

    if (!mlRes || !mlRes.success) {
      setDataStatus('FAILED')
      setLoading(false)
      setCurrentLocation({
        name: displayName,
        state: targetState,
        score: 50,
        level: 'moderate',
        rainfall: 'N/A',
        slope: 'N/A',
        elevation: 'N/A',
        historicalSusceptibility: 'moderate',
        trend: 'Unknown',
        trendDelta: 'Unknown',
        updated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        primaryHazard: 'Landslide Risk (ML Model Output)',
        cascadingConcern: mlRes?.error || 'Could not fetch live data. Check API connection.',
      })
      return
    }

    targetState = mlRes.state
    displayName = mlRes.location

    const score = probabilityToScore(mlRes.landslide_probability)
    const tone = toRiskTone(mlRes.risk_level)
    const explanation = mlRes.explanation

    const terrain = mlRes.terrain
    const rainfallVal = mlRes.factors?.rainfall_mm ?? '0 mm'
    const weatherData = mlRes.live_data?.weather || null
    const tempFromWeather = weatherData?.temperature_c
    const tempFromFactors = mlRes.factors?.temperature ? parseFloat(mlRes.factors.temperature) : NaN
    const tempVal = tempFromWeather ?? (isNaN(tempFromFactors) ? null : tempFromFactors)

    setLiveWeather(weatherData)
    setDataStatus(mlRes.data_status?.overall || 'UNKNOWN')

    setCurrentLocation({
      name: displayName,
      state: targetState,
      score,
      level: tone,
      rainfall: rainfallVal,
      slope: terrain ? `${terrain.slope_deg.toFixed(1)}` : 'N/A',
      elevation: terrain ? `${terrain.elevation_m.toFixed(0)} m` : 'N/A',
      temperature: tempVal !== null ? `${tempVal.toFixed(1)}°C` : undefined,
      humidity: weatherData?.humidity_pct !== null ? `${weatherData?.humidity_pct}%` : undefined,
      historicalSusceptibility: tone,
      trend: mlRes.landslide_probability > 0.5 ? 'Increasing' : 'Stable',
      trendDelta: mlRes.landslide_probability > 0.5 ? 'Rising' : 'Normal',
      updated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      primaryHazard: 'Landslide Risk (ML Model Output)',
      cascadingConcern: explanation,
    })
    setPredictionExplain(explanation)

    if (mlRes?.factors) {
      const f = mlRes.factors
      const factors: RiskFactor[] = []
      
      const intensityToFactor = (val: string, name: string, fallbackWidth: string): RiskFactor => {
        const upper = (val || '').toUpperCase()
        if (upper.includes('HEAVY') || upper.includes('ELEVATED') || upper === 'ACTIVE' || upper.includes('STEEP') || upper.includes('VERY STEEP')) {
          return { name, impact: 'HIGH IMPACT', width: '85%', tone: 'high' }
        }
        if (upper.includes('MODERATE') || upper.includes('MOUNTAIN') || upper === 'INACTIVE') {
          return { name, impact: 'MEDIUM IMPACT', width: '55%', tone: 'moderate' }
        }
        return { name, impact: 'LOWER IMPACT', width: fallbackWidth, tone: 'low' }
      }

      factors.push(intensityToFactor(f.rainfall_intensity, 'Rainfall', '40%'))
      factors.push(intensityToFactor(f.temperature_status || f.temperature || '', 'Temperature', '35%'))
      factors.push(intensityToFactor(f.elevation_zone || '', 'Elevation', '30%'))
      factors.push(intensityToFactor(f.slope_category || '', 'Slope', '25%'))

      setLiveRiskFactors(factors)
    }

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
          Showing {dataStatus === 'LIVE' ? '🟢 LIVE' : dataStatus === 'PARTIAL' ? '🟡 PARTIAL' : dataStatus === 'FAILED' ? '🔴 FALLBACK' : '⚪'} ML risk assessment for <strong>{currentLocation.name}, {currentLocation.state}</strong>
          {liveWeather && (
            <span style={{ marginLeft: 8, opacity: 0.8 }}>
              · {liveWeather.temperature_c !== null ? `${liveWeather.temperature_c}°C` : ''} 
              {liveWeather.humidity_pct !== null ? ` · ${liveWeather.humidity_pct}% humidity` : ''}
            </span>
          )}
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
          <LeafletMap markers={mapMarkers} layers={hazardLayers} compact />
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
            {liveRiskFactors.map((f) => (
              <RiskFactorBar key={f.name} {...f} />
            ))}
          </div>
          <p className="explanation">{predictionExplain || aiExplanation}</p>
          <FeatureImportanceChart />
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
