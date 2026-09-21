/** Normalize country labels so seed data can match Natural Earth map names. */
export function normalizeCountryName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Seed-data quirks → Natural Earth / world-atlas names. */
const ALIASES: Record<string, string> = {
  andorra: 'Andorra',
  'united states': 'United States of America',
  'czech republic': 'Czechia',
  'moldova republic of': 'Moldova',
  'central african republic': 'Central African Rep.',
  'taiwan province of china': 'Taiwan',
  'macedonia the former yugoslav republic of': 'Macedonia',
  swaziland: 'eSwatini',
  'falkland islands malvinas': 'Falkland Is.',
  'dominican republic': 'Dominican Rep.',
  'bosnia and herzegovina': 'Bosnia and Herz.',
  'equatorial guinea': 'Eq. Guinea',
  'russian federation': 'Russia',
  'syrian arab republic': 'Syria',
  venezuela: 'Venezuela',
  bolivia: 'Bolivia',
  'brunei darussalam': 'Brunei',
  'iran islamic republic of': 'Iran',
  'korea republic of': 'South Korea',
  'korea democratic people s republic of': 'North Korea',
  'lao people s democratic republic': 'Laos',
  'tanzania united republic of': 'Tanzania',
  'viet nam': 'Vietnam',
  'palestinian territory occupied': 'Palestine',
  congo: 'Congo',
  'congo the democratic republic of the': 'Dem. Rep. Congo',
  'democratic republic of the congo': 'Dem. Rep. Congo',
  'saint lucia': 'Saint Lucia',
  'saint kitts and nevis': 'St. Kitts and Nevis',
  'saint vincent and the grenadines': 'St. Vin. and Gren.',
  'sao tome and principe': 'São Tomé and Principe',
  'antigua and barbuda': 'Antigua and Barb.',
  'virgin islands british': 'British Virgin Is.',
  'virgin islands u s': 'U.S. Virgin Is.',
  'micronesia federated states of': 'Micronesia',
  'holy see vatican city state': 'Vatican',
  'cote d ivoire': "Côte d'Ivoire",
  'ivory coast': "Côte d'Ivoire",
  'wallis and futuna': 'Wallis and Futuna Is.',
  pitcairn: 'Pitcairn Is.',
  'aland islands': 'Åland',
  'libyan arab jamahiriya': 'Libya',
  'western sahara': 'W. Sahara',
  'cape verde': 'Cabo Verde',
  'serbia and montenegro': 'Serbia',
  'solomon islands': 'Solomon Is.',
  'faroe islands': 'Faeroe Islands',
  reunion: 'Réunion',
  'united kingdom': 'United Kingdom',
  slovakia: 'Slovakia',
}

function resolveAtlasName(
  label: string,
  atlasByNorm: Map<string, string>,
): string | null {
  const key = normalizeCountryName(label)
  const direct = atlasByNorm.get(key)
  if (direct) return direct

  const alias = ALIASES[key]
  if (!alias) return null

  return atlasByNorm.get(normalizeCountryName(alias)) ?? null
}

/**
 * Build a lookup keyed by atlas geography names from analytics country labels.
 * Values for the same mapped country are summed.
 */
export function buildCountryCountLookup(
  entries: { label: string; count: number }[],
  atlasNames: Iterable<string>,
): Map<string, number> {
  const atlasByNorm = new Map<string, string>()
  for (const name of atlasNames) {
    atlasByNorm.set(normalizeCountryName(name), name)
  }

  const counts = new Map<string, number>()

  for (const entry of entries) {
    const atlasName = resolveAtlasName(entry.label, atlasByNorm)
    if (!atlasName) continue
    counts.set(atlasName, (counts.get(atlasName) ?? 0) + entry.count)
  }

  return counts
}

/** Find the seed/filter label that maps to a given atlas geography name. */
export function seedLabelForAtlasName(
  atlasName: string,
  seedLabels: Iterable<string>,
  atlasNames: Iterable<string>,
): string | null {
  const atlasByNorm = new Map<string, string>()
  for (const name of atlasNames) {
    atlasByNorm.set(normalizeCountryName(name), name)
  }

  for (const label of seedLabels) {
    if (resolveAtlasName(label, atlasByNorm) === atlasName) {
      return label
    }
  }
  return null
}

export function fillForCount(count: number, peak: number, dark = false): string {
  if (count <= 0 || peak <= 0) return dark ? '#1e293b' : '#eff6ff'
  const t = Math.sqrt(count / peak)
  // Soft sky → vivid blue (matches dashboard accent)
  const lightness = dark ? 28 + t * 32 : 88 - t * 36
  const saturation = dark ? 65 + t * 15 : 72 + t * 12
  return `hsl(217 ${saturation}% ${lightness}%)`
}
