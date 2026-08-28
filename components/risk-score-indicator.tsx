import type { RiskLevel } from '@/lib/types'
import { severityHex } from '@/lib/mock-data'

export function RiskScoreIndicator({
  score,
  level,
  size = 130,
}: {
  score: number
  level: RiskLevel
  size?: number
}) {
  const color = severityHex[level]
  return (
    <div
      className="score-ring"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0 ${score}%, #31576a ${score}% 100%)`,
      }}
    >
      <div>
        <strong>{score}</strong>
        <span>/ 100</span>
        <small>RISK SCORE</small>
      </div>
    </div>
  )
}
