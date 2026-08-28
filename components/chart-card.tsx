import { cn } from '@/lib/utils'

export function ChartCard({
  kicker,
  title,
  legend,
  children,
  className,
  footer,
}: {
  kicker?: string
  title: string
  legend?: React.ReactNode
  children: React.ReactNode
  className?: string
  footer?: React.ReactNode
}) {
  return (
    <section className={cn('panel chart-card', className)}>
      <div className="panel-heading">
        <div>
          {kicker && <span className="section-kicker">{kicker}</span>}
          <h2>{title}</h2>
        </div>
        {legend}
      </div>
      {children}
      {footer}
    </section>
  )
}
