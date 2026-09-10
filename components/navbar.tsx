'use client'

import { useState, useEffect } from 'react'
import { Bell, Menu, ChevronDown, Settings2, ShieldCheck, MapPin } from 'lucide-react'

export function Navbar({ setMobileOpen }: { setMobileOpen: (open: boolean) => void }) {
  const [adminMenuOpen, setAdminMenuOpen] = useState(false)
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setLastUpdatedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

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
          Updated at {lastUpdatedTime || 'just now'}
        </div>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        {/* Admin Desk Dropdown Trigger & Menu */}
        <div style={{ position: 'relative' }}>
          <div
            className="profile"
            onClick={() => setAdminMenuOpen(!adminMenuOpen)}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <div className="avatar">AD</div>
            <div className="profile-copy">
              <strong>Admin Desk</strong>
              <span>Operations</span>
            </div>
            <ChevronDown size={15} style={{ transform: adminMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {adminMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 260,
                background: '#163a50',
                border: '1px solid #2d556e',
                borderRadius: 8,
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                padding: '12px 14px',
                zIndex: 50,
                color: '#e2e8f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid #2d556e', marginBottom: 10 }}>
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>AD</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>Admin Desk</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>sih.admin@landalert.ner</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
                  <ShieldCheck size={14} style={{ color: '#22c55e' }} />
                  <span>Access Level: <strong>Administrator</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
                  <MapPin size={14} style={{ color: '#38bdf8' }} />
                  <span>Region: <strong>North-East India (9 States)</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
                  <span style={{ fontSize: 14 }}>⚡</span>
                  <span>ML Engine: <strong>HistGradientBoosting v3</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
                  <span style={{ fontSize: 14 }}>👤</span>
                  <span>Role: <strong>Disaster Management Lead</strong></span>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #2d556e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SYSTEM READY</span>
                <button
                  onClick={() => setAdminMenuOpen(false)}
                  style={{ background: 'transparent', border: 0, color: '#94a3b8', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <button className="icon-button desktop-only" aria-label="Settings">
          <Settings2 size={16} />
        </button>
      </div>
    </header>
  )
}
