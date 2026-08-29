import { Mountain } from 'lucide-react'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo-wrap">
      <div className="logo-mark">
        <Mountain size={20} strokeWidth={2.2} />
      </div>
      {!compact && (
        <div>
          <div className="logo-name">GeoShield</div>
          <div className="logo-subtitle">AI LANDSLIDE INTELLIGENCE</div>
        </div>
      )}
    </div>
  )
}
