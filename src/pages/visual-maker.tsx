'use client'
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { read, utils } from 'xlsx'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'

import { ThemeProvider, createTheme, alpha } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Slider from '@mui/material/Slider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import LinearProgress from '@mui/material/LinearProgress'
import Backdrop from '@mui/material/Backdrop'
import Collapse from '@mui/material/Collapse'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'

import GridOnIcon from '@mui/icons-material/GridOn'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import TableChartIcon from '@mui/icons-material/TableChart'
import PaletteIcon from '@mui/icons-material/Palette'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CloseIcon from '@mui/icons-material/Close'
import PrintIcon from '@mui/icons-material/Print'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import AddIcon from '@mui/icons-material/Add'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import TuneIcon from '@mui/icons-material/Tune'

import WhatsNewBanner from '../components/WhatsNewBanner'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'upload' | 'data' | 'design'
type LayoutStyle = 'vertical' | 'side-code-right' | 'size-grid'
type GridFlow = 'row' | 'column'
type SortDir = 'asc' | 'desc'
interface SortRule { key: OutputCol; dir: SortDir }

interface DataIssues {
  missingColumns: Array<{ label: string; colName: string }>
  blankByField: Record<string, number[]>  // field label → 1-based row numbers
}

interface DataIssues {
  missingColumns: Array<{ label: string; colName: string }>
  blankByField: Record<string, number[]>   // field label → row numbers (1-based)
}
type RowData = Record<OutputCol, string> & { _poddTs: number; _sizePairs: Array<{ size: string; qty: number }>; _labelType: string }
type FontSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl'
type FontWeight = 'normal' | 'semibold' | 'bold'
type TextAlign = 'left' | 'center' | 'right'

interface CardField {
  id: string
  columnKey: string
  staticText?: string
  label?: string
  showLabel: boolean
  fontSize: FontSize
  fontWeight: FontWeight
  textAlign: TextAlign
  italic: boolean
  prefix: string
  suffix: string
}

type BarcodePosition = 'top' | 'bottom' | 'left' | 'right'

interface CardDesign {
  fields: CardField[]
  cardWidthMm: number
  cardHeightMm: number
  paddingMm: number
  bgColor: string
  borderColor: string
  borderWidthPx: number
  fontFamily: string
  showIndex: boolean
  showPageNumbers: boolean
  showBarcode: boolean
  barcodeType: 'barcode' | 'qr'
  barcodeHeightMm: number
  barcodePosition?: BarcodePosition
  barcodeScale?: number
  layoutStyle: LayoutStyle
  sizeGridRowGapPx?: number
  sizeGridFontSizePx?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE_COLS = [
  '1', '1,5', '2', '2,5', '3', '3,5', '4', '4,5', '5', '5,5',
  '6', '6,5', '7', '7,5', '8', '8,5', '9', '9,5', '10', '10,5',
  '11', '11,5', '12', '12,5', '13', '13,5', '14', '14,5', '15', '16', '17', '18',
]

const SIZE_COL_LOOKUP: Record<string, string> = {}
SIZE_COLS.forEach((c) => {
  SIZE_COL_LOOKUP[c] = c
  const withPeriod = c.replace(',', '.')
  SIZE_COL_LOOKUP[withPeriod] = c
  const num = parseFloat(withPeriod)
  if (!isNaN(num)) {
    SIZE_COL_LOOKUP[String(num)] = c
    if (Number.isInteger(num)) SIZE_COL_LOOKUP[num.toFixed(1)] = c
  }
})

const OUTPUT_COLUMNS = [
  'FTY SAP#',
  'Order Number (GTN)',
  'Article Number',
  'Model Name',
  'PODD',
  'Released Date',
  'TOTAL QTY',
  'Ship to Country',
  'Sizes',
] as const

type OutputCol = (typeof OUTPUT_COLUMNS)[number]

// ─── Column name config ───────────────────────────────────────────────────────

interface ColumnConfig {
  ftySap: string
  orderNumber: string
  articleNumber: string
  modelName: string
  podd: string
  releasedDate: string
  totalQty: string
  shipToCountry: string
}

const DEFAULT_COLUMN_CONFIG: ColumnConfig = {
  ftySap:        'FTY SAP#',
  orderNumber:   'Order Number (GTN)',
  articleNumber: 'Article Number',
  modelName:     'Model Name',
  podd:          'PODD',
  releasedDate:  '接单日-Released date',
  totalQty:      'TOTAL QTY',
  shipToCountry: 'Ship to Country',
}

const COLUMN_CONFIG_FIELDS: Array<{ key: keyof ColumnConfig; label: string; hint: string }> = [
  { key: 'ftySap',        label: 'FTY SAP#',              hint: 'Exact column header for the factory SAP number' },
  { key: 'orderNumber',   label: 'Order Number (GTN)',     hint: 'Exact column header for the order / GTN number' },
  { key: 'articleNumber', label: 'Article Number',         hint: 'Exact column header for the article number' },
  { key: 'modelName',     label: 'Model Name',             hint: 'Exact column header for the model / product name' },
  { key: 'podd',          label: 'PODD',                   hint: 'Exact column header for the Promise-of-Delivery Date' },
  { key: 'releasedDate',  label: 'Released Date',          hint: 'Exact column header for the release date' },
  { key: 'totalQty',      label: 'TOTAL QTY',              hint: 'Exact column header for the total quantity' },
  { key: 'shipToCountry', label: 'Ship to Country',        hint: 'Exact column header for the destination country' },
]

const FONT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Ubuntu Mono',     value: '"Ubuntu Mono", monospace' },
  { label: 'JetBrains Mono',  value: '"JetBrains Mono", monospace' },
  { label: 'Roboto Mono',     value: '"Roboto Mono", monospace' },
  { label: 'Source Code Pro', value: '"Source Code Pro", monospace' },
  { label: 'Courier New',     value: '"Courier New", monospace' },
]

const FONT_SIZE_PX: Record<FontSize, number> = {
  xs: 10, sm: 12, base: 14, lg: 16, xl: 18, '2xl': 22, '3xl': 28,
}

// ─── Default design ───────────────────────────────────────────────────────────

const DEFAULT_DESIGN: CardDesign = {
  fields: [
    { id: 'sg0',            columnKey: 'Model Name',         showLabel: false, label: '',      fontSize: 'base', fontWeight: 'bold',   textAlign: 'left', italic: false, prefix: '',       suffix: '' },
    { id: 'sg1',            columnKey: 'FTY SAP#',           showLabel: false, label: 'SAP',   fontSize: '2xl',  fontWeight: 'bold',   textAlign: 'left', italic: false, prefix: '',       suffix: '' },
    { id: 'sg2',            columnKey: 'Order Number (GTN)', showLabel: false, label: 'GTN',   fontSize: 'lg',   fontWeight: 'bold',   textAlign: 'left', italic: false, prefix: '',       suffix: '' },
    { id: 'sg3',            columnKey: 'Released Date',      showLabel: false, label: '',      fontSize: 'xs',   fontWeight: 'normal', textAlign: 'left', italic: false, prefix: 'Rls: ', suffix: '' },
    { id: 'f-sbqr-podd',    columnKey: 'PODD',               showLabel: false, label: '',      fontSize: 'sm',   fontWeight: 'normal', textAlign: 'left', italic: false, prefix: 'PODD ', suffix: '' },
    { id: 'f-sbqr-country', columnKey: 'Ship to Country',    showLabel: false, label: '',      fontSize: 'sm',   fontWeight: 'bold',   textAlign: 'left', italic: false, prefix: 'To: ',  suffix: '' },
    { id: 'f-sbqr-sizes',   columnKey: 'Sizes',              showLabel: false, label: '',      fontSize: 'sm',   fontWeight: 'normal', textAlign: 'left', italic: false, prefix: 'Ttl sizes: ', suffix: '' },
    { id: 'f-sbqr-art',     columnKey: 'Article Number',     showLabel: false, label: '',      fontSize: 'sm',   fontWeight: 'bold',   textAlign: 'left', italic: false, prefix: 'ART:',  suffix: '' },
  ],
  cardWidthMm: 90,
  cardHeightMm: 90,
  paddingMm: 4,
  bgColor: '#ffffff',
  borderColor: '#cccccc',
  borderWidthPx: 1,
  fontFamily: '"Ubuntu Mono", monospace',
  sizeGridRowGapPx: 20,
  sizeGridFontSizePx: 8,
  showIndex: true,
  showPageNumbers: true,
  showBarcode: true,
  barcodeType: 'qr',
  barcodeHeightMm: 30,
  barcodePosition: 'right',
  barcodeScale: 1.15,
  layoutStyle: 'size-grid',
}

const DEFAULT_SORT: SortRule[] = [
  { key: 'PODD',      dir: 'asc' },
  { key: 'TOTAL QTY', dir: 'desc' },
]

// ─── i18n ─────────────────────────────────────────────────────────────────────

type Lang = 'en' | 'id'

const TRANSLATIONS = {
  en: {
    subtitle:           'Order summary → Size label cards → PDF export',
    startOver:          'Start over',
    stepUpload:         'Upload',
    stepData:           'Data',
    stepDesign:         'Design & Export',
    dropHere:           'Drop it here!',
    uploadTitle:        'Upload the order summary Excel file',
    uploadHint:         'Drag & drop or click to browse · .xlsx, .xls, .ods, .csv',
    uploadReads:        'Reads: FTY SAP# · Order Number (GTN) · Article Number · Model Name · PODD · TOTAL QTY · Ship to Country · sizes',
    configureColumns:   'Configure column names',
    colNamesCustomised: 'Column names: customised',
    colConfigTitle:     'Column Names Configuration',
    colConfigDesc:      'Map each output field to the exact column header in your file. Leave unchanged to use the default.',
    customised:         'customised',
    resetAllDefaults:   'Reset all to defaults',
    cancel:             'Cancel',
    apply:              'Apply',
    rowsLabel:          'rows',
    resetSort:          'Reset sort',
    designCard:         'Design Card →',
    sortOrder:          'Sort Order',
    addRule:            'Add rule',
    noSortRules:        'No sort rules — rows appear in file order.',
    missingColTitle1:   '1 required column was not found in the file.',
    missingColDescPre:  'These columns are missing, so their data will be empty on every row. Check that the column names in your file match the configured names, or update them via',
    blankTitle:         'Some rows have empty fields.',
    blankDesc:          'The following fields are blank in one or more rows. These rows will still appear on the labels but the missing values will be empty.',
    cardDesigner:       'Card Designer',
    cardsLabel:         'cards',
    backToData:         '← Back to data',
    resetDefaults:      'Reset to defaults',
    exportIndex:        'Export Index',
    exportPDF:          'Export PDF',
    preparing:          'Preparing…',
    livePreview:        'Live Preview',
    searchSAP:          'Search FTY SAP#…',
    cardSettings:       'Card Settings',
    fontFamilyLabel:    'Font Family',
    resetTo50:          'Reset to 50%',
    pdfScaleHint:       'Scales card size in the exported PDF — useful to fit more cards per page or make larger prints.',
    resetTo05:          'Reset to 0.5',
    cardGapHint:        'Space between cards in the exported PDF.',
    resetTo20:          'Reset to 20',
    sizeRowSpacingHint: 'Vertical gap between wrapped rows in the size breakdown grid.',
    resetTo8:           'Reset to 8',
    sizeFontSizeHint:   'Font size of the size/quantity entries in the size breakdown grid.',
    preparingPDF:       'Preparing PDF…',
    toastBadFile:       'Please upload an Excel file (.xlsx, .xls, .ods, or .csv)',
    toastNoSheets:      'Workbook has no sheets.',
    toastEmptySheet:    'The sheet appears to be empty.',
    toastFailed:        'Failed to parse the file.',
    noSizeData:         'No size data',
    indexTitle:         'SAP# Lookup Index',
    indexTotalCards:    'cards · sorted by FTY SAP#',
    indexColTotal:      'Total Qty',
    gridFlowLabel:      'Card Flow Direction',
    gridFlowRow:        'Horizontal (left → right, top to bottom)',
    gridFlowColumn:     'Vertical (top → bottom, left to right)',
  },
  id: {
    subtitle:           'Data order → Kartu label ukuran → Cetak PDF',
    startOver:          'Mulai ulang',
    stepUpload:         'Upload',
    stepData:           'Data',
    stepDesign:         'Desain & Cetak',
    dropHere:           'Lepas aja di sini!',
    uploadTitle:        'Drop file Excel order kamu ke sini',
    uploadHint:         'Drag & drop atau klik buat milih file · .xlsx, .xls, .ods, .csv',
    uploadReads:        'Yang dibaca: FTY SAP# · No. Order (GTN) · No. Artikel · Nama Model · PODD · TOTAL QTY · Negara Tujuan · ukuran',
    configureColumns:   'Sesuaiin nama kolom',
    colNamesCustomised: 'Nama kolom: udah diubah',
    colConfigTitle:     'Sesuaiin Nama Kolom',
    colConfigDesc:      'Cocokin nama kolom sama header di file lo. Skip aja kalau udah bener.',
    customised:         'udah diubah',
    resetAllDefaults:   'Kembaliin semua ke awal',
    cancel:             'Batalin',
    apply:              'Yep, simpan',
    rowsLabel:          'baris',
    resetSort:          'Reset urutan',
    designCard:         'Desain Kartu →',
    sortOrder:          'Urutan Data',
    addRule:            'Tambah rule',
    noSortRules:        'Belum ada rule urutan — data muncul sesuai urutan di file.',
    missingColTitle1:   '1 kolom wajib nggak ketemu nih.',
    missingColDescPre:  'Kolom-kolom ini absen, jadi datanya kosong melompong di semua baris. Cek lagi nama kolomnya atau ubah via',
    blankTitle:         'Ada baris yang kosong, bestie.',
    blankDesc:          'Field di bawah ini kosong di beberapa baris. Tenang, barisnya tetap muncul di label — tapi nilainya ya kosong.',
    cardDesigner:       'Desain Kartu',
    cardsLabel:         'kartu',
    backToData:         '← Balik ke data',
    resetDefaults:      'Kembaliin ke awal',
    exportIndex:        'Cetak Indeks',
    exportPDF:          'Cetak PDF',
    preparing:          'Bentar ya…',
    livePreview:        'Lihat Langsung',
    searchSAP:          'Cari FTY SAP#…',
    cardSettings:       'Setting Kartu',
    fontFamilyLabel:    'Font',
    resetTo50:          'Balik ke 50%',
    pdfScaleHint:       'Atur gede-kecilnya kartu di PDF — makin kecil = makin banyak kartu per halaman, makin gede = makin gampang dibaca.',
    resetTo05:          'Balik ke 0.5',
    cardGapHint:        'Jarak antar kartu di PDF-nya.',
    resetTo20:          'Balik ke 20',
    sizeRowSpacingHint: 'Jarak antar baris di grid ukuran.',
    resetTo8:           'Balik ke 8',
    sizeFontSizeHint:   'Ukuran teks di grid ukuran.',
    preparingPDF:       'Lagi bikin PDF nih…',
    toastBadFile:       'File-nya harus Excel ya (.xlsx, .xls, .ods, atau .csv)',
    toastNoSheets:      'Eh, workbook-nya kosong tuh.',
    toastEmptySheet:    'Sheet-nya kayak kosong deh.',
    toastFailed:        'Gagal baca file-nya, coba lagi.',
    noSizeData:         'Data ukuran kosong',
    indexTitle:         'Daftar SAP# buat nyari',
    indexTotalCards:    'kartu · urut by FTY SAP#',
    indexColTotal:      'Total Qty',
    gridFlowLabel:      'Arah Aliran Kartu',
    gridFlowRow:        'Horizontal (kiri → kanan, atas ke bawah)',
    gridFlowColumn:     'Vertikal (atas → bawah, kiri ke kanan)',
  },
} as const

type TranslationKey = keyof typeof TRANSLATIONS.en

// Indonesian column config hints
const COLUMN_HINTS_ID: Record<keyof ColumnConfig, string> = {
  ftySap:        'Nama header kolom SAP pabrik di file lo',
  orderNumber:   'Nama header kolom nomor order / GTN',
  articleNumber: 'Nama header kolom nomor artikel',
  modelName:     'Nama header kolom nama model / produk',
  podd:          'Nama header kolom tanggal janji kirim (PODD)',
  releasedDate:  'Nama header kolom tanggal rilis',
  totalQty:      'Nama header kolom total jumlah',
  shipToCountry: 'Nama header kolom negara tujuan',
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseDateValue(v: unknown): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v
  if (typeof v === 'number' && v > 0)
    return new Date(Math.round((v - 25569) * 86400 * 1000))
  if (typeof v === 'string' && v.trim()) {
    const d = new Date(v.trim())
    if (!isNaN(d.getTime())) return d
  }
  return null
}

function formatPoddDate(v: unknown): string {
  const d = parseDateValue(v)
  if (!d) return String(v ?? '').trim()
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatShortDate(v: unknown): string {
  const d = parseDateValue(v)
  if (!d) return String(v ?? '').trim()
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// ─── Row transformer ──────────────────────────────────────────────────────────

function transformRow(raw: Record<string, unknown>, cfg: ColumnConfig): RowData {
  const norm: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw)) {
    const trimmed = k.trim()
    norm[trimmed] = v
    const canonical = SIZE_COL_LOOKUP[trimmed]
    if (canonical && !(canonical in norm)) norm[canonical] = v
  }

  let sizeCount = 0
  const sizePairs: Array<{ size: string; qty: number }> = []
  for (const col of SIZE_COLS) {
    const v = norm[col]
    if (v === '' || v == null) continue
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'))
    if (!isNaN(n) && n > 0) { sizeCount++; sizePairs.push({ size: col, qty: n }) }
  }

  const str = (col: string) => String(norm[col] ?? '').trim()
  const poddRaw = norm[cfg.podd]
  const poddDate = formatPoddDate(poddRaw)
  const poddTs = parseDateValue(poddRaw)?.getTime() ?? 0
  const qty = str(cfg.totalQty)
  const releasedRaw = norm[cfg.releasedDate]
  const releasedDate = formatShortDate(releasedRaw)

  const labelTypeKey = Object.keys(norm).find(k => k.toLowerCase().includes('standard size label')) ?? ''
  const labelTypeRaw = String(norm[labelTypeKey] ?? '').trim().toUpperCase()

  return {
    'FTY SAP#':           str(cfg.ftySap),
    'Order Number (GTN)': str(cfg.orderNumber),
    'Article Number':     str(cfg.articleNumber),
    'Model Name':         str(cfg.modelName),
    'PODD':               poddDate || '',
    'Released Date':      releasedDate || '',
    _poddTs:              poddTs,
    'TOTAL QTY':          qty || '',
    'Ship to Country':    str(cfg.shipToCountry),
    'Sizes':              sizeCount > 0 ? String(sizeCount) : '',
    _sizePairs:           sizePairs,
    _labelType:           labelTypeRaw,
  }
}

// ─── SizeGrid ─────────────────────────────────────────────────────────────────

function SizeGrid({ pairs, fontFamily, scale = 1, rowGapPx = 7, fontSizePx = 8, lang = 'en' }: {
  pairs: Array<{ size: string; qty: number }>
  fontFamily: string
  scale?: number
  rowGapPx?: number
  fontSizePx?: number
  lang?: Lang
}) {
  if (!pairs.length) return (
    <div style={{ fontSize: `${(fontSizePx + 1) * scale}px`, color: '#9ca3af', fontFamily, fontStyle: 'italic', flexShrink: 0 }}>{TRANSLATIONS[lang].noSizeData}</div>
  )
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${rowGapPx * scale}px ${4 * scale}px`, flexShrink: 0, fontFamily }}>
      {pairs.map(({ size, qty }) => (
        <span key={size} style={{
          fontSize: `${fontSizePx * scale}px`,
          lineHeight: '1.2',
          whiteSpace: 'nowrap',
          color: '#111827',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: `${Math.max(0.5, 0.5 * scale)}px solid #374151`,
          borderRadius: `${2 * scale}px`,
          padding: `${1 * scale}px ${3 * scale}px`,
        }}>
          <span style={{ color: '#6b7280', fontSize: `${(fontSizePx - 1) * scale}px` }}>{size}</span>
          <span style={{ fontWeight: 'bold' }}>{qty}</span>
        </span>
      ))}
    </div>
  )
}

// ─── CodeField ────────────────────────────────────────────────────────────────

function CodeField({ value, type, heightMm, scale = 1.0, rotate = false }: {
  value: string
  type: 'barcode' | 'qr'
  heightMm: number
  scale?: number
  rotate?: boolean
}) {
  const svgRef  = useRef<SVGSVGElement>(null)
  const scaledH = heightMm * scale
  const [qrSvg, setQrSvg] = useState<string>('')

  useEffect(() => {
    if (type !== 'barcode' || !svgRef.current || !value) return
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        displayValue: false,
        margin: 0,
        height: Math.round(scaledH * 3.78),
        width: Math.max(0.5, 1.2 * scale),
      })
    } catch {
      if (svgRef.current) svgRef.current.innerHTML = ''
    }
  }, [value, scaledH, scale, type])

  useEffect(() => {
    if (type !== 'qr' || !value) return
    const pxSize = Math.round(scaledH * 3.78)
    QRCode.toString(value, { type: 'svg', margin: 1, width: pxSize })
      .then(svg => setQrSvg(svg))
      .catch(() => {})
  }, [value, scaledH, type])

  if (!value) return null

  if (type === 'qr') {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: qrSvg }}
        style={{ width: `${scaledH}mm`, height: `${scaledH}mm`, flexShrink: 0 }}
      />
    )
  }

  if (rotate) {
    return (
      <div style={{
        width: `${scaledH}mm`,
        alignSelf: 'stretch',
        flexShrink: 0,
        overflow: 'hidden',
        position: 'relative',
      }}>
        <svg ref={svgRef} style={{
          position: 'absolute',
          height: `${scaledH}mm`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(90deg)',
        }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
      <svg ref={svgRef} style={{ maxWidth: '100%', height: `${scaledH}mm` }} />
    </div>
  )
}

// ─── QtyClassBox ──────────────────────────────────────────────────────────────

function getQtyClass(qty: number): string {
  if (qty < 100)   return 'XS'
  if (qty < 500)   return 'S'
  if (qty < 1500)  return 'M'
  if (qty < 4500)  return 'L'
  if (qty < 10000) return 'XL'
  return 'XXL'
}

function QtyClassBox({ qty, heightMm, scale = 1, fontFamily, isSA = false }: {
  qty: number
  heightMm: number
  scale?: number
  fontFamily: string
  isSA?: boolean
}) {
  const cls = getQtyClass(qty)
  const clsFontSize = cls.length >= 3 ? 36 : cls.length === 2 ? 46 : 58
  const boxSize = `${heightMm * scale}mm`
  return (
    <div style={{
      width: boxSize,
      height: boxSize,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      border: `${Math.max(1, 1.5 * scale)}px solid #111827`,
      background: isSA ? '#111827' : 'transparent',
      boxSizing: 'border-box',
      flexShrink: 0,
      fontFamily,
      WebkitPrintColorAdjust: 'exact',
      printColorAdjust: 'exact',
      position: 'relative',
    } as React.CSSProperties}>
      {isSA && (
        <span style={{
          position: 'absolute',
          top: `${2 * scale}px`,
          left: `${3 * scale}px`,
          fontSize: `${7 * scale}px`,
          fontWeight: 'bold',
          color: '#ffffff',
          letterSpacing: '0.05em',
          lineHeight: 1,
          fontFamily: '"Ubuntu Mono", monospace',
        }}>ZA</span>
      )}
      <span style={{
        fontSize: `${clsFontSize * scale}px`,
        fontWeight: 900,
        fontFamily: '"Archivo Black", "Arial Black", sans-serif',
        lineHeight: 1,
        color: isSA ? '#ffffff' : '#111827',
        letterSpacing: '-0.02em',
      }}>{cls}</span>
      <span style={{
        fontSize: `${8 * scale}px`,
        fontWeight: 'bold',
        color: isSA ? '#d1d5db' : '#6b7280',
        lineHeight: 1.3,
        marginTop: `${3 * scale}px`,
        fontFamily: '"Ubuntu Mono", monospace',
        textAlign: 'center',
        letterSpacing: '0.04em',
      }}>QTY (pairs)</span>
      <span style={{
        fontSize: `${15 * scale}px`,
        fontWeight: 900,
        color: isSA ? '#ffffff' : '#111827',
        lineHeight: 1.2,
        fontFamily: '"Ubuntu Mono", monospace',
        textAlign: 'center',
      }}>{qty.toLocaleString('de-DE')}</span>
    </div>
  )
}

// ─── CardPreview ──────────────────────────────────────────────────────────────

interface CardPreviewProps {
  design: CardDesign
  row: Record<string, unknown>
  index?: number
  total?: number
  forPrint?: boolean
  printScale?: number
  lang?: Lang
}

function CardPreview({ design, row, index, total, forPrint = false, printScale, lang = 'en' }: CardPreviewProps) {
  const s = (forPrint && printScale != null) ? printScale : 1
  const layoutStyle = design.layoutStyle ?? 'vertical'
  const barcodePos: BarcodePosition =
    design.barcodePosition ?? (layoutStyle === 'side-code-right' ? 'right' : 'bottom')
  const isSide = barcodePos === 'left' || barcodePos === 'right'
  const gap = `${(forPrint ? 1 : 2) * s}px`

  const fieldsContent = design.fields.map((field) => {
    const raw = field.columnKey === '__static__'
      ? (field.staticText ?? '')
      : String(row[field.columnKey] ?? '')
    const value = field.prefix + raw + field.suffix
    const text  = field.showLabel && field.label ? `${field.label}: ${value}` : value

    let content: React.ReactNode = text
    if (field.columnKey === 'FTY SAP#' && raw.length >= 3) {
      const underlineIdx = text.length - raw.length + (raw.length - 3)
      content = (
        <>
          {text.slice(0, underlineIdx)}
          <span style={{ textDecoration: 'underline', textUnderlineOffset: `${2 * s}px` }}>
            {text[underlineIdx]}
          </span>
          {text.slice(underlineIdx + 1)}
        </>
      )
    }

    return (
      <div
        key={field.id}
        style={{
          fontSize:   `${FONT_SIZE_PX[field.fontSize] * s}px`,
          fontWeight: field.fontWeight,
          fontStyle:  field.italic ? 'italic' : 'normal',
          textAlign:  field.textAlign,
          lineHeight: '1.3',
          flexShrink: 0,
        }}
      >
        {content}
      </div>
    )
  })

  const isQrType = (design.barcodeType ?? 'barcode') === 'qr'
  const sapValue = String(row['FTY SAP#'] ?? '')
  const gtnValue = String(row['Order Number (GTN)'] ?? '')
  const isSA = gtnValue.startsWith('450')
  const totalQtyNum = parseInt(String(row['TOTAL QTY'] ?? '').replace(/[^\d]/g, ''), 10) || 0

  const LONG_LABEL_COUNTRIES = ['CHILE', 'COLOMBIA', 'MEXICO', 'PERU', 'PANAMA', 'PARAGUAY', 'URUGUAY']
  const shipToCountry = String(row['Ship to Country'] ?? '').toUpperCase().trim()
  const labelText = shipToCountry
    ? (LONG_LABEL_COUNTRIES.some(c => shipToCountry.includes(c)) ? 'LONG LABEL' : 'SHORT LABEL')
    : ''

  const codeEl = design.showBarcode ? (
    isQrType ? (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: `${2 * s}px` }}>
        <QtyClassBox
          qty={totalQtyNum}
          heightMm={design.barcodeHeightMm * (design.barcodeScale ?? 1.0)}
          scale={s}
          fontFamily={design.fontFamily}
          isSA={isSA}
        />
        {labelText && (
          <span style={{
            fontSize: `${10 * s}px`,
            fontWeight: 'bold',
            fontFamily: '"Ubuntu Mono", monospace',
            color: isSA ? '#ffffff' : '#111827',
            letterSpacing: '0.12em',
            lineHeight: 1.2,
            WebkitPrintColorAdjust: 'exact',
            printColorAdjust: 'exact',
          } as React.CSSProperties}>{labelText}</span>
        )}
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: `${1 * s}px` }}>
        <CodeField
          value={sapValue}
          type='barcode'
          heightMm={design.barcodeHeightMm}
          scale={(design.barcodeScale ?? 1.0) * s}
          rotate={isSide}
        />
      </div>
    )
  ) : null

  const sizeGridEl = layoutStyle === 'size-grid' ? (
    <div style={{ flexShrink: 0 }}>
      <hr style={{ border: 'none', borderTop: `${Math.max(0.5, 0.5 * s)}px solid #d1d5db`, margin: `${2 * s}px 0` }} />
      <SizeGrid
        pairs={(row._sizePairs as Array<{ size: string; qty: number }> | undefined) ?? []}
        fontFamily={design.fontFamily}
        scale={s}
        rowGapPx={design.sizeGridRowGapPx ?? 7}
        fontSizePx={design.sizeGridFontSizePx ?? 8}
        lang={lang}
      />
    </div>
  ) : null

  const codeColumn = isSide && design.showBarcode ? codeEl : null

  const lastThreeFirst = sapValue.slice(-3)[0] ?? ''
  const stripeCount = /\d/.test(lastThreeFirst) ? parseInt(lastThreeFirst, 10) : 0

  return (
    <div
      style={{
        width: `${design.cardWidthMm * s}mm`,
        height: `${design.cardHeightMm * s}mm`,
        padding: `${design.paddingMm * s}mm`,
        background: design.bgColor,
        color: '#111827',
        border: `${design.borderWidthPx}px solid ${design.borderColor}`,
        fontFamily: design.fontFamily,
        boxSizing: 'border-box',
        overflow: 'hidden',
        breakInside: 'avoid',
        position: 'relative',
      }}
    >
      {index != null && (
        <div style={{
          position: 'absolute', top: `${2 * s}px`, right: `${3 * s}px`,
          fontSize: `${8 * s}px`, lineHeight: '1', color: '#9ca3af',
          fontFamily: '"Ubuntu Mono", monospace',
          zIndex: 1,
        }}>
          {index}{total != null ? `/${total}` : ''}
        </div>
      )}

      {stripeCount > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${5 * s}px`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: `${5 * s}px`,
          zIndex: 2, pointerEvents: 'none',
        }}>
          {Array.from({ length: stripeCount }, (_, i) => (
            <div key={i} style={{
              height: `${12 * s}px`,
              background: '#374151',
              borderRadius: `0 ${2 * s}px ${2 * s}px 0`,
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            } as React.CSSProperties} />
          ))}
        </div>
      )}

      {isSide && design.showBarcode ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap }}>
          <div style={{ display: 'flex', gap: `${3 * s}mm` }}>
            {barcodePos === 'left' && codeColumn}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap }}>
              {fieldsContent}
            </div>
            {barcodePos === 'right' && codeColumn}
          </div>
          {sizeGridEl}
        </div>

      ) : layoutStyle === 'size-grid' ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap }}>
          {barcodePos === 'top' && codeEl}
          {fieldsContent}
          {sizeGridEl}
          {barcodePos !== 'top' && codeEl}
        </div>

      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap }}>
          {barcodePos === 'top' && codeEl}
          {fieldsContent}
          {barcodePos !== 'top' && codeEl}
        </div>
      )}
    </div>
  )
}

// ─── PrintArea ────────────────────────────────────────────────────────────────

interface PrintAreaProps {
  design: CardDesign
  rows: RowData[]
  pdfScale: number
  cardGapMm: number
  mode: 'cards' | 'index'
  gridFlow?: GridFlow
  lang?: Lang
}

function PrintArea({ design, rows, pdfScale, cardGapMm, mode, gridFlow = 'row', lang = 'en' }: PrintAreaProps) {
  const effectiveW = design.cardWidthMm * pdfScale
  const effectiveH = design.cardHeightMm * pdfScale
  const perRow  = Math.max(1, Math.floor((287 + cardGapMm) / (effectiveW + cardGapMm)))
  const perCol  = Math.max(1, Math.floor((200 + cardGapMm) / (effectiveH + cardGapMm)))
  const perPage = perRow * perCol
  const total   = rows.length

  const pages: RowData[][] = []
  for (let i = 0; i < rows.length; i += perPage) pages.push(rows.slice(i, i + perPage))

  const indexRows = [...rows]
    .map((row, i) => ({ row, cardIndex: i + 1 }))
    .sort((a, b) => a.row['FTY SAP#'].localeCompare(b.row['FTY SAP#']))

  return (
    <div id="slcm-print-area" style={{ gap: `${cardGapMm}mm` }}>
      {mode === 'cards' && pages.map((pageRows, pageIdx) => (
        <div key={pageIdx} style={{ display: 'contents' }}>
          {pageRows.map((row, j) => {
            const globalIdx = pageIdx * perPage + j
            // In column flow, mark the first card of every new column (every perCol cards)
            // as a column start so we can optionally style/break
            return (
              <CardPreview
                key={globalIdx}
                design={design}
                row={row}
                index={globalIdx + 1}
                total={total}
                forPrint
                printScale={pdfScale}
                lang={lang}
              />
            )
          })}
          <div className="slcm-page-number">Page {pageIdx + 1} of {pages.length}</div>
          <div className="slcm-page-break" />
        </div>
      ))}

      {mode === 'index' && (
        <div className="slcm-index-page">
          <div style={{ marginBottom: '4mm', paddingBottom: '2mm', borderBottom: '2px solid #111827', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'system-ui, sans-serif' }}>{TRANSLATIONS[lang].indexTitle}</span>
            <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'system-ui, sans-serif' }}>{rows.length} {TRANSLATIONS[lang].indexTotalCards}</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'system-ui, sans-serif', border: '1.5px solid #374151' }}>
            <thead>
              <tr style={{ background: '#e5e7eb' }}>
                {(['#', 'FTY SAP#', lang === 'id' ? 'Nomor Order (GTN)' : 'Order Number (GTN)', TRANSLATIONS[lang].indexColTotal] as string[]).map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '1.5mm 2.5mm', fontSize: '9px', color: '#111827', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', border: '1px solid #9ca3af' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {indexRows.map(({ row, cardIndex }, i) => (
                <tr key={cardIndex} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ padding: '1.5mm 2.5mm', fontWeight: 'bold', color: '#6b7280', fontSize: '10px', whiteSpace: 'nowrap', border: '1px solid #d1d5db' }}>#{cardIndex}</td>
                  <td style={{ padding: '1.5mm 2.5mm', fontWeight: 'bold', color: '#111827', fontSize: '11px', whiteSpace: 'nowrap', fontFamily: '"Ubuntu Mono", monospace', border: '1px solid #d1d5db' }}>{row['FTY SAP#']}</td>
                  <td style={{ padding: '1.5mm 2.5mm', color: '#374151', fontSize: '11px', whiteSpace: 'nowrap', fontFamily: '"Ubuntu Mono", monospace', border: '1px solid #d1d5db' }}>{row['Order Number (GTN)']}</td>
                  <td style={{ padding: '1.5mm 2.5mm', color: '#111827', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', border: '1px solid #d1d5db' }}>{row['TOTAL QTY']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep]             = useState<Step>('upload')
  const [fileName, setFileName]     = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])


  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('slcm-dark-mode')
      if (saved !== null) return saved === 'true'
    } catch { /* ignore */ }
    return true
  })

  useEffect(() => {
    try { localStorage.setItem('slcm-dark-mode', String(darkMode)) } catch { /* ignore */ }
  }, [darkMode])

  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('slcm-lang')
      if (saved === 'en' || saved === 'id') return saved as Lang
    } catch { /* ignore */ }
    return 'en'
  })

  useEffect(() => {
    try { localStorage.setItem('slcm-lang', lang) } catch { /* ignore */ }
  }, [lang])

  const t = (key: TranslationKey): string => TRANSLATIONS[lang][key]

  // Dynamic translation helpers
  const tMissingColN   = (n: number) => lang === 'id' ? `${n} kolom wajib nggak ketemu nih.` : `${n} required columns were not found in the file.`
  const tLookingFor    = (col: string) => lang === 'id' ? `(lagi nyari: "${col}")` : `(looking for: "${col}")`
  const tRowCount      = (n: number) => lang === 'id' ? (n === 1 ? '1 baris' : `${n} baris`) : (n === 1 ? '1 row' : `${n} rows`)
  const tAndMore       = (n: number) => lang === 'id' ? `… plus ${n} lainnya` : `… and ${n} more`
  const tShowing100    = (n: number) => lang === 'id' ? `Nampil 100 teratas dari ${n} baris` : `Showing first 100 of ${n} rows`
  const tScale         = (n: number) => lang === 'id' ? `skala ${n}%` : `${n}% scale`
  const tPdfScaleLabel = (n: number) => lang === 'id' ? `Skala PDF — ${n}%` : `PDF Scale — ${n}%`
  const tCardGapLabel  = (n: number) => lang === 'id' ? `Jarak Kartu — ${n} mm` : `Card Gap — ${n} mm`
  const tSizeSpacing   = (n: number) => lang === 'id' ? `Spasi Baris Grid Ukuran — ${n} px` : `Size Breakdown Row Spacing — ${n} px`
  const tSizeFontSz    = (n: number) => lang === 'id' ? `Ukuran Teks Grid Ukuran — ${n} px` : `Size Breakdown Font Size — ${n} px`
  const tRendering     = (n: number) => lang === 'id' ? `Nyiapin ${n} kartu` : `Rendering ${n} cards`
  const tLoaded        = (name: string, n: number) => lang === 'id' ? `"${name}" ke-load — ${n} baris 🎉` : `Loaded "${name}" — ${n} rows`

  const [rows, setRows]             = useState<RowData[]>([])
  const [sortRules, setSortRules]   = useState<SortRule[]>(DEFAULT_SORT)
  const [isPrinting, setIsPrinting]       = useState(false)
  const [printProgress, setPrintProgress] = useState(0)
  const [printMode, setPrintMode]         = useState<'cards' | 'index'>('cards')

  const [design, setDesign] = useState<CardDesign>(() => {
    try {
      const saved = localStorage.getItem('slcm-design')
      if (saved) return { ...DEFAULT_DESIGN, ...JSON.parse(saved) }
    } catch { /* ignore */ }
    return DEFAULT_DESIGN
  })

  const [pdfScale, setPdfScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('slcm-pdf-scale')
      if (saved) { const n = parseFloat(saved); if (!isNaN(n)) return n }
    } catch { /* ignore */ }
    return 0.5
  })

  const [cardGapMm, setCardGapMm] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('slcm-card-gap')
      if (saved) { const n = parseFloat(saved); if (!isNaN(n)) return n }
    } catch { /* ignore */ }
    return 0.5
  })

  const [gridFlow, setGridFlow] = useState<GridFlow>(() => {
    try {
      const saved = localStorage.getItem('slcm-grid-flow')
      if (saved === 'row' || saved === 'column') return saved as GridFlow
    } catch { /* ignore */ }
    return 'row'
  })

  const [cardSettingsOpen, setCardSettingsOpen] = useState(false)

  // Column config ──────────────────────────────────────────────────────────────
  const [columnConfig, setColumnConfig] = useState<ColumnConfig>(() => {
    try {
      const saved = localStorage.getItem('slcm-col-cfg')
      if (saved) return { ...DEFAULT_COLUMN_CONFIG, ...JSON.parse(saved) }
    } catch { /* ignore */ }
    return DEFAULT_COLUMN_CONFIG
  })
  const columnConfigRef = useRef<ColumnConfig>(columnConfig)
  columnConfigRef.current = columnConfig
  const [columnConfigOpen, setColumnConfigOpen] = useState(false)
  const [columnConfigDraft, setColumnConfigDraft] = useState<ColumnConfig>(DEFAULT_COLUMN_CONFIG)

  // Data issues ────────────────────────────────────────────────────────────────
  const [dataIssues, setDataIssues] = useState<DataIssues>({ missingColumns: [], blankByField: {} })

  // Toast ──────────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; ok: boolean }>>([])
  const toastCnt = useRef(0)
  function showToast(msg: string, ok = true) {
    const id = ++toastCnt.current
    setToasts(t => [...t, { id, msg, ok }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }

  // Sorted rows ────────────────────────────────────────────────────────────────
  const sortedRows = useMemo(() => {
    if (!sortRules.length) return rows
    return [...rows].sort((a, b) => {
      for (const rule of sortRules) {
        let cmp: number
        if (rule.key === 'PODD') {
          cmp = a._poddTs - b._poddTs
        } else {
          cmp = a[rule.key].localeCompare(b[rule.key], undefined, { numeric: true, sensitivity: 'base' })
        }
        if (cmp !== 0) return rule.dir === 'asc' ? cmp : -cmp
      }
      return 0
    })
  }, [rows, sortRules])

  // Persist ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem('slcm-design', JSON.stringify(design)) } catch { /* ignore */ }
  }, [design])
  useEffect(() => {
    try { localStorage.setItem('slcm-pdf-scale', String(pdfScale)) } catch { /* ignore */ }
  }, [pdfScale])
  useEffect(() => {
    try { localStorage.setItem('slcm-card-gap', String(cardGapMm)) } catch { /* ignore */ }
  }, [cardGapMm])
  useEffect(() => {
    try { localStorage.setItem('slcm-grid-flow', gridFlow) } catch { /* ignore */ }
  }, [gridFlow])
  useEffect(() => {
    try { localStorage.setItem('slcm-col-cfg', JSON.stringify(columnConfig)) } catch { /* ignore */ }
  }, [columnConfig])

  // File loading ───────────────────────────────────────────────────────────────
  function loadFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|ods|csv)$/i)) {
      showToast(t('toastBadFile'), false)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = read(e.target?.result, { type: 'array' })
        if (!wb.SheetNames.length) { showToast(t('toastNoSheets'), false); return }
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const raw   = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
        if (!raw.length) { showToast(t('toastEmptySheet'), false); return }

        const cfg = columnConfigRef.current

        // Detect missing columns ──────────────────────────────────────────────
        const rawHeaders = Object.keys(raw[0]).map(k => k.trim())
        const COLUMN_CHECKS: Array<{ label: string; colName: string }> = [
          { label: 'FTY SAP#',            colName: cfg.ftySap },
          { label: 'Order Number (GTN)',   colName: cfg.orderNumber },
          { label: 'Article Number',       colName: cfg.articleNumber },
          { label: 'Model Name',           colName: cfg.modelName },
          { label: 'PODD',                 colName: cfg.podd },
          { label: 'Released Date',        colName: cfg.releasedDate },
          { label: 'TOTAL QTY',            colName: cfg.totalQty },
          { label: 'Ship to Country',      colName: cfg.shipToCountry },
        ]
        const missingColumns = COLUMN_CHECKS.filter(({ colName }) => !rawHeaders.includes(colName))
        const missingLabels  = new Set(missingColumns.map(c => c.label))

        // Transform rows ──────────────────────────────────────────────────────
        const transformedRows = raw.map(r => transformRow(r, cfg))

        // Detect blank cells (only for columns that were found) ───────────────
        const BLANK_CHECKS = ([
          { key: 'FTY SAP#',            label: 'FTY SAP#' },
          { key: 'Order Number (GTN)',   label: 'Order Number (GTN)' },
          { key: 'Article Number',       label: 'Article Number' },
          { key: 'Model Name',           label: 'Model Name' },
          { key: 'PODD',                 label: 'PODD' },
          { key: 'TOTAL QTY',            label: 'TOTAL QTY' },
          { key: 'Ship to Country',      label: 'Ship to Country' },
        ] as Array<{ key: OutputCol; label: string }>).filter(({ label }) => !missingLabels.has(label))

        const blankByField: Record<string, number[]> = {}
        transformedRows.forEach((row, idx) => {
          BLANK_CHECKS.forEach(({ key, label }) => {
            if (!row[key]) {
              if (!blankByField[label]) blankByField[label] = []
              blankByField[label].push(idx + 1)
            }
          })
        })

        setDataIssues({ missingColumns, blankByField })
        setRows(transformedRows)
        setFileName(file.name)
        setStep('data')
        showToast(tLoaded(file.name, raw.length))
      } catch { showToast(t('toastFailed'), false) }
    }
    reader.readAsArrayBuffer(file as Blob)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files[0]; if (f) loadFile(f)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const handleDragOver  = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  function reset() {
    setStep('upload'); setFileName(''); setRows([])
    setDataIssues({ missingColumns: [], blankByField: {} })
    setDesign(DEFAULT_DESIGN)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Export PDF ─────────────────────────────────────────────────────────────────
  function triggerPrint(mode: 'cards' | 'index', title: string) {
    setPrintMode(mode)
    setIsPrinting(true)
    setPrintProgress(0)
    const total = rows.length
    const stepPct = total > 0 ? 100 / total : 100
    let current = 0
    const interval = setInterval(() => {
      current += stepPct * 3
      if (current >= 95) {
        clearInterval(interval)
        setPrintProgress(95)
        setTimeout(() => {
          setPrintProgress(100)
          setTimeout(() => {
            const prevTitle = document.title
            document.title = title
            window.print()
            document.title = prevTitle
            setIsPrinting(false)
            setPrintProgress(0)
          }, 300)
        }, 200)
      } else {
        setPrintProgress(Math.min(current, 95))
      }
    }, 30)
  }

  function handleExportPDF() {
    const today = new Date()
    const exportDate = `${today.getDate()} ${SHORT_MONTHS[today.getMonth()]} ${today.getFullYear()}`
    const poddMonths = Array.from(new Set(
      sortedRows
        .filter(r => r._poddTs)
        .map(r => { const d = new Date(r._poddTs); return `${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}` })
    )).sort().join(', ')
    triggerPrint('cards', `SLCM Cards · ${sortedRows.length} cards · ${exportDate}${poddMonths ? ` · PODD ${poddMonths}` : ''}`)
  }

  function handleExportIndex() {
    const today = new Date()
    const exportDate = `${today.getDate()} ${SHORT_MONTHS[today.getMonth()]} ${today.getFullYear()}`
    triggerPrint('index', `SLCM Index · ${sortedRows.length} cards · ${exportDate}`)
  }

  // Print styles ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'slcm-print-style'
    if (printMode === 'index') {
      style.textContent = `
        @page { size: A4 portrait; margin: 6mm; }
        @media print {
          body > *:not(#slcm-print-area) { display: none !important; }
          #slcm-print-area { display: block !important; }
        }
        #slcm-print-area { display: none; background: white; }
        .slcm-index-page { width: 100%; box-sizing: border-box; }
      `
    } else if (gridFlow === 'column') {
      style.textContent = `
        @page { size: A4 landscape; margin: 5mm; }
        @media print {
          body > *:not(#slcm-print-area) { display: none !important; }
          #slcm-print-area { display: flex !important; }
        }
        #slcm-print-area {
          display: none; background: white; padding: 0;
          box-sizing: border-box;
          flex-direction: column; flex-wrap: wrap; align-content: flex-start;
          height: 190mm;
        }
        .slcm-page-break { width: 0; height: 100%; flex-basis: 100%; page-break-after: always; break-after: page; }
        .slcm-page-number { display: none; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `
    } else {
      style.textContent = `
        @page { size: A4 landscape; margin: 5mm; }
        @media print {
          body > *:not(#slcm-print-area) { display: none !important; }
          #slcm-print-area { display: flex !important; }
        }
        #slcm-print-area {
          display: none; background: white; padding: 0;
          box-sizing: border-box; flex-wrap: wrap; align-content: flex-start;
        }
        .slcm-page-break { width: 100%; flex-basis: 100%; page-break-after: always; break-after: page; }
        .slcm-page-number { width: 100%; flex-basis: 100%; text-align: center; font-size: 9px; color: #9ca3af; font-family: system-ui, sans-serif; padding: 1mm 0; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      `
    }
    document.getElementById('slcm-print-style')?.remove()
    document.head.appendChild(style)
    return () => { document.getElementById('slcm-print-style')?.remove() }
  }, [printMode, gridFlow])

  // Google Fonts ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = 'slcm-google-fonts'
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = 'https://fonts.googleapis.com/css2?family=Ubuntu+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap'
  }, [])

  // Preview row picker ─────────────────────────────────────────────────────────
  const [previewRowIndex, setPreviewRowIndex] = useState(0)
  useEffect(() => { setPreviewRowIndex(0) }, [rows])

  const previewRow  = sortedRows[Math.min(previewRowIndex, Math.max(0, sortedRows.length - 1))] ?? ({} as RowData)
  const totalCards  = sortedRows.length

  // MUI Theme ──────────────────────────────────────────────────────────────────
  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#4f46e5' },
      success:  { main: '#4f46e5' },
      background: {
        default: darkMode ? '#1a1a1a' : '#f9fafb',
        paper:   darkMode ? '#242424' : '#ffffff',
      },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton:    { styleOverrides: { root: { textTransform: 'none' } } },
      MuiPaper:     { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiTableCell: {
        styleOverrides: {
          head: { backgroundColor: darkMode ? '#2e2e2e' : '#f3f4f6', fontWeight: 600 },
        },
      },
    },
  }), [darkMode])

  // Steps ──────────────────────────────────────────────────────────────────────
  type MuiIconCmp = React.ComponentType<{ sx?: object }>
  const STEPS: { key: Step; label: string; icon: MuiIconCmp }[] = [
    { key: 'upload', label: t('stepUpload'), icon: CloudUploadIcon as MuiIconCmp },
    { key: 'data',   label: t('stepData'),   icon: TableChartIcon  as MuiIconCmp },
    { key: 'design', label: t('stepDesign'), icon: PaletteIcon     as MuiIconCmp },
  ]
  const stepIdx: Record<Step, number> = { upload: 0, data: 1, design: 2 }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{
        '@keyframes blob1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(6vw, 10vh) scale(1.15)' },
          '66%':      { transform: 'translate(-4vw, 6vh) scale(0.9)' },
        },
        '@keyframes blob2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(-8vw, -8vh) scale(0.95)' },
          '66%':      { transform: 'translate(5vw, -4vh) scale(1.1)' },
        },
        '@keyframes blob3': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%':      { transform: 'translate(4vw, -10vh) scale(1.05)' },
          '66%':      { transform: 'translate(-6vw, 8vh) scale(1.2)' },
        },
      }} />

      {/* Toast stack */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 1, pointerEvents: 'none' }}>
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, x: 80, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 80, scale: 0.88 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
              <Alert severity={t.ok ? 'success' : 'error'} variant="filled"
                sx={{ fontWeight: 500, borderRadius: 2, boxShadow: 4 }}>
                {t.msg}
              </Alert>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>

      {/* Print progress overlay */}
      <Backdrop open={isPrinting} sx={{ zIndex: 9998, backdropFilter: 'blur(4px)', bgcolor: 'rgba(0,0,0,0.4)' }}>
        <Paper elevation={10} sx={{ px: 5, py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 280, borderRadius: 4 }}>
          <PrintIcon sx={{ fontSize: 36, color: 'success.main' }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 600 }}>{t('preparingPDF')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary',  mt: 0.5 }}>{tRendering(rows.length)}</Typography>
          </Box>
          <LinearProgress variant="determinate" value={printProgress} color="success"
            sx={{ width: '100%', height: 10, borderRadius: 99 }} />
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>{Math.round(printProgress)}%</Typography>
        </Paper>
      </Backdrop>

      {/* Hidden print area */}
      {typeof document !== 'undefined' &&
  createPortal(
    <PrintArea
      design={design}
      rows={sortedRows}
      pdfScale={pdfScale}
      cardGapMm={cardGapMm}
      mode={printMode}
      gridFlow={gridFlow}
      lang={lang}
    />,
    document.body,
  )}

      {/* Column name config dialog */}
      <Dialog open={columnConfigOpen} onClose={() => setColumnConfigOpen(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ pb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TuneIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('colConfigTitle')}</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, fontWeight: 400 }}>
            {t('colConfigDesc')}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {COLUMN_CONFIG_FIELDS.map(({ key, label, hint }) => {
              const isModified = columnConfigDraft[key] !== DEFAULT_COLUMN_CONFIG[key]
              return (
                <Box key={key}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      {label}
                    </Typography>
                    {isModified && (
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 500, fontSize: '0.7rem' }}>
                        {t('customised')}
                      </Typography>
                    )}
                  </Box>
                  <TextField
                    size="small"
                    fullWidth
                    value={columnConfigDraft[key]}
                    onChange={(e) => setColumnConfigDraft(d => ({ ...d, [key]: e.target.value }))}
                    placeholder={DEFAULT_COLUMN_CONFIG[key]}
                    helperText={lang === 'id' ? COLUMN_HINTS_ID[key] : hint}
                    slotProps={{ formHelperText: { sx: { mx: 0, mt: 0.25, fontSize: '0.7rem' } } }}
                    sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.875rem' } }}
                  />
                </Box>
              )
            })}
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button size="small" variant="text"
            onClick={() => setColumnConfigDraft({ ...DEFAULT_COLUMN_CONFIG })}
            sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
            {t('resetAllDefaults')}
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => setColumnConfigOpen(false)}
              sx={{ borderColor: 'divider', color: 'text.secondary' }}>
              {t('cancel')}
            </Button>
            <Button size="small" variant="contained" color="primary"
              onClick={() => { setColumnConfig(columnConfigDraft); setColumnConfigOpen(false) }}>
              {t('apply')}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Page shell */}
      <Box sx={{ position: 'relative', minHeight: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
        {/* Mesh blobs */}
        <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <Box sx={{ position: 'absolute', width: '55vw', height: '55vw', borderRadius: '50%', bgcolor: darkMode ? 'rgba(79,70,229,0.10)' : 'rgba(79,70,229,0.07)', filter: 'blur(90px)', top: '-15%', left: '-10%', animation: 'blob1 20s ease-in-out infinite' }} />
          <Box sx={{ position: 'absolute', width: '45vw', height: '45vw', borderRadius: '50%', bgcolor: darkMode ? 'rgba(79,70,229,0.08)' : 'rgba(79,70,229,0.05)', filter: 'blur(80px)', top: '40%', right: '-12%', animation: 'blob2 26s ease-in-out infinite' }} />
          <Box sx={{ position: 'absolute', width: '40vw', height: '40vw', borderRadius: '50%', bgcolor: darkMode ? 'rgba(79,70,229,0.07)' : 'rgba(79,70,229,0.04)', filter: 'blur(100px)', bottom: '-10%', left: '25%', animation: 'blob3 32s ease-in-out infinite' }} />
        </Box>
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 1536, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* ── Header ──────────────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box component="img" src="/icon.png" alt="Logo"
                sx={{ width: 40, height: 40, borderRadius: '50%' }}
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              <Box>
                <Typography variant="h5" sx={{ color: 'text.primary',  fontWeight: 700, lineHeight: 1.2 }}>
                  Label Visual Maker
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('subtitle')}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {step !== 'upload' && (
                <Button size="small" variant="outlined" startIcon={<CloseIcon sx={{ fontSize: 14 }} />} onClick={reset}
                  sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                  {t('startOver')}
                </Button>
              )}
              <Button size="small" variant="outlined"
                onClick={() => setLang(l => l === 'en' ? 'id' : 'en')}
                sx={{ borderColor: 'divider', color: 'text.secondary', fontSize: '0.75rem', minWidth: 0, px: 1.25 }}>
                {lang === 'en' ? '🇮🇩 ID' : '🇬🇧 EN'}
              </Button>
              <IconButton size="small" onClick={() => setDarkMode(d => !d)}
                sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                {darkMode ? <LightModeIcon sx={{ fontSize: 18 }} /> : <DarkModeIcon sx={{ fontSize: 18 }} />}
              </IconButton>
            </Box>
          </Box>
          </motion.div>

          {/* ── What's New banner ───────────────────────────────────────────── */}
          <WhatsNewBanner lang={lang} />

          {/* ── Step Indicator ──────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08, ease: 'easeOut' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const cur    = stepIdx[step]
              const done   = i < cur
              const active = i === cur
              return (
                <Box key={s.key} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.75, px: 2, py: 1, borderRadius: 2,
                    bgcolor: active ? 'primary.main' : done ? alpha('#4f46e5', 0.12) : 'action.selected',
                    color: active ? '#fff' : done ? 'primary.main' : 'text.disabled',
                    fontWeight: 600, fontSize: '0.875rem',
                    boxShadow: active ? 2 : 0,
                    transition: 'all 0.2s',
                  }}>
                    <Icon sx={{ fontSize: 16 }} />
                    <Typography variant="body2" color="inherit" sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                      {s.label}
                    </Typography>
                  </Box>
                  {i < STEPS.length - 1 && (
                    <ChevronRightIcon sx={{ mx: 0.5, color: done ? 'primary.main' : 'divider', fontSize: 18 }} />
                  )}
                </Box>
              )
            })}
          </Box>
          </motion.div>

          <AnimatePresence mode="wait">
          {/* ══ STEP 1: UPLOAD ══════════════════════════════════════════════ */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, transition: { duration: 0.18 } }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box
              onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: '2px dashed',
                borderColor: isDragging ? 'primary.main' : 'divider',
                borderRadius: 3, p: { xs: 6, sm: 10 },
                textAlign: 'center', cursor: 'pointer', userSelect: 'none',
                transition: 'all 0.2s',
                bgcolor: isDragging ? alpha('#4f46e5', 0.05) : 'transparent',
                '&:hover': { borderColor: 'primary.light', bgcolor: alpha('#4f46e5', 0.03) },
              }}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.ods,.csv" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }} />
              <Box sx={{ mb: 2, color: isDragging ? 'primary.main' : 'text.disabled' }}>
                <GridOnIcon sx={{ fontSize: 56 }} />
              </Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                {isDragging ? t('dropHere') : t('uploadTitle')}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('uploadHint')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled',  display: 'block', mt: 1 }}>
                {t('uploadReads')}
              </Typography>
            </Box>
            {/* Configure columns button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
              {(() => {
                const isCustom = COLUMN_CONFIG_FIELDS.some(({ key }) => columnConfig[key] !== DEFAULT_COLUMN_CONFIG[key])
                return (
                  <Button
                    size="small"
                    variant={isCustom ? 'contained' : 'outlined'}
                    color={isCustom ? 'primary' : 'inherit'}
                    startIcon={<TuneIcon sx={{ fontSize: 14 }} />}
                    onClick={() => { setColumnConfigDraft({ ...columnConfig }); setColumnConfigOpen(true) }}
                    sx={isCustom
                      ? { fontSize: '0.8rem' }
                      : { borderColor: 'divider', color: 'text.secondary', fontSize: '0.8rem' }}>
                    {isCustom ? t('colNamesCustomised') : t('configureColumns')}
                  </Button>
                )
              })()}
            </Box>
            </Box>
            </motion.div>
          )}

          {/* ══ STEP 2: DATA ════════════════════════════════════════════════ */}
          {step === 'data' && (
            <motion.div key="data" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, transition: { duration: 0.18 } }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Toolbar */}
              <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                <GridOnIcon sx={{ color: 'success.main', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: 'text.primary',  fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileName}
                </Typography>
                <Typography variant="body2" sx={{ color: 'divider' }}>·</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{rows.length} {t('rowsLabel')}</Typography>
                <Button size="small" variant="outlined" onClick={() => setSortRules(DEFAULT_SORT)}
                  sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                  {t('resetSort')}
                </Button>
                <Button size="small" variant="contained" color="primary"
                  startIcon={<PaletteIcon sx={{ fontSize: '14px !important' }} />}
                  onClick={() => setStep('design')} sx={{ ml: 'auto' }}>
                  {t('designCard')}
                </Button>
              </Paper>

              {/* Sort config */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary',  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {t('sortOrder')}
                  </Typography>
                  <Button size="small" variant="outlined"
                    startIcon={<AddIcon sx={{ fontSize: '12px !important' }} />}
                    onClick={() => setSortRules(prev => [...prev, { key: 'FTY SAP#', dir: 'asc' }])}
                    sx={{ borderColor: 'divider', color: 'text.secondary', fontSize: '0.75rem' }}>
                    {t('addRule')}
                  </Button>
                </Box>
                {sortRules.length === 0 && (
                  <Typography variant="caption" sx={{ color: 'text.disabled',  fontStyle: 'italic' }}>
                    {t('noSortRules')}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <AnimatePresence initial={false}>
                  {sortRules.map((rule, idx) => (
                    <motion.div key={`${rule.key}_${idx}`} layout initial={{ opacity: 0, scale: 0.75 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.75 }} transition={{ duration: 0.15 }}>
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      bgcolor: 'action.hover', border: 1, borderColor: 'divider', borderRadius: 2,
                      px: 1.5, py: 0.75,
                    }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary',  fontWeight: 500 }}>{idx + 1}.</Typography>
                      <Select
                        value={rule.key}
                        onChange={(e) => setSortRules(prev => prev.map((r, i) => i === idx ? { ...r, key: e.target.value as OutputCol } : r))}
                        size="small" variant="standard" disableUnderline
                        sx={{ fontSize: '0.75rem', fontWeight: 500, color: 'text.primary', '& .MuiSelect-select': { p: 0, pr: '20px !important', fontSize: '0.75rem' } }}>
                        {OUTPUT_COLUMNS.map(c => <MenuItem key={c} value={c} sx={{ fontSize: '0.75rem' }}>{c}</MenuItem>)}
                      </Select>
                      <Button size="small" variant="outlined"
                        onClick={() => setSortRules(prev => prev.map((r, i) => i === idx ? { ...r, dir: r.dir === 'asc' ? 'desc' : 'asc' } : r))}
                        startIcon={rule.dir === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: '10px !important' }} /> : <ArrowDownwardIcon sx={{ fontSize: '10px !important' }} />}
                        sx={{ borderColor: 'divider', color: 'text.secondary', fontSize: '0.75rem', minWidth: 60, px: 1, py: 0.25, fontFamily: 'monospace' }}>
                        {rule.dir}
                      </Button>
                      <IconButton size="small"
                        onClick={() => setSortRules(prev => prev.filter((_, i) => i !== idx))}
                        sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' }, p: 0.25 }}>
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                    </motion.div>
                  ))}
                  </AnimatePresence>
                </Box>
              </Paper>

              {/* Data quality alerts */}
              {(dataIssues.missingColumns.length > 0 || Object.keys(dataIssues.blankByField).length > 0) && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>

                  {/* Missing columns — error */}
                  {dataIssues.missingColumns.length > 0 && (
                    <Alert
                      severity="error"
                      sx={{ borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {dataIssues.missingColumns.length === 1
                          ? t('missingColTitle1')
                          : tMissingColN(dataIssues.missingColumns.length)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.75 }}>
                        {t('missingColDescPre')} <strong>{t('configureColumns')}</strong>.
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {dataIssues.missingColumns.map(({ label, colName }) => (
                          <Box component="li" key={label} sx={{ fontSize: '0.8rem' }}>
                            <strong>{label}</strong>
                            {colName !== label && (
                              <Box component="span" sx={{ color: 'error.dark', ml: 0.5, fontFamily: 'monospace' }}>
                                {tLookingFor(colName)}
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </Alert>
                  )}

                  {/* Blank data — warning */}
                  {Object.keys(dataIssues.blankByField).length > 0 && (
                    <Alert
                      severity="warning"
                      sx={{ borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {t('blankTitle')}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.75 }}>
                        {t('blankDesc')}
                      </Typography>
                      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                        {Object.entries(dataIssues.blankByField).map(([field, rowNums]) => {
                          const shown   = rowNums.slice(0, 8)
                          const hidden  = rowNums.length - shown.length
                          return (
                            <Box component="li" key={field} sx={{ fontSize: '0.8rem', mb: 0.25 }}>
                              <strong>{field}</strong>
                              {' — '}
                              {tRowCount(rowNums.length)}
                              {': '}
                              <Box component="span" sx={{ fontFamily: 'monospace', color: 'warning.dark' }}>
                                {shown.map(n => `#${n}`).join(', ')}
                                {hidden > 0 && ` ${tAndMore(hidden)}`}
                              </Box>
                            </Box>
                          )
                        })}
                      </Box>
                    </Alert>
                  )}

                </Box>
              )}

              {/* Data table */}
              <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: '60vh' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 40, textAlign: 'center' }}>#</TableCell>
                        {OUTPUT_COLUMNS.map(col => (
                          <TableCell key={col} sx={{ whiteSpace: 'nowrap' }}>{col}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedRows.slice(0, 100).map((row, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ textAlign: 'center', color: 'text.disabled', fontSize: '0.75rem' }}>{i + 1}</TableCell>
                          {OUTPUT_COLUMNS.map(col => (
                            <TableCell key={col}
                              sx={{ whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.875rem' }}
                              title={row[col]}>
                              {row[col]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {sortedRows.length > 100 && (
                  <Box sx={{ px: 2, py: 1, textAlign: 'center', bgcolor: 'action.hover', borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {tShowing100(sortedRows.length)}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
            </motion.div>
          )}

          {/* ══ STEP 3: DESIGN & EXPORT ═════════════════════════════════════ */}
          {step === 'design' && (
            <motion.div key="design" initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20, transition: { duration: 0.18 } }} transition={{ duration: 0.3, ease: 'easeOut' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Top bar */}
              <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                <PaletteIcon sx={{ color: 'success.main', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: 'text.primary',  fontWeight: 500 }}>{t('cardDesigner')}</Typography>
                <Typography variant="body2" sx={{ color: 'divider' }}>·</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{rows.length} {t('cardsLabel')}</Typography>
                <Button size="small" variant="outlined" onClick={() => setStep('data')}
                  sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                  {t('backToData')}
                </Button>
                <Button size="small" variant="outlined"
                  onClick={() => { setDesign(DEFAULT_DESIGN); localStorage.removeItem('slcm-design') }}
                  sx={{ borderColor: 'divider', color: 'text.secondary' }}>
                  {t('resetDefaults')}
                </Button>
                <Button size="small" variant="contained"
                  startIcon={<PrintIcon sx={{ fontSize: '14px !important' }} />}
                  onClick={handleExportIndex} disabled={isPrinting}
                  sx={{ ml: 'auto', bgcolor: '#374151', '&:hover': { bgcolor: '#1f2937' } }}>
                  {isPrinting && printMode === 'index' ? t('preparing') : t('exportIndex')}
                </Button>
                <Button size="small" variant="contained" color="primary"
                  startIcon={<PrintIcon sx={{ fontSize: '14px !important' }} />}
                  onClick={handleExportPDF} disabled={isPrinting}>
                  {isPrinting && printMode === 'cards' ? t('preparing') : t('exportPDF')}
                </Button>
              </Paper>

              {/* Live preview */}
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                  <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ color: 'text.primary',  fontWeight: 600 }}>{t('livePreview')}</Typography>

                  <Autocomplete
                    size="small"
                    options={sortedRows.map((row, idx) => ({ label: row['FTY SAP#'] || `(empty) #${idx + 1}`, idx }))}
                    getOptionLabel={opt => typeof opt === 'string' ? opt : opt.label}
                    isOptionEqualToValue={(opt, val) => opt.idx === val.idx}
                    value={sortedRows[previewRowIndex]
                      ? { label: sortedRows[previewRowIndex]['FTY SAP#'] || `(empty) #${previewRowIndex + 1}`, idx: previewRowIndex }
                      : null}
                    onChange={(_, val) => { if (val && typeof val !== 'string') setPreviewRowIndex(val.idx) }}
                    sx={{ width: 200, ml: 0.5 }}
                    renderInput={(params) => (
                      <TextField {...params} placeholder={t('searchSAP')} size="small"
                        sx={{ '& .MuiInputBase-input': { fontSize: '0.75rem', fontFamily: 'monospace' } }} />
                    )}
                    renderOption={(props, opt) => (
                      <Box component="li" {...props} sx={{ fontSize: '0.75rem', fontFamily: 'monospace', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled',  mr: 1 }}>#{opt.idx + 1}</Typography>
                        {opt.label}
                      </Box>
                    )}
                  />

                  {pdfScale !== 1 && (
                    <Box sx={{ ml: 'auto', bgcolor: 'action.selected', px: 1.5, py: 0.25, borderRadius: 99 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary',  fontFamily: 'monospace' }}>
                        {tScale(Math.round(pdfScale * 100))}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', overflow: 'auto' }}>
                  <div style={{ zoom: pdfScale, transition: 'zoom 0.12s ease' }}>
                    <AnimatePresence mode="wait">
                      <motion.div key={previewRowIndex} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.18 }}>
                        <CardPreview design={design} row={previewRow} index={1} total={totalCards} lang={lang} />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </Box>
              </Paper>

              {/* Card settings (collapsible) */}
              <Paper variant="outlined">
                <Button fullWidth onClick={() => setCardSettingsOpen(o => !o)}
                  sx={{ px: 2.5, py: 1.75, justifyContent: 'space-between', borderRadius: 0, textTransform: 'none' }}
                  endIcon={<ExpandMoreIcon sx={{ transition: 'transform 0.2s', transform: cardSettingsOpen ? 'rotate(180deg)' : 'none' }} />}>
                  <Typography variant="body2" sx={{ color: 'text.primary',  fontWeight: 600 }}>{t('cardSettings')}</Typography>
                </Button>

                <Collapse in={cardSettingsOpen}>
                  <Box sx={{ px: 2.5, pb: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                    {/* Font Family */}
                    <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary',  fontWeight: 600, display: 'block', mb: 1 }}>
                        {t('fontFamilyLabel')}
                      </Typography>
                      <ToggleButtonGroup
                        value={design.fontFamily} exclusive
                        onChange={(_, val) => { if (val) setDesign(d => ({ ...d, fontFamily: val })) }}
                        size="small"
                        sx={{ flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButtonGroup-grouped': { border: '1px solid !important', borderColor: 'divider !important', borderRadius: '6px !important', m: 0 } }}>
                        {FONT_OPTIONS.map(opt => (
                          <ToggleButton key={opt.value} value={opt.value}
                            sx={{ textTransform: 'none', fontSize: '0.75rem', fontFamily: opt.value, px: 1.5, py: 0.5, '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } } }}>
                            {opt.label}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </Box>

                    {/* PDF Scale */}
                    <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary',  fontWeight: 600 }}>
                          {tPdfScaleLabel(Math.round(pdfScale * 100))}
                        </Typography>
                        {pdfScale !== 0.5 && (
                          <Button size="small" variant="text" onClick={() => setPdfScale(0.5)}
                            sx={{ fontSize: '0.7rem', color: 'text.disabled', textDecoration: 'underline', p: 0, minWidth: 0 }}>
                            {t('resetTo50')}
                          </Button>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled',  minWidth: 28, textAlign: 'right' }}>50%</Typography>
                        <Slider min={50} max={200} step={5} value={Math.round(pdfScale * 100)}
                          onChange={(_, val) => setPdfScale((val as number) / 100)}
                          color="primary" size="small" sx={{ flex: 1 }} />
                        <Typography variant="caption" sx={{ color: 'text.disabled',  minWidth: 36 }}>200%</Typography>
                        <TextField type="number" size="small" value={Math.round(pdfScale * 100)}
                          onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) setPdfScale(Math.max(0.5, Math.min(2.0, v / 100))) }}
                          sx={{ width: 68 }} slotProps={{ htmlInput: { min: 50, max: 200, style: { textAlign: 'center', fontSize: '0.875rem' } } }} />
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>%</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.disabled',  display: 'block', mt: 0.5 }}>
                        {t('pdfScaleHint')}
                      </Typography>
                    </Box>

                    {/* Card Gap */}
                    <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary',  fontWeight: 600 }}>
                          {tCardGapLabel(cardGapMm)}
                        </Typography>
                        {cardGapMm !== 0.5 && (
                          <Button size="small" variant="text" onClick={() => setCardGapMm(0.5)}
                            sx={{ fontSize: '0.7rem', color: 'text.disabled', textDecoration: 'underline', p: 0, minWidth: 0 }}>
                            {t('resetTo05')}
                          </Button>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled',  minWidth: 28, textAlign: 'right' }}>0</Typography>
                        <Slider min={0} max={20} step={0.5} value={cardGapMm}
                          onChange={(_, val) => setCardGapMm(val as number)}
                          color="primary" size="small" sx={{ flex: 1 }} />
                        <Typography variant="caption" sx={{ color: 'text.disabled',  minWidth: 36 }}>20mm</Typography>
                        <TextField type="number" size="small" value={cardGapMm}
                          onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) setCardGapMm(Math.max(0, Math.min(20, v))) }}
                          sx={{ width: 68 }} slotProps={{ htmlInput: { min: 0, max: 20, step: 0.5, style: { textAlign: 'center', fontSize: '0.875rem' } } }} />
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>mm</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.disabled',  display: 'block', mt: 0.5 }}>
                        {t('cardGapHint')}
                      </Typography>
                    </Box>

                    {/* Grid Flow Direction */}
                    <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary',  fontWeight: 600, display: 'block', mb: 1 }}>
                        {t('gridFlowLabel')}
                      </Typography>
                      <ToggleButtonGroup
                        value={gridFlow} exclusive
                        onChange={(_, val) => { if (val) setGridFlow(val as GridFlow) }}
                        size="small"
                        sx={{ '& .MuiToggleButtonGroup-grouped': { border: '1px solid !important', borderColor: 'divider !important', borderRadius: '6px !important', m: 0, mr: 0.5 } }}>
                        <ToggleButton value="row" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.5, '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } } }}>
                          {t('gridFlowRow')}
                        </ToggleButton>
                        <ToggleButton value="column" sx={{ textTransform: 'none', fontSize: '0.75rem', px: 1.5, py: 0.5, '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } } }}>
                          {t('gridFlowColumn')}
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>

                    {/* Size Breakdown Row Gap */}
                    {design.layoutStyle === 'size-grid' && (
                      <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary',  fontWeight: 600 }}>
                            {tSizeSpacing(design.sizeGridRowGapPx ?? 20)}
                          </Typography>
                          {(design.sizeGridRowGapPx ?? 20) !== 20 && (
                            <Button size="small" variant="text" onClick={() => setDesign(d => ({ ...d, sizeGridRowGapPx: 20 }))}
                              sx={{ fontSize: '0.7rem', color: 'text.disabled', textDecoration: 'underline', p: 0, minWidth: 0 }}>
                              {t('resetTo20')}
                            </Button>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.disabled',  minWidth: 28, textAlign: 'right' }}>0</Typography>
                          <Slider min={0} max={30} step={1} value={design.sizeGridRowGapPx ?? 20}
                            onChange={(_, val) => setDesign(d => ({ ...d, sizeGridRowGapPx: val as number }))}
                            color="primary" size="small" sx={{ flex: 1 }} />
                          <Typography variant="caption" sx={{ color: 'text.disabled',  minWidth: 36 }}>30px</Typography>
                          <TextField type="number" size="small" value={design.sizeGridRowGapPx ?? 20}
                            onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) setDesign(d => ({ ...d, sizeGridRowGapPx: Math.max(0, Math.min(30, v)) })) }}
                            sx={{ width: 68 }} slotProps={{ htmlInput: { min: 0, max: 30, style: { textAlign: 'center', fontSize: '0.875rem' } } }} />
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>px</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled',  display: 'block', mt: 0.5 }}>
                          {t('sizeRowSpacingHint')}
                        </Typography>
                      </Box>
                    )}

                    {/* Size Breakdown Font Size */}
                    {design.layoutStyle === 'size-grid' && (
                      <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary',  fontWeight: 600 }}>
                            {tSizeFontSz(design.sizeGridFontSizePx ?? 8)}
                          </Typography>
                          {(design.sizeGridFontSizePx ?? 8) !== 8 && (
                            <Button size="small" variant="text" onClick={() => setDesign(d => ({ ...d, sizeGridFontSizePx: 8 }))}
                              sx={{ fontSize: '0.7rem', color: 'text.disabled', textDecoration: 'underline', p: 0, minWidth: 0 }}>
                              {t('resetTo8')}
                            </Button>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.disabled',  minWidth: 28, textAlign: 'right' }}>6</Typography>
                          <Slider min={6} max={24} step={1} value={design.sizeGridFontSizePx ?? 8}
                            onChange={(_, val) => setDesign(d => ({ ...d, sizeGridFontSizePx: val as number }))}
                            color="primary" size="small" sx={{ flex: 1 }} />
                          <Typography variant="caption" sx={{ color: 'text.disabled',  minWidth: 36 }}>24px</Typography>
                          <TextField type="number" size="small" value={design.sizeGridFontSizePx ?? 8}
                            onChange={(e) => { const v = Number(e.target.value); if (!isNaN(v)) setDesign(d => ({ ...d, sizeGridFontSizePx: Math.max(6, Math.min(24, v)) })) }}
                            sx={{ width: 68 }} slotProps={{ htmlInput: { min: 6, max: 24, style: { textAlign: 'center', fontSize: '0.875rem' } } }} />
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>px</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.disabled',  display: 'block', mt: 0.5 }}>
                          {t('sizeFontSizeHint')}
                        </Typography>
                      </Box>
                    )}

                  </Box>
                </Collapse>
              </Paper>

            </Box>
            </motion.div>
          )}
          </AnimatePresence>

        </Box>
      </Box>
    </ThemeProvider>
  )
}
