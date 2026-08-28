'use client'

import { MoveUpRight } from 'lucide-react'
import type { Hotspot } from '@/lib/types'
import { regionalOverview } from '@/lib/mock-data'
import { RiskHotspotList } from './risk-hotspot-list'

export function RegionalOverview({ hotspots }: { hotspots: Hotspot[] }) {
  return (
    <section className="overview-grid">
      <div className="overview-card">
        <div className="section-kicker">
          REGIONAL SITUATION OVERVIEW <span className="demo-tag">DEMO DATA</span>
        </div>
        <div className="overview-stats">
          <div>
            <strong>{regionalOverview.monitoredLocations}</strong>
            <span>Monitored locations</span>
          </div>
          <div>
            <strong>{regionalOverview.elevatedZones}</strong>
            <span>Elevated-risk zones</span>
          </div>
          <div>
            <strong className="danger-number">{regionalOverview.activeWarnings}</strong>
            <span>Active warnings</span>
          </div>
        </div>
        <div className="overview-footer">
          <span>
            <span className="pulse-dot" />
            Live monitoring active
          </span>
          <span>Data updated {regionalOverview.updatedAgo}</span>
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
