'use client'

import { useState } from 'react'
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'
import { Footer } from './footer'
import { DashboardScreen } from './screens/dashboard'
import { RiskMapScreen } from './screens/risk-map'
import { AnalyticsScreen } from './screens/analytics'
import { AlertsScreen } from './screens/alerts'
import { MethodologyScreen } from './screens/methodology'

export default function LandAlertApp() {
  const [active, setActive] = useState('Dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="app-shell">
      <Sidebar
        active={active}
        setActive={setActive}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="main-area">
        <Navbar setMobileOpen={setMobileOpen} />
        {active === 'Dashboard' && <DashboardScreen setActive={setActive} />}
        {active === 'Risk Map' && <RiskMapScreen />}
        {active === 'Analytics' && <AnalyticsScreen />}
        {active === 'Alerts' && <AlertsScreen />}
        {active === 'Methodology' && <MethodologyScreen />}
        <Footer setActive={setActive} />
      </div>
    </div>
  )
}
