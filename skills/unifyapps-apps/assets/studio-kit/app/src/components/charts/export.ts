import type { ChartSpec } from './spec'

export type TableData = { labels: string[]; series: { name: string; data: number[] }[] }
/** Colour key drawn under radial charts (and multi-series charts), where the chart alone does not name its parts. */
export type LegendItem = { color: string; label: string; detail: string }

const PAPER = '#FFFDF9'
const INK = '#1F1C12'
const MUTED = '#6B6450'
const GOLD = '#847347'

export function slugify(text: string) {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || 'ua-chart'
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > width && line) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/** The chart as a finished image: title, subtitle, the chart itself and the source line, on paper. */
export function composeImage(canvas: HTMLCanvasElement, spec: ChartSpec, rtl: boolean, legend: LegendItem[] = []): HTMLCanvasElement {
  const scale = 2
  const pad = 28 * scale
  const width = Math.max(canvas.width, 900 * scale)
  const out = document.createElement('canvas')
  const measure = out.getContext('2d')!
  const display = rtl ? "'Noto Naskh Arabic', 'Spectral', Georgia, serif" : "'Spectral', 'Noto Naskh Arabic', Georgia, serif"
  const text = rtl ? "'IBM Plex Sans Arabic', 'Poppins', sans-serif" : "'Poppins', 'IBM Plex Sans Arabic', sans-serif"
  measure.font = `600 ${24 * scale}px ${display}`
  const titleLines = spec.title ? wrapLines(measure, spec.title, width - pad * 2) : []
  measure.font = `400 ${14 * scale}px ${text}`
  const subLines = spec.subtitle ? wrapLines(measure, spec.subtitle, width - pad * 2) : []
  measure.font = `400 ${12 * scale}px ${text}`
  const sourceLines = spec.source ? wrapLines(measure, spec.source, width - pad * 2) : []

  // radial charts are square-ish: cap their width so the image is not mostly doughnut
  const chartWidth = legend.length && canvas.height / canvas.width > 0.6 ? Math.min(width - pad * 2, 900 * scale * 0.72) : width - pad * 2
  const chartHeight = Math.round((canvas.height / canvas.width) * chartWidth)
  const legendColumns = legend.length > 8 ? 3 : legend.length > 3 ? 2 : 1
  const legendRows = Math.ceil(legend.length / legendColumns)
  const legendHeight = legend.length ? 12 * scale + legendRows * 26 * scale : 0
  const height = pad + titleLines.length * 32 * scale + subLines.length * 20 * scale + 16 * scale + chartHeight + legendHeight + 16 * scale + sourceLines.length * 18 * scale + pad
  out.width = width
  out.height = height
  const ctx = out.getContext('2d')!
  ctx.fillStyle = PAPER
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = GOLD
  ctx.fillRect(0, 0, width, 5 * scale)
  ctx.direction = rtl ? 'rtl' : 'ltr'
  ctx.textAlign = rtl ? 'right' : 'left'
  ctx.textBaseline = 'top'
  const x = rtl ? width - pad : pad
  let y = pad
  ctx.fillStyle = INK
  ctx.font = `600 ${24 * scale}px ${display}`
  for (const line of titleLines) {
    ctx.fillText(line, x, y)
    y += 32 * scale
  }
  ctx.fillStyle = MUTED
  ctx.font = `400 ${14 * scale}px ${text}`
  for (const line of subLines) {
    ctx.fillText(line, x, y)
    y += 20 * scale
  }
  y += 16 * scale
  ctx.drawImage(canvas, (width - chartWidth) / 2, y, chartWidth, chartHeight)
  y += chartHeight
  if (legend.length) {
    y += 12 * scale
    const columnWidth = (width - pad * 2) / legendColumns
    legend.forEach((item, index) => {
      const column = index % legendColumns
      const row = Math.floor(index / legendColumns)
      const top = y + row * 26 * scale
      const start = rtl ? width - pad - column * columnWidth : pad + column * columnWidth
      const swatch = 12 * scale
      ctx.fillStyle = item.color
      ctx.fillRect(rtl ? start - swatch : start, top + 4 * scale, swatch, swatch)
      ctx.fillStyle = INK
      ctx.font = `500 ${13 * scale}px ${text}`
      const textX = rtl ? start - swatch - 8 * scale : start + swatch + 8 * scale
      const room = columnWidth - swatch - 20 * scale
      const detail = `  ${item.detail}`
      ctx.font = `400 ${12 * scale}px ${text}`
      const detailWidth = ctx.measureText(detail).width
      ctx.font = `500 ${13 * scale}px ${text}`
      let label = item.label
      while (label.length > 4 && ctx.measureText(label).width > room - detailWidth) label = `${label.slice(0, -2)}…`
      ctx.fillText(label, textX, top + 2 * scale)
      const labelWidth = ctx.measureText(label).width
      ctx.fillStyle = MUTED
      ctx.font = `400 ${12 * scale}px ${text}`
      ctx.fillText(detail, rtl ? textX - labelWidth : textX + labelWidth, top + 3 * scale)
    })
    y += legendRows * 26 * scale
  }
  y += 16 * scale
  ctx.fillStyle = MUTED
  ctx.font = `400 ${12 * scale}px ${text}`
  for (const line of sourceLines) {
    ctx.fillText(line, x, y)
    y += 18 * scale
  }
  return out
}

export function exportPng(canvas: HTMLCanvasElement, spec: ChartSpec, rtl: boolean, legend: LegendItem[] = []) {
  composeImage(canvas, spec, rtl, legend).toBlob((blob) => blob && download(blob, `${slugify(spec.title)}.png`), 'image/png')
}

function csvCell(value: string | number) {
  let text = String(value)
  // labels come from agent / CRM text: never let a spreadsheet run them as a formula
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text) && !Number.isFinite(Number(text))) text = `'${text}`
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toRows(table: TableData, labelHeader: string) {
  return [[labelHeader, ...table.series.map((series) => series.name || labelHeader)], ...table.labels.map((label, index) => [label, ...table.series.map((series) => series.data[index])])]
}

export function exportCsv(table: TableData, spec: ChartSpec, labelHeader: string) {
  const body = toRows(table, labelHeader).map((row) => row.map(csvCell).join(',')).join('\r\n')
  // BOM so Excel opens Arabic text as UTF-8
  download(new Blob(['﻿', body], { type: 'text/csv;charset=utf-8' }), `${slugify(spec.title)}.csv`)
}

export async function copyTable(table: TableData, labelHeader: string) {
  const tsv = toRows(table, labelHeader).map((row) => row.join('\t')).join('\n')
  await navigator.clipboard.writeText(tsv)
}

/** A real .xlsx: styled title, header and totals, numbers kept numeric, and the chart image beside the data. */
export async function exportXlsx(canvas: HTMLCanvasElement, table: TableData, spec: ChartSpec, labelHeader: string, totalLabel: string, rtl: boolean, legend: LegendItem[] = []) {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'UnifyApps SC Native'
  const sheet = workbook.addWorksheet('Chart', { views: [{ rightToLeft: rtl, showGridLines: false }] })
  const columns = 1 + table.series.length
  sheet.getColumn(1).width = Math.min(48, Math.max(18, ...table.labels.map((label) => label.length + 2)))
  for (let column = 2; column <= columns; column++) sheet.getColumn(column).width = 18

  sheet.addRow([spec.title]).font = { bold: true, size: 15, color: { argb: 'FF14261D' } }
  if (spec.subtitle) sheet.addRow([spec.subtitle]).font = { size: 11, color: { argb: 'FF5D6B63' } }
  sheet.addRow([])
  const header = sheet.addRow([labelHeader, ...table.series.map((series) => series.name || spec.unit || labelHeader)])
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F5A45' } }
    cell.alignment = { vertical: 'middle' }
  })
  const numberFormat = spec.currency ? `#,##0.00 "${spec.currency}"` : '#,##0.##'
  const firstData = sheet.rowCount + 1
  table.labels.forEach((label, index) => {
    const row = sheet.addRow([label, ...table.series.map((series) => series.data[index])])
    for (let column = 2; column <= columns; column++) row.getCell(column).numFmt = numberFormat
    if (index % 2 === 1) row.eachCell((cell) => (cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6F2E6' } }))
  })
  const lastData = sheet.rowCount
  const totals = sheet.addRow([totalLabel, ...table.series.map((_, index) => {
    const letter = String.fromCharCode(66 + index)
    return { formula: `SUM(${letter}${firstData}:${letter}${lastData})` }
  })])
  totals.font = { bold: true }
  for (let column = 2; column <= columns; column++) totals.getCell(column).numFmt = numberFormat
  totals.eachCell((cell) => (cell.border = { top: { style: 'thin', color: { argb: 'FFA8841F' } } }))
  if (spec.source) {
    sheet.addRow([])
    sheet.addRow([spec.source]).font = { italic: true, size: 9, color: { argb: 'FF5D6B63' } }
  }

  const image = composeImage(canvas, spec, rtl, legend)
  const imageId = workbook.addImage({ base64: image.toDataURL('image/png'), extension: 'png' })
  const imageWidth = 640
  sheet.addImage(imageId, { tl: { col: columns + 1, row: 1 }, ext: { width: imageWidth, height: Math.round((image.height / image.width) * imageWidth) } })

  const buffer = await workbook.xlsx.writeBuffer()
  download(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${slugify(spec.title)}.xlsx`)
}

/** Print-ready page with the composed image — the browser's dialog saves it as PDF. */
export function printChart(canvas: HTMLCanvasElement, spec: ChartSpec, rtl: boolean, legend: LegendItem[] = []) {
  const image = composeImage(canvas, spec, rtl, legend).toDataURL('image/png')
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0'
  document.body.appendChild(frame)
  const doc = frame.contentDocument!
  doc.open()
  doc.write(`<!doctype html><html dir="${rtl ? 'rtl' : 'ltr'}"><head><title>${spec.title.replace(/</g, '&lt;')}</title><style>@page{size:landscape;margin:12mm}body{margin:0}img{width:100%}</style></head><body><img src="${image}"></body></html>`)
  doc.close()
  const img = doc.querySelector('img')!
  const go = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    setTimeout(() => frame.remove(), 2000)
  }
  if (img.complete) go()
  else img.onload = go
}
