'use client'

import { Bell, Menu, ChevronDown, Settings2 } from 'lucide-react'

export function Navbar({ setMobileOpen }: { setMobileOpen: (open: boolean) => void }) {
  return (
    <header className="topbar">
      <button
        className="icon-button menu-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={21} />
      </button>
      <div className="topbar-context">
        <span className="eyebrow">LANDSLIDE-PRONE REGIONS · INDIA</span>
        <span className="crumb-divider">/</span>
        <span>Monitoring overview</span>
      </div>
      <div className="topbar-actions">
        <div className="update-time">
          <span className="pulse-dot" />
          Updated 2 min ago
        </div>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>
        <div className="profile">
          <div className="avatar">AD</div>
          <div className="profile-copy">
            <strong>Admin Desk</strong>
            <span>Operations</span>
          </div>
          <ChevronDown size={15} />
        </div>
        <button className="icon-button desktop-only" aria-label="Settings">
          <Settings2 size={16} />
        </button>
      </div>
    </header>
  )
}
