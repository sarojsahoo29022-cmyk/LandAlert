'use client'

import { Activity, AlertTriangle, ChevronRight, CloudRain, Mountain, Waves, Zap } from 'lucide-react'

const steps = [
  { icon: CloudRain, label: 'Heavy rainfall' },
  { icon: Mountain, label: 'Slope instability' },
  { icon: AlertTriangle, label: 'Landslide / debris' },
  { icon: Waves, label: 'Possible river disruption' },
  { icon: Activity, label: 'Downstream flooding' },
]

export function HazardChain() {
  return (
    <section className="panel chain-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">SYSTEM DESIGN</span>
          <h2>Potential hazard chain</h2>
        </div>
        <span className="concept-tag">
          <Zap size={13} /> Conceptual / Future integration
        </span>
      </div>
      <div className="chain">
        {steps.map((s, i) => (
          <div key={s.label} className="chain-step">
            {i > 0 && <ChevronRight className="chain-arrow" size={18} />}
            <div className="chain-node">
              <s.icon size={19} />
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="chain-note">
        This model illustrates how related hazards may interact. It is not an actual prediction or
        official warning, and does not claim to forecast glacier collapse or every type of mountain
        disaster.
      </p>
    </section>
  )
}
