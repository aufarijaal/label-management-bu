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
import Pagination from '@mui/material/Pagination';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClearIcon from '@mui/icons-material/Clear';
// NOTE: ExcelIcon isn't a stock MUI icon — point this at wherever your
// project already defines it (e.g. a custom SvgIcon component).
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
import { useColorMode } from '../context/ColorModeContext';
import { supabase } from '../lib/supabaseClient';
import AppLayout from '../components/AppLayout';
import type { AveryNoteItem, Department, InputType } from '../types';

// Registers sorting, filters, dropdown menu, hidden columns, etc.
registerAllModules();

import tokens_main from 'handsontable/themes/static/variables/tokens/main';
import colors_material from 'handsontable/themes/static/variables/colors/material';
import icons_main from 'handsontable/themes/static/variables/icons/main';

const HT_ACCENT_GREEN = '#188038';

const MUIThemeForHTTableDark = registerTheme('custom-theme-dark', {
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
    foregroundColor: '#ffffffff',
    foregroundSecondaryColor: '#ffffffcc',
    borderColor: '#ffffff1f',
        accentColor: HT_ACCENT_GREEN,
    shadowColor: '#00000080',
    headerBackgroundColor: '#121212ff',
    headerForegroundColor: '#ffffffde',
    headerFontWeight: '500',
    headerHighlightedBackgroundColor: '#2c2c2cff',
        headerHighlightedForegroundColor: HT_ACCENT_GREEN,
    cellHorizontalBorderColor: '#ffffff1f',
    cellVerticalBorderColor: '#ffffff1f',
        cellSelectionBorderColor: HT_ACCENT_GREEN,
        cellSelectionBackgroundColor: '#18803833',
    }
});

const MUIThemeForHTTableLight = registerTheme('custom-theme-light', {
    tokens: tokens_main,
    colors: colors_material,
    icons: icons_main,
    density: 'compact',
    colorScheme: 'light',
}).params({
    colors: {
        primary: {
            '100': '#e8f5e9',
            '200': '#c8e6c9',
            '300': '#a5d6a7',
            '400': '#81c784',
            '500': HT_ACCENT_GREEN,
            '600': '#0d652d'
        },
        palette: {
            '50': '#fafafa',
            '100': '#f5f5f5',
            '200': '#eeeeee',
            '300': '#e0e0e0',
            '400': '#bdbdbd',
            '500': '#9e9e9e',
            '600': '#757575',
            '700': '#616161',
            '800': '#424242',
            '900': '#212121',
            '950': '#111111'
        },
        white: '#ffffffff',
        black: '#000000ff'
    },
    tokens: {
        fontFamily: 'Google Sans',
        fontSize: '14px',
        fontWeight: '400',
        backgroundColor: '#ffffffff',
        backgroundSecondaryColor: '#f8faf8ff',
        foregroundColor: '#1f1f1f',
        foregroundSecondaryColor: '#202124',
        borderColor: '#dadce0',
        accentColor: HT_ACCENT_GREEN,
        shadowColor: '#0000001f',
        headerBackgroundColor: '#f1f8f4',
        headerForegroundColor: '#1f1f1f',
        headerFontWeight: '500',
        headerHighlightedBackgroundColor: '#d9efe0',
        headerHighlightedForegroundColor: HT_ACCENT_GREEN,
        cellHorizontalBorderColor: '#e5e7eb',
        cellVerticalBorderColor: '#e5e7eb',
        cellSelectionBorderColor: HT_ACCENT_GREEN,
        cellSelectionBackgroundColor: '#18803826',
  }
});


type ColumnKey = keyof AveryNoteItem;

const COLUMNS: { key: ColumnKey; label: string }[] = [
    { key: 'seq', label: 'Seq' },
    { key: 'po_no', label: 'PO No' },
    { key: 'remark', label: 'Remark' },
    { key: 'print_qty', label: 'Qty Input (pc)' },
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
const ROWS_PER_PAGE_OPTIONS = [25, 50, 100, 250, 500] as const;
const ROWS_PER_PAGE_ALL = -1;

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
    deptFilter: string[];
    inputFilter: string[];
    doneFilter: string;
    multiPoList: string[];
    rowsPerPage: number;
};

// First-ever load (nothing saved yet) defaults the date range to today,
// so the page only pulls today's rows instead of the whole table.
function getDefaultFilters(): PersistedFilters {
    const today = getTodayDateString();
    return {
        search: '',
        dateFrom: today,
        dateTo: today,
        deptFilter: [],
        inputFilter: [],
        doneFilter: 'all',
        multiPoList: [],
        rowsPerPage: 50,
    };
}

function loadPersistedFilters(): PersistedFilters {
    const defaults = getDefaultFilters();
    if (typeof window === 'undefined') return defaults;
    try {
        const stored = window.localStorage.getItem(FILTERS_STORAGE_KEY);
        if (!stored) return defaults;
        const parsed = JSON.parse(stored) as Partial<PersistedFilters>;
        const parseMultiSelect = (value: unknown): string[] => {
            if (Array.isArray(value)) {
                return value.filter((v): v is string => typeof v === 'string' && v.length > 0);
            }
            if (typeof value === 'string' && value) {
                // Backward compatibility with previous single-select storage.
                return [value];
            }
            return [];
        };
        const parsedRowsPerPage =
            typeof parsed.rowsPerPage === 'number' && Number.isFinite(parsed.rowsPerPage)
            ? Math.floor(parsed.rowsPerPage)
                : defaults.rowsPerPage;
        const normalizedRowsPerPage =
            parsedRowsPerPage === ROWS_PER_PAGE_ALL || ROWS_PER_PAGE_OPTIONS.includes(parsedRowsPerPage as (typeof ROWS_PER_PAGE_OPTIONS)[number])
            ? parsedRowsPerPage
            : defaults.rowsPerPage;
        return {
            search: typeof parsed.search === 'string' ? parsed.search : defaults.search,
            dateFrom: typeof parsed.dateFrom === 'string' && parsed.dateFrom ? parsed.dateFrom : defaults.dateFrom,
            dateTo: typeof parsed.dateTo === 'string' && parsed.dateTo ? parsed.dateTo : defaults.dateTo,
            deptFilter: parseMultiSelect(parsed.deptFilter),
            inputFilter: parseMultiSelect(parsed.inputFilter),
            doneFilter: typeof parsed.doneFilter === 'string' ? parsed.doneFilter : defaults.doneFilter,
            multiPoList: Array.isArray(parsed.multiPoList)
                ? parsed.multiPoList.filter((p): p is string => typeof p === 'string')
                : defaults.multiPoList,
            rowsPerPage: normalizedRowsPerPage,
        };
    } catch {
        return defaults;
    }
}

function formatDateTime(value: string | null): string {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString();
    } catch {
        return value;
    }
}

// Maps each recognized input_id to the exact column label used in the
// "report format" export template (example_format_for_export_file.xlsx).
// Input types with no matching column (e.g. FGT, Special Request, Other,
// PO) simply have nowhere to place a quantity in that template.
const REPORT_INPUT_COLUMNS: { id: string; label: string }[] = [
    { id: 'prod_dmg', label: 'Production damage' },
    { id: 'print_dmg', label: 'Damage in printing operation' },
    { id: 'b', label: 'B-Grade' },
    { id: 'c', label: 'C-Grade' },
    { id: 'lost', label: 'Lost Label' },
    { id: 'error', label: 'Data loss/Network error' },
    { id: 'other', label: 'Other' },
];

function toDateOnly(value: string | null): Date | null {
    if (!value) return null;
    try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return null;
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    } catch {
        return null;
    }
}

function ExcelIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 512 512">
	<radialGradient id="SVGbwT1gbHR" cx={-736.418} cy={787.398} r={14.222} gradientTransform="rotate(46.451 44031.733 -21862.033)scale(-41.1236 31.9082)" gradientUnits="userSpaceOnUse">
		<stop offset={0.065} stopColor="#379539"></stop>
		<stop offset={0.422} stopColor="#297c2d"></stop>
		<stop offset={0.703} stopColor="#15561c"></stop>
	</radialGradient>
	<path fill="url(#SVGbwT1gbHR)" d="M78.2 163.6c0-35.3 28.7-64 64-64h362.7v369.8c0 23.6-19.1 42.7-42.7 42.7H163.6c-47.1 0-85.3-38.2-85.3-85.3V163.6z"></path>
	<radialGradient id="SVGGTMnrceI" cx={-762.747} cy={777.165} r={14.222} gradientTransform="rotate(44.03 18539.879 -10324.23)scale(-16.661 12.8906)" gradientUnits="userSpaceOnUse">
		<stop offset={0} stopColor="#073b10"></stop>
		<stop offset={0.992} stopColor="#084a13" stopOpacity={0}></stop>
	</radialGradient>
	<path fill="url(#SVGGTMnrceI)" fillOpacity={0.7} d="M78.2 163.6c0-35.3 28.7-64 64-64h362.7v369.8c0 23.6-19.1 42.7-42.7 42.7H163.6c-47.1 0-85.3-38.2-85.3-85.3V163.6z"></path>
	<linearGradient id="SVGXhLNYdaT" x1={78.222} x2={274.273} y1={215.335} y2={215.335} gradientTransform="matrix(1 0 0 -1 0 514)" gradientUnits="userSpaceOnUse">
		<stop offset={0} stopColor="#52d17c"></stop>
		<stop offset={0.329} stopColor="#4aa647"></stop>
	</linearGradient>
	<path fill="url(#SVGXhLNYdaT)" d="M78.2 234.7c0-35.3 28.7-64 64-64h192c-23.6 0-42.7 19.1-42.7 42.7v85.3c0 23.6-19.1 42.7-42.7 42.7h-85.3c-47.1 0-85.3 38.2-85.3 85.3z"></path>
	<linearGradient id="SVGaHx2YdtF" x1={206.222} x2={206.222} y1={343.335} y2={165.517} gradientTransform="matrix(1 0 0 -1 0 514)" gradientUnits="userSpaceOnUse">
		<stop offset={0} stopColor="#29852f"></stop>
		<stop offset={0.5} stopColor="#4aa647" stopOpacity={0}></stop>
	</linearGradient>
	<path fill="url(#SVGaHx2YdtF)" fillOpacity={0.3} d="M78.2 234.7c0-35.3 28.7-64 64-64h192c-23.6 0-42.7 19.1-42.7 42.7v85.3c0 23.6-19.1 42.7-42.7 42.7h-85.3c-47.1 0-85.3 38.2-85.3 85.3z"></path>
	<linearGradient id="SVG0ARuJmyD" x1={89.567} x2={326.102} y1={304.297} y2={509.448} gradientTransform="matrix(1 0 0 -1 0 514)" gradientUnits="userSpaceOnUse">
		<stop offset={0} stopColor="#66d052"></stop>
		<stop offset={1} stopColor="#85e972"></stop>
	</linearGradient>
	<path fill="url(#SVG0ARuJmyD)" d="M78.2 85.3C78.2 38.2 116.4 0 163.6 0h170.7v170.7H163.6c-47.1 0-85.3 38.2-85.3 85.3V85.3z"></path>
	<radialGradient id="SVGkGBPOeNV" cx={-814.063} cy={816.814} r={14.222} gradientTransform="matrix(-9.0188 0 0 19.094 -7016.886 -15487.255)" gradientUnits="userSpaceOnUse">
		<stop offset={0.292} stopColor="#4eb43b"></stop>
		<stop offset={1} stopColor="#72cc61" stopOpacity={0}></stop>
	</radialGradient>
	<path fill="url(#SVGkGBPOeNV)" d="M78.2 85.3C78.2 38.2 116.4 0 163.6 0h170.7v170.7H163.6c-47.1 0-85.3 38.2-85.3 85.3V85.3z"></path>
	<linearGradient id="SVGVUAjgb5K" x1={193.631} x2={78.222} y1={386} y2={386} gradientTransform="matrix(1 0 0 -1 0 514)" gradientUnits="userSpaceOnUse">
		<stop offset={0.184} stopColor="#c0e075" stopOpacity={0}></stop>
		<stop offset={1} stopColor="#d1eb95"></stop>
	</linearGradient>
	<path fill="url(#SVGVUAjgb5K)" d="M78.2 85.3C78.2 38.2 116.4 0 163.6 0h170.7v170.7H163.6c-47.1 0-85.3 38.2-85.3 85.3V85.3z"></path>
	<radialGradient id="SVG86hIfcXx" cx={-758.923} cy={815.212} r={14.222} gradientTransform="rotate(218.97 -11081.4 5923.97)scale(21.751 21.6904)" gradientUnits="userSpaceOnUse">
		<stop offset={0.44} stopColor="#79e96d"></stop>
		<stop offset={1} stopColor="#d0eb76"></stop>
	</radialGradient>
	<path fill="url(#SVG86hIfcXx)" d="M462.2 0h-128c-23.6 0-42.7 19.1-42.7 42.7V128c0 23.6 19.1 42.7 42.7 42.7h128c23.6 0 42.7-19.1 42.7-42.7V42.7c0-23.6-19.1-42.7-42.7-42.7"></path>
	<radialGradient id="SVGj4kBUbvE" cx={-665.253} cy={799.243} r={14.222} gradientTransform="matrix(16 16 45.5476 -45.5476 -25752.482 47289.465)" gradientUnits="userSpaceOnUse">
		<stop offset={0} stopColor="#20a85e"></stop>
		<stop offset={0.944} stopColor="#09442a"></stop>
	</radialGradient>
	<path fill="url(#SVGj4kBUbvE)" d="M53.3 241.8h135.1c25.5 0 46.2 20.7 46.2 46.2v135.1c0 25.5-20.7 46.2-46.2 46.2H53.3c-25.5 0-46.2-20.7-46.2-46.2V288c0-25.5 20.7-46.2 46.2-46.2"></path>
	<radialGradient id="SVGnKh77dwp" cx={-646.865} cy={859.937} r={14.222} gradientTransform="matrix(0 11.2 12.9 0 -10972.3 7623.2)" gradientUnits="userSpaceOnUse">
		<stop offset={0.58} stopColor="#33a662" stopOpacity={0}></stop>
		<stop offset={0.974} stopColor="#98f0b0"></stop>
	</radialGradient>
	<path fill="url(#SVGnKh77dwp)" fillOpacity={0.3} d="M53.3 241.8h135.1c25.5 0 46.2 20.7 46.2 46.2v135.1c0 25.5-20.7 46.2-46.2 46.2H53.3c-25.5 0-46.2-20.7-46.2-46.2V288c0-25.5 20.7-46.2 46.2-46.2"></path>
	<path fill="#fff" d="M180.7 420.6h-35.1l-22-41.4c-.8-1.5-1.4-2.6-1.8-3.4c-.4-.9-.8-1.9-1.2-3.1h-.4c-.5 1.5-1.1 2.6-1.5 3.5c-.5.9-1.1 2-1.7 3.4l-22.8 41.1H61.1l39.7-65.1l-37-64.9h34.6l19.6 37c.8 1.5 1.5 2.8 2 4q.9 1.65 1.8 3.9h.4c.8-1.8 1.5-3.1 2-4.2c.5-1 1.3-2.4 2.2-4.1l20.3-36.6h33l-37.5 63.9z"></path>
</svg>)
}

export default function AveryNotesPage() {
    const { user } = useAuth();
    const { mode } = useColorMode();

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
    const [deptFilter, setDeptFilter] = React.useState<string[]>(initialFilters.deptFilter);
    const [inputFilter, setInputFilter] = React.useState<string[]>(initialFilters.inputFilter);
    const [doneFilter, setDoneFilter] = React.useState<string>(initialFilters.doneFilter);
    const [rowsPerPage, setRowsPerPage] = React.useState<number>(initialFilters.rowsPerPage);
    const [page, setPage] = React.useState<number>(0);
    const [columnsMenuAnchor, setColumnsMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [exportMenuAnchor, setExportMenuAnchor] = React.useState<null | HTMLElement>(null);
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
                rowsPerPage,
            };
            window.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(toStore));
        } catch {
            // ignore unavailable storage
        }
    }, [search, dateFrom, dateTo, deptFilter, inputFilter, doneFilter, multiPoList, rowsPerPage]);

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
            if (deptFilter.length > 0) {
                if (!r.dept_id || !deptFilter.includes(r.dept_id)) return false;
            }
            if (inputFilter.length > 0) {
                if (!r.input_id || !inputFilter.includes(r.input_id)) return false;
            }
            if (doneFilter === 'done' && !r.done) return false;
            if (doneFilter === 'pending' && r.done) return false;
            return true;
        });
    }, [rows, search, multiPoList, deptFilter, inputFilter, doneFilter]);

    const effectiveRowsPerPage = React.useMemo(
        () => (rowsPerPage === ROWS_PER_PAGE_ALL ? Math.max(1, filteredRows.length) : rowsPerPage),
        [rowsPerPage, filteredRows.length]
    );

    React.useEffect(() => {
        setPage(0);
    }, [search, dateFrom, dateTo, multiPoList, deptFilter, inputFilter, doneFilter, rowsPerPage]);

    const totalPages = React.useMemo(() => {
        if (rowsPerPage === ROWS_PER_PAGE_ALL) return 1;
        return Math.max(1, Math.ceil(filteredRows.length / effectiveRowsPerPage));
    }, [filteredRows.length, rowsPerPage, effectiveRowsPerPage]);

    React.useEffect(() => {
        if (page >= totalPages) {
            setPage(totalPages - 1);
        }
    }, [page, totalPages]);

    const pagedRows = React.useMemo(() => {
        if (rowsPerPage === ROWS_PER_PAGE_ALL) return filteredRows;
        const start = page * effectiveRowsPerPage;
        return filteredRows.slice(start, start + effectiveRowsPerPage);
    }, [filteredRows, page, rowsPerPage, effectiveRowsPerPage]);

    // A date range counts as an active filter whenever either date is set,
    // including the default today-only range.
    const hasActiveFilters = React.useMemo(() => {
        return Boolean(
            search ||
            multiPoList.length > 0 ||
            deptFilter.length > 0 ||
            inputFilter.length > 0 ||
            doneFilter !== 'all' ||
            dateFrom ||
            dateTo
        );
    }, [search, multiPoList, deptFilter, inputFilter, doneFilter, dateFrom, dateTo]);

    const handleClearFilters = React.useCallback(() => {
        const defaults = getDefaultFilters();
        setSearch(defaults.search);
        setDateFrom('');
        setDateTo('');
        setDeptFilter(defaults.deptFilter);
        setInputFilter(defaults.inputFilter);
        setDoneFilter(defaults.doneFilter);
        setMultiPoList(defaults.multiPoList);
        setMultiPoText('');
        setMultiPoNotFound([]);
        setRowsPerPage(defaults.rowsPerPage);
        setPage(0);
    }, []);

    const activeFilterCount = React.useMemo(() => {
        let count = 0;
        if (search) count += 1;
        if (multiPoList.length > 0) count += 1;
        if (deptFilter.length > 0) count += 1;
        if (inputFilter.length > 0) count += 1;
        if (doneFilter !== 'all') count += 1;
        if (dateFrom || dateTo) count += 1;
        return count;
    }, [search, multiPoList.length, deptFilter.length, inputFilter.length, doneFilter, dateFrom, dateTo]);

    const rowsFrom = filteredRows.length === 0 ? 0 : page * effectiveRowsPerPage + 1;
    const rowsTo = filteredRows.length === 0 ? 0 : Math.min((page + 1) * effectiveRowsPerPage, filteredRows.length);

    const htTheme = mode === 'dark' ? MUIThemeForHTTableDark : MUIThemeForHTTableLight;

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
        const now = new Date();

        const timestamp =
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_` +
            `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;

        XLSX.writeFile(workbook, `ila-input-history-${timestamp}.xlsx`);
    };

    // Rows eligible for the report-format export: unassigned input_id and
    // the "PO" input type are excluded per the report's requirements.
    const reportEligibleRows = React.useMemo(
        () => filteredRows.filter((r) => r.input_id && r.input_id !== 'po'),
        [filteredRows]
    );

    // Exports in the layout of example_format_for_export_file.xlsx: one row
    // per PO / Article / Department / Date, with quantities spread across
    // per-defect-type columns instead of one row per raw record.
    const handleExportExcelReportFormat = () => {
        type GroupAcc = {
            po_no: string;
            short_group_code: string;
            dept_id: string | null;
            dateValue: Date | null;
            qtyByInput: Record<string, number>;
            returned: number;
            remarks: string[];
        };

        const groups = new Map<string, GroupAcc>();

        for (const row of reportEligibleRows) {
            const dateOnly = toDateOnly(row.created_at);
            const dateKey = dateOnly ? dateOnly.toISOString().slice(0, 10) : '';
            const key = [row.po_no ?? '', row.short_group_code ?? '', row.dept_id ?? '', dateKey].join('|');

            let group = groups.get(key);
            if (!group) {
                group = {
                    po_no: row.po_no ?? '',
                    short_group_code: row.short_group_code ?? '',
                    dept_id: row.dept_id,
                    dateValue: dateOnly,
                    qtyByInput: {},
                    returned: 0,
                    remarks: [],
                };
                groups.set(key, group);
            }

            if (row.input_id) {
                group.qtyByInput[row.input_id] = (group.qtyByInput[row.input_id] ?? 0) + (row.print_qty ?? 0);
            }
            group.returned += row.returned ?? 0;
            if (row.remark && !group.remarks.includes(row.remark)) group.remarks.push(row.remark);
        }

        const headers = [
            'Id',
            'PO#',
            'Article Number',
            'Dept',
            'Request Date',
            ...REPORT_INPUT_COLUMNS.map((c) => c.label),
            'Returned labels (pcs)',
            'Remark',
        ];

        const data = Array.from(groups.values()).map((group, idx) => {
            const record: Record<string, string | number | Date> = {
                Id: idx + 1,
                'PO#': group.po_no,
                'Article Number': group.short_group_code,
                Dept: group.dept_id ? (deptMap[group.dept_id] ?? group.dept_id) : '',
                'Request Date': group.dateValue ?? '',
            };
            for (const col of REPORT_INPUT_COLUMNS) {
                const qty = group.qtyByInput[col.id];
                record[col.label] = qty ? qty : '';
            }
            record['Returned labels (pcs)'] = group.returned || '';
            record['Remark'] = group.remarks.join('; ');
            return record;
        });

        const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
        // Format the "Request Date" column as dates rather than raw serials.
        const dateColIndex = headers.indexOf('Request Date');
        const dateColLetter = XLSX.utils.encode_col(dateColIndex);
        for (let r = 0; r < data.length; r++) {
            const cellRef = `${dateColLetter}${r + 2}`;
            const cell = worksheet[cellRef];
            if (cell && cell.v instanceof Date) {
                cell.t = 'd';
                cell.z = 'mm/dd/yyyy';
            }
        }
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const now = new Date();

        const timestamp =
            `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_` +
            `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
        XLSX.writeFile(workbook, `ila-input-report-${timestamp}.xlsx`);
    };

    // Cell renderers — Handsontable renders into plain DOM <td> nodes.
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
            td.textContent = value == null || value === '' ? '—' : String(value);
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
            td.innerHTML = '';
            td.style.textAlign = 'left';
            const id = (value as string) ?? '';
            td.textContent = id ? deptMap[id] ?? id : '—';
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
            td.innerHTML = '';
            td.style.textAlign = 'left';
            const id = (value as string) ?? '';
            td.textContent = id ? inputMap[id] ?? id : '—';
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
            td.style.color = value ? (mode === 'dark' ? '#81c995' : '#137333') : (mode === 'dark' ? '#e8eaed' : '#202124');
            td.style.fontWeight = '600';
            td.textContent = value ? 'Done' : 'Pending';
            return td;
        },
        [mode]
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
                            startIcon={<ExcelIcon />}
                            endIcon={<ArrowDropDownIcon />}
                            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                            disabled={fetching || filteredRows.length === 0}
                        >
                            Export to Excel
                        </Button>
                        <Menu
                            anchorEl={exportMenuAnchor}
                            open={Boolean(exportMenuAnchor)}
                            onClose={() => setExportMenuAnchor(null)}
                        >
                            <MenuItem
                                onClick={() => {
                                    handleExportExcel();
                                    setExportMenuAnchor(null);
                                }}
                                disabled={filteredRows.length === 0}
                            >
                                <ListItemText
                                    primary="Export to Excel"
                                    secondary={`${filteredRows.length} record${filteredRows.length !== 1 ? 's' : ''}`}
                                />
                            </MenuItem>
                            <Tooltip
                                title='Grouped by PO / Article / Dept / Date, excludes unassigned & "PO" input type'
                                placement="left"
                            >
                                <MenuItem
                                    onClick={() => {
                                        handleExportExcelReportFormat();
                                        setExportMenuAnchor(null);
                                    }}
                                    disabled={reportEligibleRows.length === 0}
                                >
                                    <ListItemText
                                        primary="Export Report Reprint Format"
                                        secondary={`${reportEligibleRows.length} record${reportEligibleRows.length !== 1 ? 's' : ''}`}
                                    />
                                </MenuItem>
                            </Tooltip>
                        </Menu>
                    </Box>
                </Box>

                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        {/* Filter toolbar */}
                        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.25, alignItems: 'stretch' }}>
                            <Box
                                sx={{
                                    flex: '1 1 760px',
                                    minWidth: 300,
                                    border: '1px solid',
                                    borderColor: hasActiveFilters ? 'primary.main' : 'divider',
                                    borderRadius: 2,
                                    px: 1.25,
                                    py: 1,
                                    bgcolor: hasActiveFilters ? 'action.selected' : 'background.default',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 0.2 }}>
                                        FILTERS
                                    </Typography>
                                    {hasActiveFilters && (
                                        <Chip size="small" color="primary" variant="outlined" label={`${activeFilterCount} active`} />
                                    )}
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                    <TextField
                                        size="small"
                                        placeholder="Search by PO No, remark, seq..."
                                        value={search}
                                        onChange={handleSearchChange}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" />
                                                </InputAdornment>
                                            )
                                        }}
                                        sx={{ width: { xs: '100%', sm: 250 } }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                            Created At
                                        </Typography>
                                        <TextField
                                            size="small"
                                            label="From"
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ width: 146 }}
                                        />
                                        <TextField
                                            size="small"
                                            label="To"
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ width: 146 }}
                                        />
                                        {(dateFrom || dateTo) && (
                                            <Tooltip title="Clear Created At range">
                                                <IconButton size="small" onClick={() => { setDateFrom(''); setDateTo(''); }}>
                                                    <ClearIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                    <FormControl size="small" sx={{ minWidth: 140 }}>
                                        <InputLabel>Department</InputLabel>
                                        <Select
                                            multiple
                                            value={deptFilter}
                                            label="Department"
                                            onChange={(e) => setDeptFilter(e.target.value as string[])}
                                            renderValue={(selected) =>
                                                (selected as string[])
                                                    .map((id) => deptMap[id] ?? id)
                                                    .join(', ') || 'All Departments'
                                            }
                                        >
                                            <MenuItem
                                                onClick={() =>
                                                    setDeptFilter((prev) =>
                                                        prev.length === departments.length ? [] : departments.map((d) => d.id)
                                                    )
                                                }
                                            >
                                                <Checkbox
                                                    size="small"
                                                    checked={departments.length > 0 && deptFilter.length === departments.length}
                                                    indeterminate={deptFilter.length > 0 && deptFilter.length < departments.length}
                                                />
                                                <ListItemText primary="All Departments" />
                                            </MenuItem>
                                            {departments.map((d) => (
                                                <MenuItem key={d.id} value={d.id}>
                                                    <Checkbox size="small" checked={deptFilter.includes(d.id)} />
                                                    <ListItemText primary={d.title} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ minWidth: 140 }}>
                                        <InputLabel>Input Type</InputLabel>
                                        <Select
                                            multiple
                                            value={inputFilter}
                                            label="Input Type"
                                            onChange={(e) => setInputFilter(e.target.value as string[])}
                                            renderValue={(selected) =>
                                                (selected as string[])
                                                    .map((id) => inputMap[id] ?? id)
                                                    .join(', ') || 'All Input Types'
                                            }
                                        >
                                            <MenuItem
                                                onClick={() =>
                                                    setInputFilter((prev) =>
                                                        prev.length === inputTypes.length ? [] : inputTypes.map((t) => t.id)
                                                    )
                                                }
                                            >
                                                <Checkbox
                                                    size="small"
                                                    checked={inputTypes.length > 0 && inputFilter.length === inputTypes.length}
                                                    indeterminate={inputFilter.length > 0 && inputFilter.length < inputTypes.length}
                                                />
                                                <ListItemText primary="All Input Types" />
                                            </MenuItem>
                                            {inputTypes.map((t) => (
                                                <MenuItem key={t.id} value={t.id}>
                                                    <Checkbox size="small" checked={inputFilter.includes(t.id)} />
                                                    <ListItemText primary={t.title} />
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <FormControl size="small" sx={{ minWidth: 126 }}>
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
                                </Box>
                            </Box>

                            <Box
                                sx={{
                                    flex: '0 0 auto',
                                    minWidth: { xs: '100%', md: 220 },
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    px: 1.25,
                                    py: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 1,
                                }}
                            >
                                <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: 0.2 }}>
                                    ACTIONS
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                                    <Button
                                        size="small"
                                        variant={multiPoList.length > 0 ? 'contained' : 'outlined'}
                                        startIcon={<ListAltIcon fontSize="small" />}
                                        onClick={() => setMultiPoOpen(true)}
                                        sx={{ whiteSpace: 'nowrap' }}
                                    >
                                        {multiPoList.length > 0 ? `Multi PO (${multiPoList.length})` : 'Multi PO Search'}
                                    </Button>
                                    <Button
                                        size="small"
                                        variant={hasActiveFilters ? 'contained' : 'outlined'}
                                        color={hasActiveFilters ? 'primary' : 'inherit'}
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
                                        sx={{ whiteSpace: 'nowrap' }}
                                    >
                                        Columns
                                    </Button>
                                </Box>
                            </Box>
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
                        <Box
                            sx={{
                                position: 'relative',
                                ...(mode === 'light'
                                    ? {
                                        '& .ht-theme-main, & .ht-theme-main .wtHolder, & .ht-theme-main .handsontableInput': {
                                            color: '#202124 !important',
                                        },
                                        '& .ht-theme-main td, & .ht-theme-main .wtBorder': {
                                            color: '#202124 !important',
                                        },
                                        '& .ht-theme-main th, & .ht-theme-main .htCore thead th': {
                                            color: '#202124 !important',
                                        },
                                        '& .ht-theme-main .ht_clone_left th, & .ht-theme-main .ht_clone_top th, & .ht-theme-main .ht_clone_top_left_corner th': {
                                            color: '#202124 !important',
                                        },
                                        '& .ht-theme-main .htDimmed, & .ht-theme-main .htAutocompleteArrow': {
                                            color: '#202124 !important',
                                        },
                                    }
                                    : {}),
                            }}
                        >
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
                                <>
                                    <HotTable
                                        ref={hotRef}
                                        theme={htTheme}
                                        data={pagedRows}
                                        columns={hotColumns}
                                        colHeaders={COLUMNS.map((c) => c.label)}
                                        hiddenColumns={{ columns: hiddenColumnIndexes, indicators: false }}
                                        rowHeaders={(index: number) => String(page * effectiveRowsPerPage + index + 1)}
                                        columnSorting={true}
                                        filters={true}
                                        dropdownMenu={true}
                                        manualColumnResize={true}
                                        stretchH="all"
                                        height={620}
                                        readOnly={true}
                                        readOnlyCellClassName=""
                                        afterGetColHeader={(col, th) => {
                                            if (col === -1) {
                                                th.textContent = '#';
                                            }
                                        }}
                                        licenseKey="non-commercial-and-evaluation"
                                    />
                                    <Box
                                        sx={{
                                            mt: 1.5,
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 1,
                                        }}
                                    >
                                        <Typography variant="caption" color="text.secondary">
                                            Showing {formatWithCommas(rowsFrom)}-{formatWithCommas(rowsTo)} of {formatWithCommas(filteredRows.length)}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.25 }}>
                                            <FormControl size="small" sx={{ minWidth: 132 }}>
                                                <InputLabel>Rows per page</InputLabel>
                                                <Select
                                                    value={String(rowsPerPage)}
                                                    label="Rows per page"
                                                    onChange={(e) => {
                                                        const next = Number(e.target.value);
                                                        setRowsPerPage(next);
                                                        setPage(0);
                                                    }}
                                                >
                                                    {ROWS_PER_PAGE_OPTIONS.map((size) => (
                                                        <MenuItem key={size} value={String(size)}>
                                                            {size}
                                                        </MenuItem>
                                                    ))}
                                                    <MenuItem value={String(ROWS_PER_PAGE_ALL)}>All</MenuItem>
                                                </Select>
                                            </FormControl>
                                            {totalPages > 1 && rowsPerPage !== ROWS_PER_PAGE_ALL ? (
                                                <Pagination
                                                    size="small"
                                                    color="primary"
                                                    shape="rounded"
                                                    page={page + 1}
                                                    count={totalPages}
                                                    onChange={(_, value) => setPage(value - 1)}
                                                    siblingCount={1}
                                                    boundaryCount={1}
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.secondary" sx={{ px: 0.5 }}>
                                                    {filteredRows.length === 0 ? 'No pages' : 'Page 1 / 1'}
                                                </Typography>
                                            )}
                                        </Box>
                                    </Box>
                                </>
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

function formatWithCommas(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
}