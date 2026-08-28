'use client'

import { CloudRain, Mountain, Waves, AlertTriangle, Activity, Zap } from 'lucide-react'

const stages = [
  { icon: CloudRain, label: 'Environmental trigger', sub: 'Extreme rainfall' },
  { icon: Mountain, label: 'Terrain instability', sub: 'Slope failure' },
  { icon: AlertTriangle, label: 'Landslide / debris', sub: 'Mass movement' },
  { icon: Waves, label: 'River / downstream', sub: 'Flow obstruction' },
]

export function HazardCascadeTimeline() {
  return (
    <section className="panel cascade-timeline-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">CONCEPTUAL MODEL</span>
          <h2>Hazard cascade timeline</h2>
        </div>
        <span className="concept-tag">
          <Zap size={13} /> Conceptual / Future integration
        </span>
      </div>
      <div className="timeline">
        {stages.map((s, i) => (
          <div className="timeline-step" key={s.label}>
            <span className="timeline-index">{i + 1}</span>
            <s.icon size={18} />
            <strong>{s.label}</strong>
            <small>{s.sub}</small>
            {i < stages.length - 1 && <span className="timeline-link">→</span>}
          </div>
        ))}
        <div className="timeline-step">
          <span className="timeline-index">5</span>
          <Activity size={18} />
          <strong>Early warning</strong>
          <small>Authority alert</small>
        </div>
      </div>
      <p className="chain-note">
        Demonstrates how LandAlert is designed to evolve from single-hazard landslide monitoring into
        broader mountain-disaster intelligence. Not an actual prediction.
      </p>
    </section>
  )
}
