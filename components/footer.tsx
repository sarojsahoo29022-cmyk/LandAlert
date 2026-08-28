'use client'

import { Logo } from './logo'

export function Footer({ setActive }: { setActive: (label: string) => void }) {
  const links = ['Dashboard', 'Risk Map', 'Analytics', 'Alerts', 'Methodology']
  return (
    <footer className="site-footer">
      <div>
        <Logo />
        <p>AI-Based Landslide Early Warning &amp; Risk Monitoring System</p>
      </div>
      <div className="footer-links">
        {links.map((l) => (
          <button key={l} onClick={() => setActive(l)} type="button">
            {l}
          </button>
        ))}
      </div>
      <div className="footer-note">
        <span>Prototype for Smart India Hackathon</span>
        <small>
          Risk predictions shown in this prototype are for demonstration purposes and should not be
          treated as official disaster warnings.
        </small>
      </div>
    </footer>
  )
}
