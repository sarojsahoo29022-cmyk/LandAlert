'use client'

import { useEffect, useRef, useState } from 'react'
import { Crosshair, Search } from 'lucide-react'
import { fetchDistricts, type DistrictInfo } from '@/lib/ml-api'

export function LocationSearch({
  onAnalyze,
  loading = false,
}: {
  onAnalyze: (searchTerm?: string, district?: DistrictInfo | null) => void
  loading?: boolean
}) {
  const [query, setQuery] = useState('')
  const [districts, setDistricts] = useState<DistrictInfo[]>([])
  const [suggestions, setSuggestions] = useState<DistrictInfo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  function handleChange(value: string) {
    setQuery(value)
    setHighlightIndex(-1)
    if (value.trim().length === 0) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    const lower = value.toLowerCase()
    const matched = districts.filter(
      (d) =>
        d.name.toLowerCase().includes(lower) ||
        d.state.toLowerCase().includes(lower)
    )
    setSuggestions(matched.slice(0, 8))
    setShowDropdown(matched.length > 0)
  }

  function selectDistrict(d: DistrictInfo) {
    setQuery(d.name)
    setShowDropdown(false)
    setHighlightIndex(-1)
    onAnalyze(d.name, d)
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
        selectDistrict(suggestions[highlightIndex])
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
          placeholder="Search city, district or state..."
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
              key={d.name}
              role="option"
              aria-selected={i === highlightIndex}
              className={`search-dropdown-item${i === highlightIndex ? ' highlighted' : ''}`}
              onClick={() => selectDistrict(d)}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              <span>{d.name}</span>
              <span>{d.state}</span>
            </div>
          ))}
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
