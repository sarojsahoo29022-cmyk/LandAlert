'use client'

import { useState } from 'react'
import { Crosshair, Search } from 'lucide-react'

export function LocationSearch({
  onAnalyze,
  loading = false,
}: {
  onAnalyze: (searchTerm?: string) => void
  loading?: boolean
}) {
  const [query, setQuery] = useState('')
  return (
    <div className="search-row">
      <div className="search-box">
        <Search size={19} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search city, district or location..."
          aria-label="Search location"
        />
        <kbd>⌘ K</kbd>
      </div>
      <button
        className="primary-button"
        onClick={() => onAnalyze(query || undefined)}
        disabled={loading}
        type="button"
      >
        {loading ? (
          <>
            <span className="spinner" aria-hidden />
            Analyzing...
          </>
        ) : (
          <>
            <Crosshair size={17} />
            Analyze risk
          </>
        )}
      </button>
    </div>
  )
}
