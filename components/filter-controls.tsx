'use client'

import { cn } from '@/lib/utils'

export interface FilterGroup {
  label: string
  options: string[]
  selected: string
  onSelect: (option: string) => void
}

export function FilterControls({ groups }: { groups: FilterGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <div className="filter-section" key={group.label}>
          <div className="section-kicker">{group.label}</div>
          <div className="filter-pills small">
            {group.options.map((opt) => (
              <button
                key={opt}
                className={cn(group.selected === opt ? 'selected' : '')}
                onClick={() => group.onSelect(opt)}
                type="button"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
