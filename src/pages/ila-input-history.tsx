import * as React from 'react';
import Head from 'next/head';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import SearchIcon from '@mui/icons-material/Search';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import * as XLSX from 'xlsx';

import { HotTable, type HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { registerTheme } from 'handsontable/themes';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AppLayout from '../components/AppLayout';
import type { AveryNoteItem, Department, InputType } from '../types';

// Registers sorting, filters, dropdown menu, hidden columns, etc.
registerAllModules();

import tokens_main from 'handsontable/themes/static/variables/tokens/main';
import colors_material from 'handsontable/themes/static/variables/colors/material';
import icons_main from 'handsontable/themes/static/variables/icons/main';

const MUIThemeForHTTable = registerTheme('custom-theme', {
  tokens: tokens_main,
  colors: colors_material,
  icons: icons_main,
  density: 'compact',
  colorScheme: 'dark',
}).params({
  colors: {
    primary: {
      '100': '#e3f2fdff',
      '200': '#bbdefbff',
      '300': '#90caf9ff',
      '400': '#42a5f5ff',
      '500': '#1976d2ff',
      '600': '#1565c0ff'
    },
    palette: {
      '50': '#f5f5f5ff',
      '100': '#eeeeee',
      '200': '#e0e0e0ff',
      '300': '#bdbdbdff',
      '400': '#9e9e9eff',
      '500': '#757575ff',
      '600': '#616161ff',
      '700': '#424242ff',
      '800': '#303030ff',
      '900': '#212121ff',
      '950': '#121212ff'
    },
    white: '#ffffffff',
    black: '#000000ff'
  },
  tokens: {
    fontFamily: 'Google Sans',
    fontSize: '14px',
    fontWeight: '400',
    backgroundColor: '#121212ff',
    backgroundSecondaryColor: '#121212ff',
    foregroundColor: '#ffffffde',
    foregroundSecondaryColor: '#ffffff99',
    borderColor: '#ffffff1f',
    accentColor: '#006978ff',
    shadowColor: '#00000080',
    headerBackgroundColor: '#121212ff',
    headerForegroundColor: '#ffffffde',
    headerFontWeight: '500',
    headerHighlightedBackgroundColor: '#2c2c2cff',
    headerHighlightedForegroundColor: 'hsl(188, 100%, 40%)',
    cellHorizontalBorderColor: '#ffffff1f',
    cellVerticalBorderColor: '#ffffff1f',
    cellSelectionBorderColor: '#006978ff',
    cellSelectionBackgroundColor: '#00687867',
  }
});


type ColumnKey = keyof AveryNoteItem;

const COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: 'seq', label: 'Seq' },
    { key: 'po_no', label: 'PO No' },
    { key: 'remark', label: 'Remark' },
    { key: 'print_qty', label: 'Print Qty' },
    { key: 'returned', label: 'Returned' },
    { key: 'created_at', label: 'Created At' },
    { key: 'dept_id', label: 'Department' },
    { key: 'input_id', label: 'Input Type' },
    { key: 'done', label: 'Status' },
    { key: 'short_group_code', label: 'Short Group Code' },
    { key: 'label_id', label: 'Label ID' },
];

const COLUMN_VISIBILITY_STORAGE_KEY = 'avery-notes-column-visibility';
const FILTERS_STORAGE_KEY = 'avery-notes-filters';

function getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

type PersistedFilters = {
    search: string;
    dateFrom: string;
    dateTo: string;
    deptFilter: string;
    inputFilter: string;
    doneFilter: string;
    multiPoList: string[];
};

// First-ever load (nothing saved yet) defaults the date range to today,
// so the page only pulls today's rows instead of the whole table.
function getDefaultFilters(): PersistedFilters {
    const today = getTodayDateString();
    return {
        search: '',
        dateFrom: today,
        dateTo: today,
        deptFilter: '',
        inputFilter: '',
        doneFilter: 'all',
        multiPoList: [],
    };
}

function loadPersistedFilters(): PersistedFilters {
    const defaults = getDefaultFilters();
    if (typeof window === 'undefined') return defaults;
    try {
        const stored = window.localStorage.getItem(FILTERS_STORAGE_KEY);
        if (!stored) return defaults;
        const parsed = JSON.parse(stored) as Partial<PersistedFilters>;
        return {
            search: typeof parsed.search === 'string' ? parsed.search : defaults.search,
            dateFrom: typeof parsed.dateFrom === 'string' && parsed.dateFrom ? parsed.dateFrom : defaults.dateFrom,
            dateTo: typeof parsed.dateTo === 'string' && parsed.dateTo ? parsed.dateTo : defaults.dateTo,
            deptFilter: typeof parsed.deptFilter === 'string' ? parsed.deptFilter : defaults.deptFilter,
            inputFilter: typeof parsed.inputFilter === 'string' ? parsed.inputFilter : defaults.inputFilter,
            doneFilter: typeof parsed.doneFilter === 'string' ? parsed.doneFilter : defaults.doneFilter,
            multiPoList: Array.isArray(parsed.multiPoList)
                ? parsed.multiPoList.filter((p): p is string => typeof p === 'string')
                : defaults.multiPoList,
        };
    } catch {
        return defaults;
    }
}

// Same hash-based palette idea as the old MUI Chip coloring, but as raw
// hex values since Handsontable cells are plain DOM, not MUI components.
const CHIP_PALETTE = [
    { bg: '#0d3a66', color: '#90caf9', border: '#1565c0' }, // primary
    { bg: '#4a1030', color: '#f48fb1', border: '#ad1457' }, // secondary
    { bg: '#4d3800', color: '#ffe082', border: '#f57f17' }, // warning
    { bg: '#123c1e', color: '#a5d6a7', border: '#2e7d32' }, // success
    { bg: '#063a52', color: '#81d4fa', border: '#0277bd' }, // info
    { bg: '#4d1414', color: '#ef9a9a', border: '#c62828' }, // error
];
const DEFAULT_CHIP = { bg: '#2a2a2a', color: '#bdbdbd', border: '#424242' };

function paletteForId(id: string | null): typeof DEFAULT_CHIP {
    if (!id) return DEFAULT_CHIP;
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return CHIP_PALETTE[hash % CHIP_PALETTE.length];
}

function renderChip(td: HTMLTableCellElement, label: string | null, palette: typeof DEFAULT_CHIP) {
    td.innerHTML = '';
    td.style.textAlign = 'left';
    if (!label) {
        td.textContent = '—';
        return;
    }
    const span = document.createElement('span');
    span.textContent = label;
    span.style.display = 'inline-block';
    span.style.padding = '0.5px 8px';
    span.style.borderRadius = '12px';
    span.style.fontSize = '10px';
    span.style.fontWeight = '500';
    span.style.lineHeight = '18px';
    span.style.background = palette.bg;
    span.style.color = palette.color;
    span.style.border = `1px solid ${palette.border}`;
    td.appendChild(span);
}

function formatDateTime(value: string | null): string {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

export default function AveryNotesPage() {
    const { user } = useAuth();

    const [rows, setRows] = React.useState<AveryNoteItem[]>([]);
    const [departments, setDepartments] = React.useState<Department[]>([]);
    const [inputTypes, setInputTypes] = React.useState<InputType[]>([]);
    const [fetching, setFetching] = React.useState(true);
    const [fetchError, setFetchError] = React.useState<string | null>(null);

    // Lazy-initialized once from localStorage so we don't read/parse it on
    // every render; falls back to today-only defaults on first-ever visit.
    const [initialFilters] = React.useState<PersistedFilters>(() => loadPersistedFilters());
    const [search, setSearch] = React.useState(initialFilters.search);
    const [dateFrom, setDateFrom] = React.useState(initialFilters.dateFrom);
    const [dateTo, setDateTo] = React.useState(initialFilters.dateTo);
    const [multiPoOpen, setMultiPoOpen] = React.useState(false);
    const [multiPoList, setMultiPoList] = React.useState<string[]>(initialFilters.multiPoList);
    const [multiPoText, setMultiPoText] = React.useState(initialFilters.multiPoList.join('\n'));
    const [multiPoNotFound, setMultiPoNotFound] = React.useState<string[]>([]);
    const [deptFilter, setDeptFilter] = React.useState<string>(initialFilters.deptFilter);
    const [inputFilter, setInputFilter] = React.useState<string>(initialFilters.inputFilter);
    const [doneFilter, setDoneFilter] = React.useState<string>(initialFilters.doneFilter);
    const [columnsMenuAnchor, setColumnsMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [hiddenColumns, setHiddenColumns] = React.useState<Set<string>>(new Set());

    const hotRef = React.useRef<HotTableRef>(null);

    React.useEffect(() => {
        try {
            const stored = window.localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
            if (stored) {
                setHiddenColumns(new Set(JSON.parse(stored)));
            }
        } catch {
            // ignore malformed/unavailable storage
        }
    }, []);

    // Save filter selections to localStorage whenever any of them change,
    // so they're restored automatically next time the page is opened.
    React.useEffect(() => {
        try {
            const toStore: PersistedFilters = {
                search,
                dateFrom,
                dateTo,
                deptFilter,
                inputFilter,
                doneFilter,
                multiPoList,
            };
            window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(toStore));
        } catch {
            // ignore unavailable storage
        }
    }, [search, dateFrom, dateTo, deptFilter, inputFilter, doneFilter, multiPoList]);

    const isColumnVisible = React.useCallback(
        (key: ColumnKey) => !hiddenColumns.has(key),
        [hiddenColumns]
    );

    const toggleColumn = (key: ColumnKey) => {
        setHiddenColumns((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            try {
                window.localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(Array.from(next)));
            } catch {
                // ignore unavailable storage
            }
            return next;
        });
    };

    const deptMap = React.useMemo(
        () => Object.fromEntries(departments.map((d) => [d.id, d.title])),
        [departments]
    );
    const inputMap = React.useMemo(
        () => Object.fromEntries(inputTypes.map((t) => [t.id, t.title])),
        [inputTypes]
    );

    React.useEffect(() => {
        if (!user) return;
        async function fetchData() {
            setFetching(true);
            setFetchError(null);

            let itemsQuery = supabase
                .from('ila_avery_note_items')
                .select('id, seq, po_no, remark, print_qty, created_at, done, input_id, dept_id, returned, short_group_code, label_id')
                .order('seq', { ascending: true });

            // Pull only the rows within the selected date range from the
            // server, instead of loading the whole table and filtering
            // client-side. With no saved filters yet this is today only.
            if (dateFrom) {
                itemsQuery = itemsQuery.gte('created_at', new Date(`${dateFrom}T00:00:00`).toISOString());
            }
            if (dateTo) {
                itemsQuery = itemsQuery.lte('created_at', new Date(`${dateTo}T23:59:59.999`).toISOString());
            }

            const [itemsRes, deptRes, inputRes] = await Promise.all([
                itemsQuery,
                supabase.from('departments').select('id, title').order('title', { ascending: true }),
                supabase.from('input_type').select('id, title').order('title', { ascending: true }),
            ]);
            if (itemsRes.error) {
                setFetchError(itemsRes.error.message);
            } else {
                setRows(itemsRes.data ?? []);
            }
            setDepartments(deptRes.data ?? []);
            setInputTypes(inputRes.data ?? []);
            setFetching(false);
        }
        fetchData();
    }, [user, dateFrom, dateTo]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const filteredRows = React.useMemo(() => {
        const q = search.toLowerCase();
        // Date range is now applied server-side (see the fetch effect
        // above), so `rows` already only contains the selected range.
        return rows.filter((r) => {
            if (q) {
                const matchText =
                    (r.po_no ?? '').toLowerCase().includes(q) ||
                    (r.remark ?? '').toLowerCase().includes(q) ||
                    String(r.seq ?? '').includes(q) ||
                    String(r.print_qty ?? '').includes(q);
                if (!matchText) return false;
            }
            if (multiPoList.length > 0) {
                const poNorm = (r.po_no ?? '').toLowerCase();
                if (!multiPoList.some((p) => poNorm === p)) return false;
            }
            if (deptFilter) {
                if (r.dept_id !== deptFilter) return false;
            }
            if (inputFilter) {
                if (r.input_id !== inputFilter) return false;
            }
            if (doneFilter === 'done' && !r.done) return false;
            if (doneFilter === 'pending' && r.done) return false;
            return true;
        });
    }, [rows, search, multiPoList, deptFilter, inputFilter, doneFilter]);

    // Whether any filter differs from the today-only default, used to pick
    // the right empty-state message and to enable/disable Clear Filters.
    const hasActiveFilters = React.useMemo(() => {
        const today = getTodayDateString();
        return Boolean(
            search ||
            multiPoList.length > 0 ||
            deptFilter ||
            inputFilter ||
            doneFilter !== 'all' ||
            dateFrom !== today ||
            dateTo !== today
        );
    }, [search, multiPoList, deptFilter, inputFilter, doneFilter, dateFrom, dateTo]);

    const handleClearFilters = React.useCallback(() => {
        const defaults = getDefaultFilters();
        setSearch(defaults.search);
        setDateFrom(defaults.dateFrom);
        setDateTo(defaults.dateTo);
        setDeptFilter(defaults.deptFilter);
        setInputFilter(defaults.inputFilter);
        setDoneFilter(defaults.doneFilter);
        setMultiPoList(defaults.multiPoList);
        setMultiPoText('');
        setMultiPoNotFound([]);
    }, []);

    const handleExportExcel = () => {
        const visibleColumns = COLUMNS.filter((c) => isColumnVisible(c.key));
        const data = filteredRows.map((row) => {
            const record: Record<string, string | number> = {};
            for (const col of visibleColumns) {
                switch (col.key) {
                    case 'created_at':
                        record[col.label] = formatDateTime(row.created_at);
                        break;
                    case 'dept_id':
                        record[col.label] = row.dept_id ? (deptMap[row.dept_id] ?? row.dept_id) : '';
                        break;
                    case 'input_id':
                        record[col.label] = row.input_id ? (inputMap[row.input_id] ?? row.input_id) : '';
                        break;
                    case 'done':
                        record[col.label] = row.done ? 'Done' : 'Pending';
                        break;
                    default:
                        record[col.label] = row[col.key] ?? '';
                }
            }
            return record;
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const timestamp = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `ila-input-history-${timestamp}.xlsx`);
    };

    // Cell renderers — Handsontable renders into plain DOM <td> nodes, so
    // MUI components (Chip, icons) can't be mounted here; instead we build
    // small styled spans that mimic the previous chip / icon look.
    const printQtyRenderer = React.useCallback(
        (
            instance: Handsontable.Core,
            td: HTMLTableCellElement,
            row: number,
            col: number,
            prop: string | number,
            value: unknown
        ) => {
            td.innerHTML = '';
            td.style.textAlign = 'right';
            if (value == null || value === '') {
                td.textContent = '—';
                return td;
            }
            const isHigh = Number(value) > 1;
            renderChip(td, String(value), isHigh ? CHIP_PALETTE[2] : DEFAULT_CHIP);
            td.style.textAlign = 'right';
            return td;
        },
        []
    );

    const dateRenderer = React.useCallback(
        (
            instance: Handsontable.Core,
            td: HTMLTableCellElement,
            row: number,
            col: number,
            prop: string | number,
            value: unknown
        ) => {
            td.innerHTML = '';
            td.style.whiteSpace = 'nowrap';
            td.textContent = formatDateTime((value as string) ?? null);
            return td;
        },
        []
    );

    const deptRenderer = React.useCallback(
        (
            instance: Handsontable.Core,
            td: HTMLTableCellElement,
            row: number,
            col: number,
            prop: string | number,
            value: unknown
        ) => {
            const id = (value as string) ?? null;
            renderChip(td, id ? deptMap[id] ?? id : null, paletteForId(id));
            return td;
        },
        [deptMap]
    );

    const inputRenderer = React.useCallback(
        (
            instance: Handsontable.Core,
            td: HTMLTableCellElement,
            row: number,
            col: number,
            prop: string | number,
            value: unknown
        ) => {
            const id = (value as string) ?? null;
            renderChip(td, id ? inputMap[id] ?? id : null, paletteForId(id));
            return td;
        },
        [inputMap]
    );

    const doneRenderer = React.useCallback(
        (
            instance: Handsontable.Core,
            td: HTMLTableCellElement,
            row: number,
            col: number,
            prop: string | number,
            value: unknown
        ) => {
            td.innerHTML = '';
            td.style.textAlign = 'center';
            const span = document.createElement('span');
            span.textContent = value ? '✔' : '○';
            span.style.color = value ? '#2e7d32' : '#9e9e9e';
            span.style.fontWeight = '700';
            td.appendChild(span);
            return td;
        },
        []
    );

    const hotColumns = React.useMemo<Handsontable.ColumnSettings[]>(
        () =>
            COLUMNS.map((col) => {
                switch (col.key) {
                    case 'seq':
                    case 'returned':
                        return { data: col.key, type: 'numeric', readOnly: true };
                    case 'print_qty':
                        return { data: col.key, readOnly: true, renderer: printQtyRenderer };
                    case 'created_at':
                        return { data: col.key, readOnly: true, renderer: dateRenderer };
                    case 'dept_id':
                        return { data: col.key, readOnly: true, renderer: deptRenderer };
                    case 'input_id':
                        return { data: col.key, readOnly: true, renderer: inputRenderer };
                    case 'done':
                        return { data: col.key, readOnly: true, renderer: doneRenderer };
                    default:
                        return { data: col.key, readOnly: true };
                }
            }),
        [printQtyRenderer, dateRenderer, deptRenderer, inputRenderer, doneRenderer]
    );

    const hiddenColumnIndexes = React.useMemo(
        () =>
            COLUMNS.reduce<number[]>((acc, col, idx) => {
                if (hiddenColumns.has(col.key)) acc.push(idx);
                return acc;
            }, []),
        [hiddenColumns]
    );

    return (
        <AppLayout>
            <Head>
                <title>ILA Input History — LabelManager</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <Box sx={{ py: 4, px: { xs: 2, md: 4 }, flex: 1 }}>
                {/* Page header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                    <NoteAltIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            ILA Input History
                        </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                            label={`${filteredRows.length} record${filteredRows.length !== 1 ? 's' : ''}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<FileDownloadIcon fontSize="small" />}
                            onClick={handleExportExcel}
                            disabled={fetching || filteredRows.length === 0}
                        >
                            Export to Excel ({`${filteredRows.length} record${filteredRows.length !== 1 ? 's' : ''}`})
                        </Button>
                    </Box>
                </Box>

                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        {/* Search bar + date range */}
                        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                placeholder="Search by PO No, remark, seq…"
                                value={search}
                                onChange={handleSearchChange}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ width: { xs: '100%', sm: 280 } }}
                            />
                            <TextField
                                size="small"
                                label="From"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 160 }}
                            />
                            <TextField
                                size="small"
                                label="To"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ width: 160 }}
                            />
                            {(dateFrom || dateTo) && (
                                <Tooltip title="Clear date filter">
                                    <IconButton size="small" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Button
                                size="small"
                                variant={multiPoList.length > 0 ? 'contained' : 'outlined'}
                                startIcon={<ListAltIcon fontSize="small" />}
                                onClick={() => setMultiPoOpen(true)}
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                {multiPoList.length > 0 ? `Multi PO (${multiPoList.length})` : 'Multi PO Search'}
                            </Button>
                            {multiPoList.length > 0 && (
                                <Tooltip title="Clear multi-PO filter">
                                    <IconButton
                                        size="small"
                                        onClick={() => { setMultiPoList([]); setMultiPoText(''); setMultiPoNotFound([]); }}
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Department</InputLabel>
                                <Select
                                    value={deptFilter}
                                    label="Department"
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Departments</MenuItem>
                                    {departments.map((d) => (
                                        <MenuItem key={d.id} value={d.id}>{d.title}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel>Input Type</InputLabel>
                                <Select
                                    value={inputFilter}
                                    label="Input Type"
                                    onChange={(e) => setInputFilter(e.target.value)}
                                >
                                    <MenuItem value="">All Input Types</MenuItem>
                                    {inputTypes.map((t) => (
                                        <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 130 }}>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    value={doneFilter}
                                    label="Status"
                                    onChange={(e) => setDoneFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All Items</MenuItem>
                                    <MenuItem value="done">Completed</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                startIcon={<ClearIcon fontSize="small" />}
                                onClick={handleClearFilters}
                                disabled={!hasActiveFilters}
                                sx={{ whiteSpace: 'nowrap' }}
                            >
                                Clear Filters
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<ViewColumnIcon fontSize="small" />}
                                onClick={(e) => setColumnsMenuAnchor(e.currentTarget)}
                                sx={{ whiteSpace: 'nowrap', ml: 'auto' }}
                            >
                                Columns
                            </Button>
                            <Menu
                                anchorEl={columnsMenuAnchor}
                                open={Boolean(columnsMenuAnchor)}
                                onClose={() => setColumnsMenuAnchor(null)}
                            >
                                {COLUMNS.map((col) => (
                                    <MenuItem key={col.key} dense onClick={() => toggleColumn(col.key)}>
                                        <Checkbox size="small" checked={isColumnVisible(col.key)} sx={{ p: 0.5, mr: 1 }} />
                                        <ListItemText primary={col.label} />
                                    </MenuItem>
                                ))}
                            </Menu>
                        </Box>

                        {fetchError && (
                            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                                Failed to load data: {fetchError}
                            </Typography>
                        )}

                        {multiPoNotFound.length > 0 && (
                            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setMultiPoNotFound([])}>
                                <strong>{multiPoNotFound.length} PO{multiPoNotFound.length > 1 ? 's' : ''} not found:</strong>{' '}
                                {multiPoNotFound.join(', ')}
                            </Alert>
                        )}

                        {/* Data grid — Handsontable handles column sorting, per-column
                            filters (via the header dropdown menu) and virtual scrolling
                            natively, so the old manual sort state/TablePagination are gone. */}
                        <Box sx={{ position: 'relative' }}>
                            {fetching && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'rgba(255,255,255,0.6)',
                                        zIndex: 1,
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary">Loading…</Typography>
                                </Box>
                            )}
                            {!fetching && filteredRows.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>
                                    {hasActiveFilters ? 'No records match your filters.' : 'No records found for today.'}
                                </Typography>
                            ) : (
                                <HotTable
                                    ref={hotRef}
                                    theme={MUIThemeForHTTable}
                                    data={filteredRows}
                                    columns={hotColumns}
                                    colHeaders={COLUMNS.map((c) => c.label)}
                                    hiddenColumns={{ columns: hiddenColumnIndexes, indicators: false }}
                                    rowHeaders={true}
                                    columnSorting={true}
                                    filters={true}
                                    dropdownMenu={true}
                                    manualColumnResize={true}
                                    stretchH="all"
                                    height={620}
                                    readOnly={true}
                                    licenseKey="non-commercial-and-evaluation"
                                />
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Box>
            <Dialog open={multiPoOpen} onClose={() => setMultiPoOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Multi PO Search</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Enter one PO No per line.
                    </Typography>
                    <TextField
                        multiline
                        rows={8}
                        fullWidth
                        placeholder={'PO-001\nPO-002\nPO-003'}
                        value={multiPoText}
                        onChange={(e) => { setMultiPoText(e.target.value); setMultiPoNotFound([]); }}
                        size="small"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMultiPoOpen(false)}>Close</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            const list = multiPoText
                                .split('\n')
                                .map((s) => s.trim().toLowerCase())
                                .filter(Boolean);
                            const allPoNos = new Set(rows.map((r) => (r.po_no ?? '').toLowerCase()));
                            const notFound = list.filter((p) => !allPoNos.has(p));
                            setMultiPoList(list);
                            setMultiPoNotFound(notFound);
                            setMultiPoOpen(false);
                        }}
                    >
                        Apply
                    </Button>
                </DialogActions>
            </Dialog>
        </AppLayout>
    );
}