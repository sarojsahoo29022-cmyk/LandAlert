'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, Filter as FilterIcon } from 'lucide-react'
import { alerts as mockAlerts } from '@/lib/mock-data'
import { StatCard } from '../stat-card'
import { AlertCard } from '../alert-card'
import { StatusBadge } from '../status-badge'
import { FilterControls } from '../filter-controls'
import { fetchAlerts, fetchSnapshot, toRiskTone, type AlertItem, type SnapshotState } from '@/lib/ml-api'
import type { Alert, AlertStatus } from '@/lib/types'

const statusOptions = ['All', 'Active', 'Monitoring', 'Resolved']
const severityOptions = ['All', 'Very high', 'High', 'Moderate', 'Low']

export function AlertsScreen() {
  const [status, setStatus] = useState('All')
  const [severity, setSeverity] = useState('All')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [liveAlerts, setLiveAlerts] = useState<AlertItem[]>([])
  const [snapshotData, setSnapshotData] = useState<SnapshotState[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [alertsData, snapshotRes] = await Promise.all([fetchAlerts(), fetchSnapshot()])
      if (alertsData) setLiveAlerts(alertsData)
      if (snapshotRes) setSnapshotData(snapshotRes)
      setLoading(false)
    }
    load()
  }, [])

  const allAlerts: Alert[] = liveAlerts.length > 0
    ? liveAlerts.map((a) => ({
        id: a.id,
        level: a.level as any,
        label: a.label,
        type: a.type,
        location: a.location,
        time: a.time,
        text: a.text,
        status: a.status as any,
      }))
    : mockAlerts

  const filtered = allAlerts.filter((a) => {
    const statusOk = status === 'All' || a.status === (status.toLowerCase() as AlertStatus)
    const severityOk = severity === 'All' || a.level === severity.toLowerCase().replace(' ', '-')
    return statusOk && severityOk
  })

  const selected: Alert | undefined = allAlerts.find((a) => a.id === selectedId)

  const activeCount = allAlerts.filter((a) => a.status === 'active').length
  const monitoringCount = allAlerts.filter((a) => a.status === 'monitoring').length
  const highRiskStates = snapshotData.filter((s) => toRiskTone(s.risk_level) === 'high' || toRiskTone(s.risk_level) === 'very-high').length

  return (
    <div className="screen-content">
      <div className="screen-header">
        <div>
          <span className="eyebrow">ALERT MANAGEMENT</span>
          <h1>Alerts &amp; warnings</h1>
          <p>Review ML-generated alerts and monitor changing conditions.</p>
        </div>
        <button className="secondary-button" type="button">
          <FilterIcon size={16} />
          Filter alerts
        </button>
      </div>

      <div className="alert-summary">
        <StatCard label="Active alerts" value={String(activeCount)} hint="+1 today" tone="high" />
        <StatCard label="High-risk locations" value={String(highRiskStates)} hint="Across region" />
        <StatCard label="Alerts today" value={String(allAlerts.length)} hint={`${monitoringCount} monitoring`} />
        <StatCard label="States monitored" value={String(snapshotData.length)} hint="NER coverage" />
      </div>

      <FilterControls
        groups={[
          { label: 'STATUS', options: statusOptions, selected: status, onSelect: setStatus },
          { label: 'SEVERITY', options: severityOptions, selected: severity, onSelect: setSeverity },
        ]}
      />

      <section className="panel all-alerts-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">ALERT REGISTER</span>
            <h2>
              {status === 'All' ? 'All alerts' : status}
            </h2>
          </div>
          <span className="muted-label">{filtered.length} records</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <Bell size={22} />
            <p>No alerts match the current filters.</p>
            <button
              className="text-button"
              onClick={() => {
                setStatus('All')
                setSeverity('All')
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="alert-list">
            {filtered.map((a) => (
              <AlertCard key={a.id} alert={a} expanded onSelect={setSelectedId} />
            ))}
          </div>
        )}
      </section>

      {selected && (
        <section className="panel alert-detail">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">ALERT DETAIL</span>
              <h2>{selected.location}</h2>
            </div>
            <button className="text-button" onClick={() => setSelectedId(null)} type="button">
              Close
            </button>
          </div>
          <div className="alert-detail-grid">
            <div>
              <StatusBadge tone={selected.level}>{selected.label}</StatusBadge>
              <StatusBadge tone={selected.status}>{selected.status}</StatusBadge>
            </div>
            <div>
              <span>Hazard type</span>
              <b>{selected.type}</b>
            </div>
            <div>
              <span>Time</span>
              <b>{selected.time}</b>
            </div>
            <div className="alert-detail-full">
              <span>Assessment</span>
              <p>{selected.text}</p>
            </div>
            {selected.cascading && (
              <div className="alert-detail-full cascade-note">
                <AlertTriangle size={14} />
                <span>
                  Conceptual cascading-hazard indicator — not an actual detected disaster.
                </span>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
