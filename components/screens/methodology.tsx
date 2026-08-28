'use client'

import {
  Activity,
  Bell,
  CloudRain,
  Crosshair,
  Database,
  FileText,
  MapPin,
  Settings2,
  ShieldCheck,
  Sparkles,
  Mountain,
  Waves,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { HazardChain } from '../hazard-chain'

const primarySteps = [
  { icon: CloudRain, title: 'Environmental data', text: 'Weather, rainfall, terrain and historical event inputs.' },
  { icon: Database, title: 'Data processing', text: 'Clean, normalize and prepare geospatial signals.' },
  { icon: Settings2, title: 'Feature engineering', text: 'Derive slope, elevation and rainfall trend indicators.' },
  { icon: Sparkles, title: 'AI / ML risk model', text: 'Analyze relationships with historical landslide events.' },
  { icon: Crosshair, title: 'Risk prediction', text: 'Generate interpretable risk scores and levels.' },
  { icon: MapPin, title: 'GIS visualization', text: 'Make patterns visible to monitoring teams.' },
  { icon: Bell, title: 'Early warning', text: 'Surface high-risk conditions for authorities.' },
]

const secondarySteps = [
  { icon: CloudRain, title: 'Weather + Terrain + History + Geospatial', text: 'Unified multi-source input.' },
  { icon: Activity, title: 'Hazard detection', text: 'Identify candidate related hazards.' },
  { icon: Waves, title: 'Hazard interaction analysis', text: 'Model how hazards may compound.' },
  { icon: MapPin, title: 'Impact / risk mapping', text: 'Translate interactions into spatial risk.' },
  { icon: Bell, title: 'Early warning', text: 'Notify responsible authorities.' },
]

export function MethodologyScreen() {
  return (
    <div className="screen-content">
      <div className="screen-header">
        <div>
          <span className="eyebrow">METHODOLOGY</span>
          <h1>From signals to action</h1>
          <p>A transparent foundation for AI-assisted landslide monitoring and early warning.</p>
        </div>
        <span className="concept-tag">
          <ShieldCheck size={14} /> Designed for responsible use
        </span>
      </div>

      <section className="method-pipeline panel">
        <div className="section-kicker">PRIMARY PIPELINE · CURRENT PROTOTYPE</div>
        <div className="pipeline">
          {primarySteps.map((step, i) => (
            <div className="pipeline-step" key={step.title}>
              <div className="pipeline-icon">
                <step.icon size={19} />
              </div>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
              {i < primarySteps.length - 1 && <ChevronRight className="pipeline-arrow" size={18} />}
            </div>
          ))}
        </div>
      </section>

      <section className="method-pipeline panel future-pipeline">
        <div className="section-kicker">SECONDARY PIPELINE · FUTURE MULTI-HAZARD EXPANSION</div>
        <div className="pipeline">
          {secondarySteps.map((step, i) => (
            <div className="pipeline-step" key={step.title}>
              <div className="pipeline-icon">
                <step.icon size={19} />
              </div>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
              {i < secondarySteps.length - 1 && <ChevronRight className="pipeline-arrow" size={18} />}
            </div>
          ))}
        </div>
      </section>

      <div className="method-cards">
        <section className="method-card">
          <div className="method-card-icon">
            <CloudRain size={20} />
          </div>
          <h2>Data sources</h2>
          <p>LandAlert is designed to combine dependable environmental inputs into a shared operating picture.</p>
          <div className="method-list">
            <span>Weather &amp; rainfall</span>
            <span>Terrain &amp; elevation</span>
            <span>Historical landslides</span>
            <span>Geospatial information</span>
          </div>
        </section>

        <section className="method-card">
          <div className="method-card-icon">
            <Sparkles size={20} />
          </div>
          <h2>AI / ML</h2>
          <p>
            Machine-learning models analyze relationships between environmental conditions and historical
            landslide events to estimate risk.
          </p>
        </section>

        <section className="method-card">
          <div className="method-card-icon">
            <FileText size={20} />
          </div>
          <h2>Explainable AI</h2>
          <p>
            The system shows the major factors contributing to each prediction, so analysts can understand
            and trust the assessment.
          </p>
        </section>

        <section className="method-card">
          <div className="method-card-icon">
            <Mountain size={20} />
          </div>
          <h2>Multi-hazard expansion</h2>
          <p>
            The architecture can eventually incorporate related mountain hazards such as extreme rainfall,
            debris flow and flash flooding. It does not currently predict glacier collapse or every type of
            mountain disaster.
          </p>
          <div className="future-list">
            <span>Extreme rainfall</span>
            <span>Debris flow</span>
            <span>Flash flood</span>
            <span>Mountain hazard</span>
          </div>
        </section>

        <section className="method-card">
          <div className="method-card-icon">
            <Bell size={20} />
          </div>
          <h2>Early warning</h2>
          <p>
            When high-risk conditions are detected, LandAlert can surface warnings for responsible disaster
            management authorities — never as a substitute for official advisories.
          </p>
        </section>

        <section className="method-card highlight-card">
          <div className="method-card-icon">
            <Zap size={20} />
          </div>
          <h2>Honest by design</h2>
          <p className="method-highlight">
            This prototype uses demonstration data only. Risk values shown here are not official disaster
            warnings and must not be used for real-world decisions.
          </p>
        </section>
      </div>

      <HazardChain />

      <p className="chain-note method-disclaimer">
        LandAlert currently focuses on AI-assisted landslide risk monitoring and early warning. Future
        multi-hazard awareness (extreme rainfall, debris flow, flash flooding, mountain hazard) is a
        conceptual design direction and does not claim to predict glacier collapse or every possible natural
        disaster.
      </p>
    </div>
  )
}
