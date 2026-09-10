'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Crosshair, Search, MapPin } from 'lucide-react'
import { fetchDistricts, geocodeLocation, type DistrictInfo, type GeocodeResult } from '@/lib/ml-api'

export function LocationSearch({
  onAnalyze,
  loading = false,
}: {
  onAnalyze: (searchTerm?: string, district?: DistrictInfo | null) => void
  loading?: boolean
}) {
  const [query, setQuery] = useState('')
  const [districts, setDistricts] = useState<DistrictInfo[]>([])
  const [suggestions, setSuggestions] = useState<(DistrictInfo & { source?: string })[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [geoLoading, setGeoLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchDistricts().then((d) => {
      if (d) setDistricts(d)
    })
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const geocodeSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      setGeoLoading(false)
      return
    }
    setGeoLoading(true)
    const result = await geocodeLocation(q.trim())
    setGeoLoading(false)
    if (result && result.success && result.latitude && result.longitude) {
      setSuggestions([{
        name: result.name || q,
        state: result.admin1 || 'India',
        lat: result.latitude,
        lon: result.longitude,
        source: 'geocode' as const,
      }])
      setShowDropdown(true)
    }
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    setHighlightIndex(-1)
    if (value.trim().length === 0) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    // First: match against local districts
    const lower = value.toLowerCase()
    const matched = districts.filter(
      (d) =>
        d.name.toLowerCase().includes(lower) ||
        d.state.toLowerCase().includes(lower)
    )

    if (matched.length > 0) {
      setSuggestions(matched.slice(0, 5))
      setShowDropdown(true)
    }

    // Debounce: also try geocoding for any location worldwide
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (matched.length === 0) {
        geocodeSearch(value)
      }
    }, 600)
  }

  function selectSuggestion(d: DistrictInfo | { name: string; state: string; lat: number; lon: number; source: string }) {
    setQuery(d.name)
    setShowDropdown(false)
    setHighlightIndex(-1)
    onAnalyze(d.name, d as DistrictInfo)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && highlightIndex < suggestions.length) {
        selectSuggestion(suggestions[highlightIndex])
      } else {
        const match = districts.find(
          (d) => d.name.toLowerCase() === query.toLowerCase()
        )
        onAnalyze(query || undefined, match ?? null)
        setShowDropdown(false)
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  return (
    <div className="search-row" style={{ position: 'relative' }}>
      <div className="search-box">
        <Search size={19} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true)
          }}
          placeholder="Search any location (Shillong, Guwahati, Darjeeling...)"
          aria-label="Search location"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
        />
        <kbd>⌘ K</kbd>
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="search-dropdown"
          role="listbox"
        >
          {suggestions.map((d, i) => (
            <div
              key={`${d.name}-${d.lat}`}
              role="option"
              aria-selected={i === highlightIndex}
              className={`search-dropdown-item${i === highlightIndex ? ' highlighted' : ''}`}
              onClick={() => selectSuggestion(d)}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              {d.source === 'geocode' ? <MapPin size={13} style={{ marginRight: 6, opacity: 0.6 }} /> : <MapPin size={13} style={{ marginRight: 6, opacity: 0.6 }} />}
              <span>{d.name}</span>
              <span>{d.state}</span>
            </div>
          ))}
          {geoLoading && (
            <div className="search-dropdown-item" style={{ opacity: 0.5 }}>
              <span className="spinner" aria-hidden />
              <span>Searching globally...</span>
            </div>
          )}
        </div>
      )}
      <button
        className="primary-button"
        onClick={() => {
          const match = districts.find(
            (d) => d.name.toLowerCase() === query.toLowerCase()
          )
          onAnalyze(query || undefined, match ?? null)
          setShowDropdown(false)
        }}
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
