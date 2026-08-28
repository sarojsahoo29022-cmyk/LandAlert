'use client'

import { cn } from '@/lib/utils'
import { StatusBadge } from './status-badge'
import type { RiskLevel } from '@/lib/types'

export function DataTable({
  columns,
  rows,
  renderCell,
  className,
}: {
  columns: string[]
  rows: string[][]
  renderCell?: (column: string, value: string, rowIndex: number, row: string[]) => React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('table-wrap', className)}>
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c, j) => (
                <td key={c}>
                  {renderCell ? renderCell(c, row[j], i, row) : row[j]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Helper used by callers that want to render a severity badge inside a table cell.
export function riskCell(value: string): React.ReactNode {
  const tone = value.toLowerCase().replace(' ', '-') as RiskLevel
  return <StatusBadge tone={tone}>{value}</StatusBadge>
}
