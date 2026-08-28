'use client'

import { Activity, MapPin, SlidersHorizontal, Bell, FileText, X, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './logo'

const navItems = [
  { label: 'Dashboard', icon: Activity, count: 0 },
  { label: 'Risk Map', icon: MapPin, count: 0 },
  { label: 'Analytics', icon: SlidersHorizontal, count: 0 },
  { label: 'Alerts', icon: Bell, count: 2 },
  { label: 'Methodology', icon: FileText, count: 0 },
]

export function Sidebar({
  active,
  setActive,
  mobileOpen,
  setMobileOpen,
}: {
  active: string
  setActive: (label: string) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}) {
  return (
    <aside className={cn('sidebar', mobileOpen && 'mobile-open')}>
      <div className="sidebar-top">
        <Logo />
        <button
          className="icon-button mobile-close"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={19} />
        </button>
      </div>
      <div className="workspace-label">OPERATIONS CENTER</div>
      <nav className="side-nav" aria-label="Primary navigation">
        {navItems.map(({ label, icon: Icon, count }) => (
          <button
            key={label}
            className={cn('nav-item', active === label && 'active')}
            onClick={() => {
              setActive(label)
              setMobileOpen(false)
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
            {count > 0 && <span className="nav-count">{count}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="data-status">
          <span className="pulse-dot" />
          <div>
            <strong>System operational</strong>
            <span>All core services online</span>
          </div>
        </div>
        <div className="sidebar-foot">
          <span>LandAlert v0.1 · Demo</span>
          <button aria-label="Settings">
            <Settings2 size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
