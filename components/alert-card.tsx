'use client'

import { AlertTriangle, ChevronRight, MoveUpRight } from 'lucide-react'
import type { Alert } from '@/lib/types'
import { StatusBadge } from './status-badge'

export function AlertCard({
  alert,
  onSelect,
  expanded = false,
}: {
  alert: Alert
  onSelect?: (id: string) => void
  expanded?: boolean
}) {
  return (
    <div
      className={`alert-row ${expanded ? 'expanded' : ''}`}
      onClick={() => onSelect?.(alert.id)}
      role={onSelect ? 'button' : undefined}
    >
      <div className={`alert-severity ${alert.level}`}>
        <AlertTriangle size={16} />
      </div>
      <div className="alert-copy">
        <div>
          <StatusBadge tone={alert.level}>{alert.label}</StatusBadge>
          <span>{alert.type}</span>
        </div>
        <strong>{alert.location}</strong>
        <p>{alert.text}</p>
      </div>
      <div className="alert-time">
        <span>{alert.time}</span>
        <StatusBadge tone={alert.status}>{alert.status}</StatusBadge>
        {onSelect && <ChevronRight size={15} className="row-chevron" />}
      </div>
    </div>
  )
}
