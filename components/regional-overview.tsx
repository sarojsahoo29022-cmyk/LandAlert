'use client'

import { MoveUpRight } from 'lucide-react'
import type { Hotspot } from '@/lib/types'
import { RiskHotspotList } from './risk-hotspot-list'

export function RegionalOverview({
  hotspots,
  monitoredCount = 9,
  elevatedCount = 0,
  warningCount = 0,
}: {
  hotspots: Hotspot[]
  monitoredCount?: number
  elevatedCount?: number
  warningCount?: number
}) {
  return (
    <section className="overview-grid">
      <div className="overview-card">
        <div className="section-kicker">
          REGIONAL SITUATION OVERVIEW <span className="demo-tag" style={{ color: '#27966a', borderColor: '#27966a' }}>LIVE</span>
        </div>
        <div className="overview-stats">
          <div>
            <strong>{monitoredCount}</strong>
            <span>Monitored locations</span>
          </div>
          <div>
            <strong>{elevatedCount}</strong>
            <span>Elevated-risk zones</span>
          </div>
          <div>
            <strong className="danger-number">{warningCount}</strong>
            <span>Active warnings</span>
          </div>
        </div>
        <div className="overview-footer">
          <span>
            <span className="pulse-dot" />
            Live monitoring active
          </span>
          <span>Data updated just now</span>
        </div>
      </div>
      <div className="hotspot-card">
        <div className="section-kicker">
          RISK HOTSPOTS <MoveUpRight size={14} />
        </div>
        <RiskHotspotList hotspots={hotspots} />
      </div>
    </section>
  )
}
