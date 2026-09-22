import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export type ReportSection = 'overview' | 'professions' | 'countries' | 'full'

const COLOR_STYLE_PROPS = [
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  'column-rule-color',
  'caret-color',
  'fill',
  'stroke',
  'stop-color',
  'flood-color',
  'lighting-color',
] as const

const UNSUPPORTED_COLOR = /(?:^|[^\w-])(?:color|color-mix|lab|lch|oklab|oklch|hwb)\(/i

function stamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`
}

export function reportSectionFromPath(pathname: string): Exclude<ReportSection, 'full'> {
  if (pathname.includes('/professions')) return 'professions'
  if (pathname.includes('/countries')) return 'countries'
  return 'overview'
}

export function reportSectionTitle(section: Exclude<ReportSection, 'full'> | 'full'): string {
  switch (section) {
    case 'overview':
      return 'Overview report'
    case 'professions':
      return 'Professions report'
    case 'countries':
      return 'Countries report'
    case 'full':
      return 'Full directory report'
  }
}

/** Convert modern CSS colors (color(), color-mix(), oklch…) to rgb/rgba for html2canvas. */
function cssColorToRgb(value: string): string {
  if (!value || value === 'transparent' || value === 'none' || value === 'currentcolor') {
    return value
  }
  if (!UNSUPPORTED_COLOR.test(value) && !value.includes('color(')) {
    return value
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return '#000000'
  }

  ctx.clearRect(0, 0, 1, 1)
  ctx.fillStyle = '#000000'
  ctx.fillStyle = value
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
  if (a === 0) return 'rgba(0, 0, 0, 0)'
  if (a === 255) return `rgb(${r}, ${g}, ${b})`
  return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`
}

function pageBackground(): string {
  const value = getComputedStyle(document.body).backgroundColor
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') {
    return '#ffffff'
  }
  return cssColorToRgb(value)
}

function needsColorFix(value: string): boolean {
  return Boolean(value) && (UNSUPPORTED_COLOR.test(value) || value.includes('color('))
}

function flattenColorsOntoClone(sourceRoot: HTMLElement, clonedRoot: HTMLElement) {
  const sources = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll<HTMLElement>('*'))]
  const clones = [clonedRoot, ...Array.from(clonedRoot.querySelectorAll<HTMLElement>('*'))]

  for (let index = 0; index < sources.length; index += 1) {
    const source = sources[index]
    const clone = clones[index]
    if (!source || !clone) continue

    const computed = getComputedStyle(source)
    for (const prop of COLOR_STYLE_PROPS) {
      const value = computed.getPropertyValue(prop)
      if (needsColorFix(value)) {
        clone.style.setProperty(prop, cssColorToRgb(value))
      }
    }

    const shadow = computed.boxShadow
    if (needsColorFix(shadow)) {
      // Drop complex shadows that embed unsupported color functions
      clone.style.boxShadow = 'none'
    }

    const backgroundImage = computed.backgroundImage
    if (needsColorFix(backgroundImage)) {
      const solid = cssColorToRgb(computed.backgroundColor)
      clone.style.backgroundImage = 'none'
      clone.style.backgroundColor = solid
    }
  }
}

function freezeCloneForCapture(clonedDoc: Document) {
  const style = clonedDoc.createElement('style')
  style.textContent = `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
    }
    .reveal, .reveal-2, .reveal-3 {
      opacity: 1 !important;
      transform: none !important;
    }
  `
  clonedDoc.head.appendChild(style)
}

export async function captureReportElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  const previous = {
    overflow: element.style.overflow,
    height: element.style.height,
    maxHeight: element.style.maxHeight,
  }
  element.style.overflow = 'visible'
  element.style.height = 'auto'
  element.style.maxHeight = 'none'
  element.scrollIntoView({ block: 'start' })

  try {
    return await html2canvas(element, {
      scale: Math.min(2.5, window.devicePixelRatio > 1 ? 2.5 : 2),
      useCORS: true,
      allowTaint: true,
      backgroundColor: pageBackground(),
      logging: false,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      windowWidth: Math.max(element.scrollWidth, element.clientWidth),
      windowHeight: Math.max(element.scrollHeight, element.clientHeight),
      onclone: (_document, clonedElement) => {
        freezeCloneForCapture(clonedElement.ownerDocument)
        clonedElement.style.overflow = 'visible'
        clonedElement.style.height = 'auto'
        clonedElement.style.maxHeight = 'none'
        flattenColorsOntoClone(element, clonedElement)
      },
    })
  } finally {
    element.style.overflow = previous.overflow
    element.style.height = previous.height
    element.style.maxHeight = previous.maxHeight
  }
}

/**
 * Places a full-tab screenshot into the PDF, slicing tall captures across pages
 * so each page reads like a cropped screenshot of the live report UI.
 */
function addScreenshotPages(doc: jsPDF, canvas: HTMLCanvasElement, isFirstSection: boolean) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 6
  const usableWidth = pageWidth - margin * 2
  const pxPerMm = canvas.width / usableWidth

  if (!isFirstSection) {
    doc.addPage()
  }

  let srcY = 0
  let pageIndex = 0

  while (srcY < canvas.height - 1) {
    if (pageIndex > 0) {
      doc.addPage()
    }

    const availableMm = pageHeight - margin * 2
    const slicePx = Math.min(Math.floor(availableMm * pxPerMm), canvas.height - srcY)

    const slice = document.createElement('canvas')
    slice.width = canvas.width
    slice.height = Math.max(slicePx, 1)
    const ctx = slice.getContext('2d')
    if (!ctx) {
      throw new Error('Unable to build PDF page slice')
    }
    ctx.fillStyle = pageBackground()
    ctx.fillRect(0, 0, slice.width, slice.height)
    ctx.drawImage(canvas, 0, srcY, canvas.width, slicePx, 0, 0, canvas.width, slicePx)

    const sliceMm = slicePx / pxPerMm
    doc.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, usableWidth, sliceMm)

    srcY += slicePx
    pageIndex += 1
  }
}

export async function downloadReportCanvases(
  sections: { title: string; canvas: HTMLCanvasElement }[],
  filenameSlug: string,
): Promise<void> {
  if (sections.length === 0) {
    throw new Error('Nothing to export')
  }

  const first = sections[0].canvas
  const landscape = first.width / Math.max(first.height, 1) >= 1.15
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: landscape ? 'landscape' : 'portrait',
  })

  for (let index = 0; index < sections.length; index += 1) {
    addScreenshotPages(doc, sections[index].canvas, index === 0)
  }
  doc.save(`directory-report-${filenameSlug}-${stamp()}.pdf`)
}

export async function downloadReportScreenshot(
  element: HTMLElement,
  _title: string,
  filenameSlug: string,
): Promise<void> {
  const canvas = await captureReportElement(element)
  await downloadReportCanvases([{ title: filenameSlug, canvas }], filenameSlug)
}

export function waitForReportPaint(ms = 450): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, ms)
      })
    })
  })
}
