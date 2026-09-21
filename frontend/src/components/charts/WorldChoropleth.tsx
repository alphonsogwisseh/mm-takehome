import { useEffect, useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { useTheme } from '../../hooks/useTheme.tsx'
import {
  buildCountryCountLookup,
  fillForCount,
  seedLabelForAtlasName,
} from '../../utils/countryMap'
import { titleCase } from '../../utils/format'

const GEO_URL = '/geo/countries-50m.json'

export interface WorldChoroplethItem {
  label: string
  count: number
}

interface WorldChoroplethProps {
  items: WorldChoroplethItem[]
  caption: string
  selectedCountries?: string[]
  onCountryToggle?: (seedLabel: string) => void
}

interface AtlasCountry {
  properties: { name?: string }
}

interface AtlasTopology {
  objects: {
    countries: {
      geometries: AtlasCountry[]
    }
  }
}

export function WorldChoropleth({
  items,
  caption,
  selectedCountries = [],
  onCountryToggle,
}: WorldChoroplethProps) {
  const { isDark } = useTheme()
  const [hovered, setHovered] = useState<{ name: string; count: number } | null>(null)
  const [atlasNames, setAtlasNames] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    fetch(GEO_URL)
      .then((response) => response.json())
      .then((topology: AtlasTopology) => {
        if (cancelled) return
        setAtlasNames(
          topology.objects.countries.geometries
            .map((geometry) => geometry.properties.name ?? '')
            .filter(Boolean),
        )
      })
      .catch(() => {
        if (!cancelled) setAtlasNames([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const peak = useMemo(
    () => Math.max(...items.map((item) => item.count), 1),
    [items],
  )

  const counts = useMemo(
    () => buildCountryCountLookup(items, atlasNames),
    [items, atlasNames],
  )

  const selectedAtlasNames = useMemo(() => {
    if (selectedCountries.length === 0 || atlasNames.length === 0) return new Set<string>()
    const lookup = buildCountryCountLookup(
      selectedCountries.map((label) => ({ label, count: 1 })),
      atlasNames,
    )
    return new Set(lookup.keys())
  }, [selectedCountries, atlasNames])

  const mappedUsers = useMemo(
    () => [...counts.values()].reduce((sum, value) => sum + value, 0),
    [counts],
  )

  function handleSelect(atlasName: string) {
    if (!onCountryToggle) return
    const seedLabel = seedLabelForAtlasName(
      atlasName,
      items.map((item) => item.label),
      atlasNames,
    )
    if (seedLabel) onCountryToggle(seedLabel)
  }

  return (
    <div className="world-map">
      <ComposableMap
        projection="geoEqualEarth"
        projectionConfig={{ scale: 155 }}
        width={980}
        height={460}
        className="world-map__svg"
        role="img"
        aria-label={`${caption}. ${items
          .slice(0, 8)
          .map((item) => `${titleCase(item.label)}: ${item.count}`)
          .join(', ')}`}
      >
        <ZoomableGroup center={[0, 8]} minZoom={1} maxZoom={6}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = String(geo.properties?.name ?? '')
                const count = counts.get(name) ?? 0
                const isHovered = hovered?.name === name
                const dark = isDark
                const isSelected = selectedAtlasNames.has(name)
                const fill = isHovered || isSelected
                  ? count > 0
                    ? dark
                      ? '#3b82f6'
                      : '#2563eb'
                    : dark
                      ? '#334155'
                      : '#e2e8f0'
                  : fillForCount(count, peak, dark)

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => setHovered({ name, count })}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => handleSelect(name)}
                    fill={fill}
                    stroke={isSelected ? (dark ? '#93c5fd' : '#1d4ed8') : dark ? '#0b1220' : '#ffffff'}
                    strokeWidth={isSelected || isHovered ? 0.75 : 0.4}
                    style={{ outline: 'none', cursor: count > 0 ? 'pointer' : 'default' }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      <div className="world-map__footer">
        <p className="world-map__readout" aria-live="polite">
          {hovered ? (
            <>
              <strong>{hovered.name}</strong>
              {hovered.count > 0
                ? ` — ${hovered.count.toLocaleString()} users · click to ${selectedAtlasNames.has(hovered.name) ? 'remove' : 'add'}`
                : ' — no users in this scope'}
            </>
          ) : (
            <span className="trend__hint">
              Click countries to multi-select · scroll to zoom · {mappedUsers.toLocaleString()} users
              on the map
              {selectedCountries.length > 0
                ? ` · ${selectedCountries.length} selected`
                : ''}
            </span>
          )}
        </p>

        <div className="world-map__legend" aria-hidden="true">
          <span>Fewer</span>
          <span className="world-map__ramp" />
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
