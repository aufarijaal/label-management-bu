import * as React from 'react';
import Head from 'next/head';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import Grid from '@mui/material/Grid';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '../context/ColorModeContext';
import { supabase } from '../lib/supabaseClient';
import AppLayout from '../components/AppLayout';
import type { OrderData } from '../types';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { registerTheme } from 'handsontable/themes';
import tokens_main from 'handsontable/themes/static/variables/tokens/main';
import colors_material from 'handsontable/themes/static/variables/colors/material';
import icons_main from 'handsontable/themes/static/variables/icons/main';

registerAllModules();

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

const TABLE_NAME = 'order_data';
const ORDER_DATA_FETCH_MAX_ROWS = 10_000;

type FormState = {
    cancel_status: boolean;
    fty_sap: string;
    gtn: string;
    release_date: string;
    model_number: string;
    model_name: string;
    art: string;
    destination: string;
    size_1: string;
    size_1t: string;
    size_2: string;
    size_2t: string;
    size_3: string;
    size_3t: string;
    size_4: string;
    size_4t: string;
    size_5: string;
    size_5t: string;
    size_6: string;
    size_6t: string;
    size_7: string;
    size_7t: string;
    size_8: string;
    size_8t: string;
    size_9: string;
    size_9t: string;
    size_10: string;
    size_10t: string;
    size_11: string;
    size_11t: string;
    size_12: string;
    size_12t: string;
    size_13: string;
    size_13t: string;
    old_gtn: string;
    old_sap: string;
    changes: string;
};

const EMPTY_FORM: FormState = {
    cancel_status: false,
    fty_sap: '',
    gtn: '',
    release_date: '',
    model_number: '',
    model_name: '',
    art: '',
    destination: '',
    size_1: '',
    size_1t: '',
    size_2: '',
    size_2t: '',
    size_3: '',
    size_3t: '',
    size_4: '',
    size_4t: '',
    size_5: '',
    size_5t: '',
    size_6: '',
    size_6t: '',
    size_7: '',
    size_7t: '',
    size_8: '',
    size_8t: '',
    size_9: '',
    size_9t: '',
    size_10: '',
    size_10t: '',
    size_11: '',
    size_11t: '',
    size_12: '',
    size_12t: '',
    size_13: '',
    size_13t: '',
    old_gtn: '',
    old_sap: '',
    changes: '',
};

const SIZE_KEYS = [
    'size_1', 'size_1t', 'size_2', 'size_2t', 'size_3', 'size_3t', 'size_4', 'size_4t', 'size_5', 'size_5t', 'size_6', 'size_6t',
    'size_7', 'size_7t', 'size_8', 'size_8t', 'size_9', 'size_9t', 'size_10', 'size_10t', 'size_11', 'size_11t', 'size_12', 'size_12t',
    'size_13', 'size_13t'
] as const;

const TEXT_FIELDS = [
    'fty_sap',
    'gtn',
    'model_number',
    'model_name',
    'art',
    'destination',
    'old_gtn',
    'old_sap',
    'changes'
] as const;

function toNullableString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function toNullableInteger(value: string): number | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed)) {
        throw new Error('Size fields must be valid integers.');
    }
    return parsed;
}

function mapRowToForm(row: OrderData): FormState {
    const form: FormState = { ...EMPTY_FORM };

    form.cancel_status = row.cancel_status;

    TEXT_FIELDS.forEach((field) => {
        form[field] = row[field] ?? '';
    });

    form.release_date = row.release_date ?? '';

    SIZE_KEYS.forEach((field) => {
        form[field] = row[field] == null ? '' : String(row[field]);
    });

    return form;
}

function buildPayload(form: FormState) {
    const payload: Record<string, string | number | boolean | null> = {
        cancel_status: form.cancel_status,
        release_date: form.release_date ? form.release_date : null,
    };

    TEXT_FIELDS.forEach((field) => {
        payload[field] = toNullableString(form[field]);
    });

    SIZE_KEYS.forEach((field) => {
        payload[field] = toNullableInteger(form[field]);
    });

    return payload;
}

function normalizeHeader(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function toStringCell(value: unknown): string {
    if (value == null) return '';
    return String(value).trim();
}

function toDateStringCell(value: unknown): string {
    if (value == null || value === '') return '';

    if (typeof value === 'number') {
        const excelDate = XLSX.SSF.parse_date_code(value);
        if (!excelDate) return '';
        const year = String(excelDate.y).padStart(4, '0');
        const month = String(excelDate.m).padStart(2, '0');
        const day = String(excelDate.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    const text = String(value).trim();
    if (!text) return '';

    const asDate = new Date(text);
    if (!Number.isNaN(asDate.getTime())) {
        return asDate.toISOString().slice(0, 10);
    }

    return text;
}

function toIntegerStringCell(value: unknown): string {
    if (value == null || value === '') return '';

    if (typeof value === 'number') {
        if (!Number.isFinite(value) || !Number.isInteger(value)) {
            throw new Error('Size fields must be valid integers.');
        }
        return String(value);
    }

    const raw = String(value).trim();
    if (!raw) return '';
    const normalized = raw.replace(/,/g, '');
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
        throw new Error('Size fields must be valid integers.');
    }
    return String(parsed);
}

function parseFtySapList(value: string): string[] {
    return Array.from(new Set(
        value
            .split(/[\n,;\t]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
    ));
}

function parseMultiValueList(value: string): string[] {
    return Array.from(new Set(
        value
            .split(/[\n,;\t]+/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0),
    ));
}

function buildUploadAliasMap(): Map<string, UploadFieldKey> {
    const aliasMap = new Map<string, UploadFieldKey>();

    UPLOAD_FIELDS.forEach((field) => {
        aliasMap.set(normalizeHeader(field), field);
        for (const alias of UPLOAD_HEADER_ALIASES[field]) {
            aliasMap.set(normalizeHeader(alias), field);
        }
    });

    return aliasMap;
}

type SizeKey = (typeof SIZE_KEYS)[number];

type CancelFilter = 'all' | 'cancelled' | 'active';

type BulkChangeField = 'gtn' | 'fty_sap' | 'destination';

type BulkChangeRow = {
    ftySap: string;
    newValue: string;
};

type UploadFieldKey = Exclude<keyof FormState, 'cancel_status'>;

const EMPTY_BULK_CHANGE_ROW: BulkChangeRow = { ftySap: '', newValue: '' };

function hasBulkChangeRowValue(row: BulkChangeRow): boolean {
    return row.ftySap.trim().length > 0 || row.newValue.trim().length > 0;
}

function normalizeBulkChangeRows(rows: BulkChangeRow[]): BulkChangeRow[] {
    const nextRows = rows.length > 0 ? rows.map((row) => ({ ...row })) : [{ ...EMPTY_BULK_CHANGE_ROW }];

    while (nextRows.length > 1 && !hasBulkChangeRowValue(nextRows[nextRows.length - 1])) {
        nextRows.pop();
    }

    if (hasBulkChangeRowValue(nextRows[nextRows.length - 1])) {
        nextRows.push({ ...EMPTY_BULK_CHANGE_ROW });
    }

    return nextRows;
}

function parseBulkChangeRows(rows: BulkChangeRow[]): Array<{ ftySap: string; newValue: string }> {
    const updates: Array<{ ftySap: string; newValue: string }> = [];

    rows.forEach((row, index) => {
        const ftySap = row.ftySap.trim();
        const newValue = row.newValue.trim();

        if (!ftySap && !newValue) return;
        if (!ftySap || !newValue) {
            throw new Error(`Row ${index + 1}: both FTY SAP and new value are required.`);
        }

        updates.push({ ftySap, newValue });
    });

    return updates;
}

function getBulkChangeFieldLabel(field: BulkChangeField): string {
    if (field === 'gtn') return 'GTN';
    if (field === 'fty_sap') return 'FTY SAP';
    return 'Destination';
}

function getBulkChangeNewValueHeader(field: BulkChangeField): string {
    if (field === 'gtn') return 'New GTN';
    if (field === 'fty_sap') return 'New FTY SAP';
    return 'New Destination';
}

const UPLOAD_FIELDS: UploadFieldKey[] = [
    'fty_sap',
    'gtn',
    'release_date',
    'model_number',
    'model_name',
    'art',
    'destination',
    'size_1',
    'size_1t',
    'size_2',
    'size_2t',
    'size_3',
    'size_3t',
    'size_4',
    'size_4t',
    'size_5',
    'size_5t',
    'size_6',
    'size_6t',
    'size_7',
    'size_7t',
    'size_8',
    'size_8t',
    'size_9',
    'size_9t',
    'size_10',
    'size_10t',
    'size_11',
    'size_11t',
    'size_12',
    'size_12t',
    'size_13',
    'size_13t',
    'old_gtn',
    'old_sap',
    'changes',
];

const UPLOAD_HEADER_ALIASES: Record<UploadFieldKey, string[]> = {
    fty_sap: ['FTY SAP#', 'fty_sap', 'FTY SAP'],
    gtn: ['Order Number (GTN)', 'gtn', 'GTN'],
    release_date: ['接单日-Released date', 'release_date', 'Released date'],
    model_number: ['Model Number', 'model_number'],
    model_name: ['Model Name', 'model_name'],
    art: ['Article Number', 'art'],
    destination: ['Ship to Country', 'destination'],
    size_1: ['1'],
    size_1t: ['1,5', '1t', '1.5', '1\u00bd'],
    size_2: ['2'],
    size_2t: ['2,5', '2t', '2.5', '2\u00bd'],
    size_3: ['3'],
    size_3t: ['3,5', '3t', '3.5', '3\u00bd'],
    size_4: ['4'],
    size_4t: ['4,5', '4t', '4.5', '4\u00bd'],
    size_5: ['5'],
    size_5t: ['5,5', '5t', '5.5', '5\u00bd'],
    size_6: ['6'],
    size_6t: ['6,5', '6t', '6.5', '6\u00bd'],
    size_7: ['7'],
    size_7t: ['7,5', '7t', '7.5', '7\u00bd'],
    size_8: ['8'],
    size_8t: ['8,5', '8t', '8.5', '8\u00bd'],
    size_9: ['9'],
    size_9t: ['9,5', '9t', '9.5', '9\u00bd'],
    size_10: ['10'],
    size_10t: ['10,5', '10t', '10.5', '10\u00bd'],
    size_11: ['11'],
    size_11t: ['11,5', '11t', '11.5', '11\u00bd'],
    size_12: ['12'],
    size_12t: ['12,5', '12t', '12.5', '12\u00bd'],
    size_13: ['13'],
    size_13t: ['13,5', '13t', '13.5', '13\u00bd'],
    old_gtn: ['Reallocation Indicator', 'old_gtn'],
    old_sap: ['Old FTY SAP#', 'old_sap'],
    changes: ['Remark update', 'changes'],
};

type BulkUploadPreviewItem = {
    sourceRow: number;
    form: FormState;
    duplicateReason: string | null;
};

type BulkUploadPreviewTableRow = {
    source_row: number;
    duplicate_reason: string;
} & Record<UploadFieldKey, string>;

type OrderTableRow = Record<SizeKey, number | null> & {
    id: number;
    cancel_status: string;
    release_date: string;
    fty_sap: string;
    gtn: string;
    old_gtn: string;
    old_sap: string;
    model_number: string;
    model_name: string;
    art: string;
    destination: string;
    total_qty: number;
    changes: string;
};

const ORDER_TABLE_COLUMN_DEFINITIONS = [
    { key: 'id', label: 'ID', type: 'numeric' as const },
    { key: 'cancel_status', label: 'Cancel Status', type: 'text' as const },
    { key: 'release_date', label: 'Release Date', type: 'text' as const },
    { key: 'fty_sap', label: 'FTY SAP', type: 'text' as const },
    { key: 'gtn', label: 'GTN', type: 'text' as const },
    { key: 'old_gtn', label: 'Old GTN', type: 'text' as const },
    { key: 'old_sap', label: 'Old SAP', type: 'text' as const },
    { key: 'model_number', label: 'Model Number', type: 'text' as const },
    { key: 'model_name', label: 'Model Name', type: 'text' as const },
    { key: 'art', label: 'ART', type: 'text' as const },
    { key: 'destination', label: 'Destination', type: 'text' as const },
    ...SIZE_KEYS.map((field) => ({
        key: field,
        label: field.replace('size_', 'SIZE ').toUpperCase(),
        type: 'numeric' as const,
    })),
    { key: 'total_qty', label: 'Total Qty', type: 'numeric' as const },
    { key: 'changes', label: 'Changes', type: 'text' as const },
] as const;

type OrderTableColumnKey = (typeof ORDER_TABLE_COLUMN_DEFINITIONS)[number]['key'];

const HOT_COLUMNS: Handsontable.ColumnSettings[] = [
    ...ORDER_TABLE_COLUMN_DEFINITIONS.map((column) => ({
        data: column.key,
        type: column.type,
        readOnly: true,
    })),
];

const HOT_HEADERS = ORDER_TABLE_COLUMN_DEFINITIONS.map((column) => column.label);

const BULK_PREVIEW_COLUMNS: Handsontable.ColumnSettings[] = [
    { data: 'source_row', type: 'numeric', readOnly: true },
    { data: 'duplicate_reason', type: 'text', readOnly: true },
    ...UPLOAD_FIELDS.map((field) => ({ data: field, type: 'text', readOnly: true })),
];

const BULK_PREVIEW_HEADERS = [
    'Row',
    'Duplicate Check',
    ...UPLOAD_FIELDS.map((field) => field.toUpperCase()),
];

export default function OrderDataPage() {
    const { user } = useAuth();
    const { mode } = useColorMode();

    const [rows, setRows] = React.useState<OrderData[]>([]);
    const [selectedRowId, setSelectedRowId] = React.useState<number | null>(null);
    const [fetching, setFetching] = React.useState(true);
    const [fetchError, setFetchError] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState('');
    const [cancelFilter, setCancelFilter] = React.useState<CancelFilter>('all');
    const [quickFilterAnchorEl, setQuickFilterAnchorEl] = React.useState<null | HTMLElement>(null);
    const quickFilterMenuOpen = Boolean(quickFilterAnchorEl);
    const [quickFilterOpen, setQuickFilterOpen] = React.useState(false);
    const [quickFilterDialogMode, setQuickFilterDialogMode] = React.useState<'fty_sap' | 'gtn'>('fty_sap');
    const [quickFilterFtySapInput, setQuickFilterFtySapInput] = React.useState('');
    const [quickFilterGtnInput, setQuickFilterGtnInput] = React.useState('');
    const [quickFilterFtySapValues, setQuickFilterFtySapValues] = React.useState<string[]>([]);
    const [quickFilterGtnValues, setQuickFilterGtnValues] = React.useState<string[]>([]);

    const [quickActionsAnchorEl, setQuickActionsAnchorEl] = React.useState<null | HTMLElement>(null);
    const quickActionsOpen = Boolean(quickActionsAnchorEl);
    const [columnsMenuAnchor, setColumnsMenuAnchor] = React.useState<null | HTMLElement>(null);
    const [hiddenColumns, setHiddenColumns] = React.useState<Set<OrderTableColumnKey>>(new Set());

    const [bulkUploadOpen, setBulkUploadOpen] = React.useState(false);
    const [bulkUploadPreview, setBulkUploadPreview] = React.useState<BulkUploadPreviewItem[]>([]);
    const [bulkUploadFileName, setBulkUploadFileName] = React.useState('');
    const [bulkUploadError, setBulkUploadError] = React.useState<string | null>(null);
    const [bulkUploadBusy, setBulkUploadBusy] = React.useState(false);
    const [bulkUploadConfirming, setBulkUploadConfirming] = React.useState(false);
    const bulkUploadInputRef = React.useRef<HTMLInputElement>(null);

    const [bulkCancelOpen, setBulkCancelOpen] = React.useState(false);
    const [bulkCancelInput, setBulkCancelInput] = React.useState('');
    const [bulkCancelError, setBulkCancelError] = React.useState<string | null>(null);
    const [bulkCancelBusy, setBulkCancelBusy] = React.useState(false);

    const [bulkUncancelOpen, setBulkUncancelOpen] = React.useState(false);
    const [bulkUncancelInput, setBulkUncancelInput] = React.useState('');
    const [bulkUncancelError, setBulkUncancelError] = React.useState<string | null>(null);
    const [bulkUncancelBusy, setBulkUncancelBusy] = React.useState(false);

    const [bulkChangeOpen, setBulkChangeOpen] = React.useState(false);
    const [bulkChangeField, setBulkChangeField] = React.useState<BulkChangeField>('gtn');
    const [bulkChangeRows, setBulkChangeRows] = React.useState<BulkChangeRow[]>([{ ...EMPTY_BULK_CHANGE_ROW }]);
    const [bulkChangeError, setBulkChangeError] = React.useState<string | null>(null);
    const [bulkChangeBusy, setBulkChangeBusy] = React.useState(false);

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
    const [editingId, setEditingId] = React.useState<number | null>(null);
    const [form, setForm] = React.useState<FormState>(EMPTY_FORM);
    const [formError, setFormError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);

    const [deleteTarget, setDeleteTarget] = React.useState<OrderData | null>(null);
    const [deleting, setDeleting] = React.useState(false);

    const [snackbar, setSnackbar] = React.useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const fetchRows = React.useCallback(async () => {
        setFetching(true);
        setFetchError(null);

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .order('id', { ascending: false })
            .range(0, ORDER_DATA_FETCH_MAX_ROWS - 1);

        if (error) {
            setFetchError(error.message);
        } else {
            setRows((data ?? []) as OrderData[]);
        }
        setFetching(false);
    }, []);

    React.useEffect(() => {
        if (!user) return;
        fetchRows();
    }, [user, fetchRows]);

    const filteredRows = React.useMemo(() => {
        const cancelStatusFilteredRows = rows.filter((row) => {
            if (cancelFilter === 'all') return true;
            if (cancelFilter === 'cancelled') return row.cancel_status;
            return !row.cancel_status;
        });

        const hasFtySapQuickFilter = quickFilterFtySapValues.length > 0;
        const hasGtnQuickFilter = quickFilterGtnValues.length > 0;

        const quickFilteredRows = (!hasFtySapQuickFilter && !hasGtnQuickFilter)
            ? cancelStatusFilteredRows
            : cancelStatusFilteredRows.filter((row) => {
                const ftySap = String(row.fty_sap ?? '').trim().toLowerCase();
                const gtn = String(row.gtn ?? '').trim().toLowerCase();

                if (hasFtySapQuickFilter && !quickFilterFtySapValues.includes(ftySap)) {
                    return false;
                }

                if (hasGtnQuickFilter && !quickFilterGtnValues.includes(gtn)) {
                    return false;
                }

                return true;
            });

        const q = search.trim().toLowerCase();
        if (!q) return quickFilteredRows;

        return quickFilteredRows.filter((row) => {
            const pool = [
                row.id,
                row.cancel_status ? 'cancelled' : 'active',
                row.fty_sap,
                row.gtn,
                row.model_number,
                row.model_name,
                row.art,
                row.destination,
                row.old_gtn,
                row.old_sap,
                row.changes,
                row.release_date,
            ];
            return pool.some((value) => String(value ?? '').toLowerCase().includes(q));
        });
    }, [rows, search, cancelFilter, quickFilterFtySapValues, quickFilterGtnValues]);

    const tableData = React.useMemo<OrderTableRow[]>(() => {
        return filteredRows.map((row) => ({
            ...Object.fromEntries(
                SIZE_KEYS.map((field) => [field, row[field]]),
            ) as Record<SizeKey, number | null>,
            id: row.id,
            cancel_status: row.cancel_status ? 'true' : 'false',
            release_date: row.release_date ?? '-',
            fty_sap: row.fty_sap ?? '-',
            gtn: row.gtn ?? '-',
            old_gtn: row.old_gtn ?? '-',
            old_sap: row.old_sap ?? '-',
            model_number: row.model_number ?? '-',
            model_name: row.model_name ?? '-',
            art: row.art ?? '-',
            destination: row.destination ?? '-',
            total_qty: SIZE_KEYS.reduce((sum, field) => sum + (row[field] ?? 0), 0),
            changes: row.changes ?? '-',
        }));
    }, [filteredRows]);

    React.useEffect(() => {
        setSelectedRowId((prev) => {
            if (prev == null) return null;
            return filteredRows.some((row) => row.id === prev) ? prev : null;
        });
    }, [filteredRows]);

    const selectedRow = React.useMemo(
        () => filteredRows.find((row) => row.id === selectedRowId) ?? null,
        [filteredRows, selectedRowId],
    );

    const handleTableSelection = React.useCallback(
        (visualRowIndex: number) => {
            const row = filteredRows[visualRowIndex];
            setSelectedRowId(row ? row.id : null);
        },
        [filteredRows],
    );

    const htTheme = mode === 'dark' ? MUIThemeForHTTableDark : MUIThemeForHTTableLight;

    const bulkPreviewTableData = React.useMemo<BulkUploadPreviewTableRow[]>(() => {
        return bulkUploadPreview.map((item) => {
            const row: BulkUploadPreviewTableRow = {
                source_row: item.sourceRow,
                duplicate_reason: item.duplicateReason ?? '',
                ...Object.fromEntries(
                    UPLOAD_FIELDS.map((field) => [field, item.form[field]]),
                ) as Record<UploadFieldKey, string>,
            };
            return row;
        });
    }, [bulkUploadPreview]);

    const duplicateCount = React.useMemo(
        () => bulkUploadPreview.filter((item) => Boolean(item.duplicateReason)).length,
        [bulkUploadPreview],
    );

    const insertableCount = bulkUploadPreview.length - duplicateCount;

    const handleFieldChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleCancelStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, cancel_status: event.target.checked }));
    };

    const handleCancelFilterChange = (event: SelectChangeEvent<CancelFilter>) => {
        setCancelFilter(event.target.value as CancelFilter);
    };

    const handleOpenQuickActions = (event: React.MouseEvent<HTMLButtonElement>) => {
        setQuickActionsAnchorEl(event.currentTarget);
    };

    const handleCloseQuickActions = () => {
        setQuickActionsAnchorEl(null);
    };

    const isColumnVisible = React.useCallback(
        (key: OrderTableColumnKey) => !hiddenColumns.has(key),
        [hiddenColumns],
    );

    const toggleColumn = (key: OrderTableColumnKey) => {
        setHiddenColumns((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const hiddenColumnIndexes = React.useMemo(
        () => ORDER_TABLE_COLUMN_DEFINITIONS.reduce<number[]>((acc, column, index) => {
            if (hiddenColumns.has(column.key)) acc.push(index);
            return acc;
        }, []),
        [hiddenColumns],
    );

    const handleOpenBulkUpload = () => {
        handleCloseQuickActions();
        setBulkUploadOpen(true);
        setBulkUploadPreview([]);
        setBulkUploadFileName('');
        setBulkUploadError(null);
    };

    const handleOpenQuickFilterMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setQuickFilterAnchorEl(event.currentTarget);
    };

    const handleCloseQuickFilterMenu = () => {
        setQuickFilterAnchorEl(null);
    };

    const handleOpenQuickFilter = (mode: 'fty_sap' | 'gtn') => {
        handleCloseQuickFilterMenu();
        setQuickFilterFtySapInput(quickFilterFtySapValues.join('\n'));
        setQuickFilterGtnInput(quickFilterGtnValues.join('\n'));
        setQuickFilterDialogMode(mode);
        setQuickFilterOpen(true);
    };

    const handleCloseQuickFilter = () => {
        setQuickFilterOpen(false);
    };

    const handleApplyQuickFilter = () => {
        setQuickFilterFtySapValues(parseMultiValueList(quickFilterFtySapInput).map((value) => value.toLowerCase()));
        setQuickFilterGtnValues(parseMultiValueList(quickFilterGtnInput).map((value) => value.toLowerCase()));
        setQuickFilterOpen(false);
    };

    const handleClearQuickFilter = () => {
        setQuickFilterFtySapInput('');
        setQuickFilterGtnInput('');
        setQuickFilterFtySapValues([]);
        setQuickFilterGtnValues([]);
    };

    const handleOpenBulkCancel = () => {
        handleCloseQuickActions();
        setBulkCancelOpen(true);
        setBulkCancelInput('');
        setBulkCancelError(null);
    };

    const handleOpenBulkUncancel = () => {
        handleCloseQuickActions();
        setBulkUncancelOpen(true);
        setBulkUncancelInput('');
        setBulkUncancelError(null);
    };

    const handleOpenBulkChange = (field: BulkChangeField) => {
        handleCloseQuickActions();
        setBulkChangeField(field);
        setBulkChangeOpen(true);
        setBulkChangeRows([{ ...EMPTY_BULK_CHANGE_ROW }]);
        setBulkChangeError(null);
    };

    const handleCloseBulkUpload = () => {
        if (bulkUploadBusy || bulkUploadConfirming) return;
        setBulkUploadOpen(false);
    };

    const handleCloseBulkCancel = () => {
        if (bulkCancelBusy) return;
        setBulkCancelOpen(false);
    };

    const handleCloseBulkUncancel = () => {
        if (bulkUncancelBusy) return;
        setBulkUncancelOpen(false);
    };

    const handleCloseBulkChange = () => {
        if (bulkChangeBusy) return;
        setBulkChangeOpen(false);
    };

    const handleUploadFileClick = () => {
        bulkUploadInputRef.current?.click();
    };

    const parseUploadFile = React.useCallback(async (file: File) => {
        setBulkUploadBusy(true);
        setBulkUploadError(null);
        setBulkUploadPreview([]);
        setBulkUploadFileName(file.name);

        try {
            const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            if (!firstSheetName) {
                throw new Error('The workbook is empty.');
            }

            const worksheet = workbook.Sheets[firstSheetName];
            const aliasMap = buildUploadAliasMap();
            const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
                defval: '',
                raw: true,
            });

            if (rawRows.length === 0) {
                throw new Error('No data rows were found in the first worksheet.');
            }

            const parsedRows: BulkUploadPreviewItem[] = rawRows.map((rawRow, index) => {
                const normalizedRow: Partial<Record<UploadFieldKey, unknown>> = {};

                Object.entries(rawRow).forEach(([header, value]) => {
                    const field = aliasMap.get(normalizeHeader(String(header)));
                    if (field) {
                        normalizedRow[field] = value;
                    }
                });

                const form: FormState = { ...EMPTY_FORM };
                form.cancel_status = false;

                UPLOAD_FIELDS.forEach((field) => {
                    const value = normalizedRow[field];
                    if (field === 'release_date') {
                        form[field] = toDateStringCell(value);
                    } else if (SIZE_KEYS.includes(field as SizeKey)) {
                        form[field] = toIntegerStringCell(value);
                    } else {
                        form[field] = toStringCell(value);
                    }
                });

                return {
                    sourceRow: index + 2,
                    form,
                    duplicateReason: null,
                };
            });

            const fileDupCounter = new Map<string, number>();
            parsedRows.forEach((item) => {
                const key = item.form.fty_sap.trim().toLowerCase();
                if (!key) return;
                fileDupCounter.set(key, (fileDupCounter.get(key) ?? 0) + 1);
            });

            const uploadFtySaps = Array.from(new Set(
                parsedRows
                    .map((item) => item.form.fty_sap.trim())
                    .filter((value) => value.length > 0),
            ));

            const dbDuplicateSet = new Set<string>();
            if (uploadFtySaps.length > 0) {
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .select('fty_sap')
                    .in('fty_sap', uploadFtySaps);

                if (error) {
                    throw new Error(`Failed duplicate check: ${error.message}`);
                }

                for (const row of data ?? []) {
                    const value = String((row as { fty_sap: string | null }).fty_sap ?? '').trim().toLowerCase();
                    if (value) dbDuplicateSet.add(value);
                }
            }

            const preview = parsedRows.map((item) => {
                const key = item.form.fty_sap.trim().toLowerCase();
                const reasons: string[] = [];
                if (!key) {
                    reasons.push('Missing FTY SAP');
                } else {
                    if ((fileDupCounter.get(key) ?? 0) > 1) {
                        reasons.push('Duplicate in upload file');
                    }
                    if (dbDuplicateSet.has(key)) {
                        reasons.push('Already exists in database');
                    }
                }

                return {
                    ...item,
                    duplicateReason: reasons.length ? reasons.join(' | ') : null,
                };
            });

            setBulkUploadPreview(preview);
        } catch (error) {
            setBulkUploadError(error instanceof Error ? error.message : 'Failed to parse upload file.');
        } finally {
            setBulkUploadBusy(false);
        }
    }, []);

    const handleFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isAllowed = /\.(xlsx|xls|ods|csv)$/i.test(file.name);
        if (!isAllowed) {
            setBulkUploadError('Please upload an Excel/CSV file (.xlsx, .xls, .ods, .csv).');
            event.target.value = '';
            return;
        }

        await parseUploadFile(file);
        event.target.value = '';
    };

    const handleConfirmBulkUpload = async () => {
        const readyRows = bulkUploadPreview.filter((item) => !item.duplicateReason);
        if (readyRows.length === 0) {
            setBulkUploadError('No valid rows to insert. Resolve duplicates or upload another file.');
            return;
        }

        setBulkUploadConfirming(true);
        setBulkUploadError(null);

        try {
            const payloads = readyRows.map((item) => buildPayload(item.form));

            for (let index = 0; index < payloads.length; index += 200) {
                const chunk = payloads.slice(index, index + 200);
                const { error } = await supabase.from(TABLE_NAME).insert(chunk);
                if (error) {
                    throw new Error(error.message);
                }
            }

            setBulkUploadOpen(false);
            setSnackbar({
                open: true,
                message: `Bulk upload completed. Inserted ${readyRows.length} row(s), skipped ${duplicateCount} duplicate row(s).`,
                severity: 'success',
            });
            fetchRows();
        } catch (error) {
            setBulkUploadError(error instanceof Error ? error.message : 'Bulk insert failed.');
        } finally {
            setBulkUploadConfirming(false);
        }
    };

    const handleConfirmBulkCancel = async () => {
        const ftySapList = parseFtySapList(bulkCancelInput);
        if (ftySapList.length === 0) {
            setBulkCancelError('Enter at least one FTY SAP value.');
            return;
        }

        setBulkCancelBusy(true);
        setBulkCancelError(null);

        try {
            let updatedCount = 0;

            for (let index = 0; index < ftySapList.length; index += 200) {
                const chunk = ftySapList.slice(index, index + 200);
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .update({ cancel_status: true })
                    .in('fty_sap', chunk)
                    .select('id');

                if (error) {
                    throw new Error(error.message);
                }

                updatedCount += data?.length ?? 0;
            }

            setBulkCancelOpen(false);
            setSnackbar({
                open: true,
                message: `Bulk cancel completed. Updated ${updatedCount} row(s) from ${ftySapList.length} FTY SAP value(s).`,
                severity: 'success',
            });
            fetchRows();
        } catch (error) {
            setBulkCancelError(error instanceof Error ? error.message : 'Bulk cancel failed.');
        } finally {
            setBulkCancelBusy(false);
        }
    };

    const handleConfirmBulkUncancel = async () => {
        const ftySapList = parseFtySapList(bulkUncancelInput);
        if (ftySapList.length === 0) {
            setBulkUncancelError('Enter at least one FTY SAP value.');
            return;
        }

        setBulkUncancelBusy(true);
        setBulkUncancelError(null);

        try {
            let updatedCount = 0;

            for (let index = 0; index < ftySapList.length; index += 200) {
                const chunk = ftySapList.slice(index, index + 200);
                const { data, error } = await supabase
                    .from(TABLE_NAME)
                    .update({ cancel_status: false })
                    .in('fty_sap', chunk)
                    .select('id');

                if (error) {
                    throw new Error(error.message);
                }

                updatedCount += data?.length ?? 0;
            }

            setBulkUncancelOpen(false);
            setSnackbar({
                open: true,
                message: `Bulk uncancel completed. Updated ${updatedCount} row(s) from ${ftySapList.length} FTY SAP value(s).`,
                severity: 'success',
            });
            fetchRows();
        } catch (error) {
            setBulkUncancelError(error instanceof Error ? error.message : 'Bulk uncancel failed.');
        } finally {
            setBulkUncancelBusy(false);
        }
    };

    const handleConfirmBulkChange = async () => {
        let updates: Array<{ ftySap: string; newValue: string }>;
        try {
            updates = parseBulkChangeRows(bulkChangeRows);
        } catch (error) {
            setBulkChangeError(error instanceof Error ? error.message : 'Invalid bulk change input.');
            return;
        }

        if (updates.length === 0) {
            setBulkChangeError('Enter at least one update line.');
            return;
        }

        setBulkChangeBusy(true);
        setBulkChangeError(null);

        try {
            let updatedCount = 0;

            for (const update of updates) {
                if (bulkChangeField === 'destination') {
                    const { data: rowsToUpdate, error: readError } = await supabase
                        .from(TABLE_NAME)
                        .select('id, destination, changes')
                        .eq('fty_sap', update.ftySap);

                    if (readError) {
                        throw new Error(readError.message);
                    }

                    for (const row of rowsToUpdate ?? []) {
                        const oldDestination = String(row.destination ?? '-');
                        const changeMessage = `destination change from ${oldDestination} to ${update.newValue}`;
                        const nextChanges = row.changes
                            ? `${row.changes} | ${changeMessage}`
                            : changeMessage;

                        const { data, error } = await supabase
                            .from(TABLE_NAME)
                            .update({ destination: update.newValue, changes: nextChanges })
                            .eq('id', row.id)
                            .select('id');

                        if (error) {
                            throw new Error(error.message);
                        }

                        updatedCount += data?.length ?? 0;
                    }
                } else if (bulkChangeField === 'gtn') {
                    const { data: rowsToUpdate, error: readError } = await supabase
                        .from(TABLE_NAME)
                        .select('id, gtn, old_gtn, changes')
                        .eq('fty_sap', update.ftySap);

                    if (readError) {
                        throw new Error(readError.message);
                    }

                    for (const row of rowsToUpdate ?? []) {
                        const previousGtn = String(row.gtn ?? '').trim();
                        const newGtn = update.newValue.trim();

                        const updatePayload: {
                            gtn: string;
                            old_gtn?: string;
                            changes?: string;
                        } = {
                            gtn: update.newValue,
                        };

                        if (previousGtn && previousGtn !== newGtn) {
                            updatePayload.old_gtn = previousGtn;
                            const changeMessage = `gtn change from ${previousGtn} to ${newGtn}`;
                            updatePayload.changes = row.changes
                                ? `${row.changes} | ${changeMessage}`
                                : changeMessage;
                        }

                        const { data, error } = await supabase
                            .from(TABLE_NAME)
                            .update(updatePayload)
                            .eq('id', row.id)
                            .select('id');

                        if (error) {
                            throw new Error(error.message);
                        }

                        updatedCount += data?.length ?? 0;
                    }
                } else {
                    const { data, error } = await supabase
                        .from(TABLE_NAME)
                        .update({ [bulkChangeField]: update.newValue })
                        .eq('fty_sap', update.ftySap)
                        .select('id');

                    if (error) {
                        throw new Error(error.message);
                    }

                    updatedCount += data?.length ?? 0;
                }
            }

            const fieldLabel = getBulkChangeFieldLabel(bulkChangeField);

            setBulkChangeOpen(false);
            setSnackbar({
                open: true,
                message: `Bulk change ${fieldLabel} completed. Updated ${updatedCount} row(s) from ${updates.length} mapping line(s).`,
                severity: 'success',
            });
            fetchRows();
        } catch (error) {
            setBulkChangeError(error instanceof Error ? error.message : 'Bulk change failed.');
        } finally {
            setBulkChangeBusy(false);
        }
    };

    const handleBulkChangeRowChange = (rowIndex: number, field: keyof BulkChangeRow) => (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const value = event.target.value;
        setBulkChangeRows((prev) => {
            const next = prev.map((row) => ({ ...row }));
            if (!next[rowIndex]) {
                next[rowIndex] = { ...EMPTY_BULK_CHANGE_ROW };
            }
            next[rowIndex] = { ...next[rowIndex], [field]: value };
            return normalizeBulkChangeRows(next);
        });
    };

    const handleBulkChangePaste = (rowIndex: number, columnIndex: 0 | 1) => (
        event: React.ClipboardEvent<HTMLInputElement>,
    ) => {
        const pastedText = event.clipboardData.getData('text');
        if (!pastedText.includes('\t') && !pastedText.includes('\n')) {
            return;
        }

        const matrix = pastedText
            .replace(/\r/g, '')
            .split('\n')
            .filter((line) => line.length > 0)
            .map((line) => line.split('\t'));

        if (matrix.length === 0) return;

        event.preventDefault();

        setBulkChangeRows((prev) => {
            const next = prev.map((row) => ({ ...row }));

            matrix.forEach((rowValues, pastedRowOffset) => {
                const targetRow = rowIndex + pastedRowOffset;
                if (!next[targetRow]) {
                    next[targetRow] = { ...EMPTY_BULK_CHANGE_ROW };
                }

                rowValues.forEach((cellValue, pastedColumnOffset) => {
                    const targetColumn = columnIndex + pastedColumnOffset;
                    if (targetColumn > 1) return;
                    if (targetColumn === 0) {
                        next[targetRow].ftySap = cellValue.trim();
                    } else {
                        next[targetRow].newValue = cellValue.trim();
                    }
                });
            });

            return normalizeBulkChangeRows(next);
        });
    };

    const openAddDialog = () => {
        setDialogMode('add');
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setDialogOpen(true);
    };

    const openEditDialog = (row: OrderData) => {
        setDialogMode('edit');
        setEditingId(row.id);
        setForm(mapRowToForm(row));
        setFormError(null);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        if (saving) return;
        setDialogOpen(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setFormError(null);

        let payload: Record<string, string | number | boolean | null>;
        try {
            payload = buildPayload(form);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Failed to validate form values.');
            setSaving(false);
            return;
        }

        if (dialogMode === 'edit' && editingId) {
            const existingRow = rows.find((row) => row.id === editingId);
            const previousGtn = String(existingRow?.gtn ?? '').trim();
            const nextGtn = form.gtn.trim();
            const existingChanges = String(existingRow?.changes ?? '').trim();

            if (previousGtn && previousGtn !== nextGtn) {
                payload.old_gtn = previousGtn;

                const alreadyHasChangeLog = form.changes.trim().length > 0;
                if (!alreadyHasChangeLog) {
                    const changeMessage = `gtn change from ${previousGtn} to ${nextGtn || '-'}`;
                    payload.changes = existingChanges ? `${existingChanges} | ${changeMessage}` : changeMessage;
                }
            }
        }

        if (dialogMode === 'add') {
            const { error } = await supabase.from(TABLE_NAME).insert(payload);
            if (error) {
                setFormError(error.message);
                setSaving(false);
                return;
            }
        } else {
            if (!editingId) {
                setFormError('Missing row ID for update.');
                setSaving(false);
                return;
            }
            const { error } = await supabase.from(TABLE_NAME).update(payload).eq('id', editingId);
            if (error) {
                setFormError(error.message);
                setSaving(false);
                return;
            }
        }

        setSaving(false);
        setDialogOpen(false);
        setSnackbar({
            open: true,
            message: dialogMode === 'add' ? 'Order data row created.' : 'Order data row updated.',
            severity: 'success',
        });
        fetchRows();
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', deleteTarget.id);
        setDeleting(false);

        if (error) {
            setSnackbar({ open: true, message: error.message, severity: 'error' });
        } else {
            setSnackbar({ open: true, message: 'Order data row deleted.', severity: 'success' });
            fetchRows();
        }
        setDeleteTarget(null);
    };

    return (
        <AppLayout>
            <Head>
                <title>Order Data - LabelManager</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <Box sx={{ py: 4, px: { xs: 2, md: 4 }, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                    <Inventory2Icon sx={{ color: 'primary.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Order Data
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage records from public.order_data
                        </Typography>
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="Refresh data">
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={() => { fetchRows(); }}
                                    disabled={fetching}
                                    aria-label="Refresh order data"
                                >
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Chip
                            label={`${filteredRows.length} record${filteredRows.length !== 1 ? 's' : ''}`}
                            color="primary"
                            variant="outlined"
                            size="small"
                        />
                    </Box>
                </Box>

                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                placeholder="Search by SAP, GTN, model, ART, destination, status..."
                                value={search}
                                onChange={(event) => { setSearch(event.target.value); }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: search ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearch('')}>
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : undefined,
                                }}
                                sx={{ width: { xs: '100%', sm: 420 } }}
                            />
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel id="cancel-status-filter-label">Cancel Status</InputLabel>
                                <Select
                                    labelId="cancel-status-filter-label"
                                    value={cancelFilter}
                                    label="Cancel Status"
                                    onChange={handleCancelFilterChange}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="active">Active Only</MenuItem>
                                    <MenuItem value="cancelled">Cancelled Only</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="outlined"
                                startIcon={<ViewColumnIcon fontSize="small" />}
                                onClick={(event) => setColumnsMenuAnchor(event.currentTarget)}
                            >
                                Columns
                            </Button>
                            <Button
                                variant="outlined"
                                endIcon={<ArrowDropDownIcon />}
                                onClick={handleOpenQuickFilterMenu}
                            >
                                Quick Filter
                            </Button>
                            <Button
                                variant="outlined"
                                endIcon={<ArrowDropDownIcon />}
                                onClick={handleOpenQuickActions}
                                sx={{ ml: { xs: 0, md: 'auto' } }}
                            >
                                Quick Actions
                            </Button>
                        </Box>

                        <Menu
                            anchorEl={columnsMenuAnchor}
                            open={Boolean(columnsMenuAnchor)}
                            onClose={() => setColumnsMenuAnchor(null)}
                        >
                            {ORDER_TABLE_COLUMN_DEFINITIONS.map((column) => (
                                <MenuItem key={column.key} dense onClick={() => toggleColumn(column.key)}>
                                    <Checkbox size="small" checked={isColumnVisible(column.key)} sx={{ p: 0.5, mr: 1 }} />
                                    <ListItemText primary={column.label} />
                                </MenuItem>
                            ))}
                        </Menu>

                        <Menu
                            anchorEl={quickActionsAnchorEl}
                            open={quickActionsOpen}
                            onClose={handleCloseQuickActions}
                        >
                            <MenuItem onClick={handleOpenBulkUpload}>
                                <UploadFileIcon fontSize="small" sx={{ mr: 1 }} />
                                Upload Orders
                            </MenuItem>
                            <MenuItem onClick={handleOpenBulkCancel}>
                                <ClearIcon fontSize="small" sx={{ mr: 1 }} />
                                Bulk Cancel Orders
                            </MenuItem>
                            <MenuItem onClick={handleOpenBulkUncancel}>
                                <ClearIcon fontSize="small" sx={{ mr: 1 }} />
                                Bulk Uncancel Orders
                            </MenuItem>
                            <MenuItem onClick={() => { handleOpenBulkChange('gtn'); }}>
                                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                Bulk Change GTN
                            </MenuItem>
                            <MenuItem onClick={() => { handleOpenBulkChange('fty_sap'); }}>
                                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                Bulk Change FTY SAP
                            </MenuItem>
                            <MenuItem onClick={() => { handleOpenBulkChange('destination'); }}>
                                <EditIcon fontSize="small" sx={{ mr: 1 }} />
                                Bulk Change Destination
                            </MenuItem>
                        </Menu>

                        <Menu
                            anchorEl={quickFilterAnchorEl}
                            open={quickFilterMenuOpen}
                            onClose={handleCloseQuickFilterMenu}
                        >
                            <MenuItem onClick={() => { handleOpenQuickFilter('fty_sap'); }}>
                                <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                                Multi FTY SAP
                            </MenuItem>
                            <MenuItem onClick={() => { handleOpenQuickFilter('gtn'); }}>
                                <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                                Multi GTN
                            </MenuItem>
                        </Menu>

                        <input
                            ref={bulkUploadInputRef}
                            type="file"
                            accept=".xlsx,.xls,.ods,.csv"
                            style={{ display: 'none' }}
                            onChange={handleFileInputChange}
                        />

                        {fetchError && (
                            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                                Failed to load data: {fetchError}
                            </Typography>
                        )}

                        {selectedRow ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                Selected row: #{selectedRow.id}
                            </Typography>
                        ) : null}

                        {fetching ? (
                            <Box sx={{ display: 'grid', placeItems: 'center', py: 8, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <CircularProgress size={32} />
                            </Box>
                        ) : filteredRows.length === 0 ? (
                            <Box sx={{ display: 'grid', placeItems: 'center', py: 8, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    {search ? 'No records match your search.' : 'No order data records found.'}
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                                <HotTable
                                    theme={htTheme}
                                    data={tableData}
                                    columns={HOT_COLUMNS}
                                    colHeaders={HOT_HEADERS}
                                    rowHeaders
                                    width="100%"
                                    height={540}
                                    stretchH="all"
                                    manualColumnResize
                                    columnSorting
                                    dropdownMenu
                                    filters
                                    hiddenColumns={{ columns: hiddenColumnIndexes, indicators: false }}
                                    navigableHeaders
                                    licenseKey="non-commercial-and-evaluation"
                                    afterSelectionEnd={(row) => {
                                        handleTableSelection(row);
                                    }}
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Box>

            <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="lg">
                <DialogTitle>{dialogMode === 'add' ? 'Add Order Data Row' : `Edit Row #${editingId}`}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0 }}>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={<Checkbox checked={form.cancel_status} onChange={handleCancelStatusChange} />}
                                label="Cancel status"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="FTY SAP" value={form.fty_sap} onChange={handleFieldChange('fty_sap')} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="GTN" value={form.gtn} onChange={handleFieldChange('gtn')} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField
                                fullWidth
                                label="Release Date"
                                type="date"
                                value={form.release_date}
                                onChange={handleFieldChange('release_date')}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="Model Number" value={form.model_number} onChange={handleFieldChange('model_number')} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="Model Name" value={form.model_name} onChange={handleFieldChange('model_name')} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="ART" value={form.art} onChange={handleFieldChange('art')} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="Destination" value={form.destination} onChange={handleFieldChange('destination')} />
                        </Grid>

                        {SIZE_KEYS.map((field) => (
                            <Grid item xs={6} sm={4} md={2} key={field}>
                                <TextField
                                    fullWidth
                                    label={field.replace('_', ' ').toUpperCase()}
                                    type="number"
                                    value={form[field]}
                                    onChange={handleFieldChange(field)}
                                />
                            </Grid>
                        ))}

                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="Old GTN" value={form.old_gtn} onChange={handleFieldChange('old_gtn')} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={4}>
                            <TextField fullWidth label="Old SAP" value={form.old_sap} onChange={handleFieldChange('old_sap')} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Changes"
                                value={form.changes}
                                onChange={handleFieldChange('changes')}
                                multiline
                                minRows={2}
                            />
                        </Grid>
                    </Grid>
                    {formError && <Alert severity="error" sx={{ mt: 2 }}>{formError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} variant="contained" disabled={saving}>
                        {saving ? 'Saving...' : dialogMode === 'add' ? 'Create' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={bulkUploadOpen} onClose={handleCloseBulkUpload} fullWidth maxWidth="xl">
                <DialogTitle>Upload Orders</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', mb: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<UploadFileIcon />}
                            onClick={handleUploadFileClick}
                            disabled={bulkUploadBusy || bulkUploadConfirming}
                        >
                            Choose File
                        </Button>
                        <Typography variant="body2" color="text.secondary">
                            {bulkUploadFileName ? `Selected: ${bulkUploadFileName}` : 'Allowed: .xlsx, .xls, .ods, .csv'}
                        </Typography>
                    </Box>

                    {bulkUploadError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {bulkUploadError}
                        </Alert>
                    )}

                    {bulkUploadBusy ? (
                        <Box sx={{ display: 'grid', placeItems: 'center', py: 5 }}>
                            <CircularProgress size={28} />
                        </Box>
                    ) : bulkUploadPreview.length > 0 ? (
                        <>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                <Chip label={`${bulkUploadPreview.length} row(s) loaded`} color="default" size="small" />
                                <Chip label={`${insertableCount} row(s) ready to insert`} color="success" size="small" />
                                <Chip label={`${duplicateCount} duplicate/invalid row(s)`} color="warning" size="small" />
                            </Box>
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                                <HotTable
                                    theme={htTheme}
                                    data={bulkPreviewTableData}
                                    columns={BULK_PREVIEW_COLUMNS}
                                    colHeaders={BULK_PREVIEW_HEADERS}
                                    rowHeaders
                                    width="100%"
                                    height={450}
                                    stretchH="all"
                                    manualColumnResize
                                    columnSorting
                                    filters
                                    dropdownMenu
                                    licenseKey="non-commercial-and-evaluation"
                                />
                            </Box>
                        </>
                    ) : (
                        <Alert severity="info">
                            Upload your order data file to preview and validate duplicates by FTY SAP before insert.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseBulkUpload} disabled={bulkUploadBusy || bulkUploadConfirming}>Close</Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirmBulkUpload}
                        disabled={bulkUploadBusy || bulkUploadConfirming || bulkUploadPreview.length === 0 || insertableCount === 0}
                    >
                        {bulkUploadConfirming ? 'Uploading...' : `Confirm Insert (${insertableCount})`}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={bulkCancelOpen} onClose={handleCloseBulkCancel} fullWidth maxWidth="sm">
                <DialogTitle>Bulk Cancel Orders</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter one or more FTY SAP values separated by newline, comma, semicolon, or tab.
                    </Typography>
                    <TextField
                        fullWidth
                        label="FTY SAP values"
                        value={bulkCancelInput}
                        onChange={(event) => { setBulkCancelInput(event.target.value); }}
                        multiline
                        minRows={6}
                        placeholder={'12345\n12346\n12347'}
                        disabled={bulkCancelBusy}
                    />
                    {bulkCancelError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {bulkCancelError}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseBulkCancel} disabled={bulkCancelBusy}>Close</Button>
                    <Button variant="contained" onClick={handleConfirmBulkCancel} disabled={bulkCancelBusy}>
                        {bulkCancelBusy ? 'Cancelling...' : 'Confirm Cancel'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={quickFilterOpen} onClose={handleCloseQuickFilter} fullWidth maxWidth="sm">
                <DialogTitle>
                    {quickFilterDialogMode === 'fty_sap'
                        ? 'Quick Filter - Multi FTY SAP'
                        : 'Quick Filter - Multi GTN'}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter one or more values separated by newline, comma, semicolon, or tab.
                    </Typography>
                    {quickFilterDialogMode !== 'gtn' && (
                        <TextField
                            fullWidth
                            label="Multi FTY SAP"
                            value={quickFilterFtySapInput}
                            onChange={(event) => { setQuickFilterFtySapInput(event.target.value); }}
                            multiline
                            minRows={4}
                            placeholder={'12345\n12346\n12347'}
                        />
                    )}
                    {quickFilterDialogMode !== 'fty_sap' && (
                        <TextField
                            fullWidth
                            label="Multi GTN"
                            value={quickFilterGtnInput}
                            onChange={(event) => { setQuickFilterGtnInput(event.target.value); }}
                            multiline
                            minRows={4}
                            placeholder={'450000001\n450000002\n450000003'}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClearQuickFilter}>Clear Applied Filter</Button>
                    <Button onClick={handleCloseQuickFilter}>Close</Button>
                    <Button variant="contained" onClick={handleApplyQuickFilter}>Apply Filter</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={bulkUncancelOpen} onClose={handleCloseBulkUncancel} fullWidth maxWidth="sm">
                <DialogTitle>Bulk Uncancel Orders</DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter one or more FTY SAP values separated by newline, comma, semicolon, or tab.
                    </Typography>
                    <TextField
                        fullWidth
                        label="FTY SAP values"
                        value={bulkUncancelInput}
                        onChange={(event) => { setBulkUncancelInput(event.target.value); }}
                        multiline
                        minRows={6}
                        placeholder={'12345\n12346\n12347'}
                        disabled={bulkUncancelBusy}
                    />
                    {bulkUncancelError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {bulkUncancelError}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseBulkUncancel} disabled={bulkUncancelBusy}>Close</Button>
                    <Button variant="contained" onClick={handleConfirmBulkUncancel} disabled={bulkUncancelBusy}>
                        {bulkUncancelBusy ? 'Uncancelling...' : 'Confirm Uncancel'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={bulkChangeOpen} onClose={handleCloseBulkChange} fullWidth maxWidth="md">
                <DialogTitle>
                    {`Bulk Change ${getBulkChangeFieldLabel(bulkChangeField)}`}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Paste directly from Excel. The table auto-adds rows when multiple lines are pasted.
                    </Typography>
                    <Box
                        sx={{
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            borderRadius: 1,
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                bgcolor: 'action.hover',
                                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <Box sx={{ px: 1.5, py: 1, borderRight: (theme) => `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="subtitle2">FTY SAP</Typography>
                            </Box>
                            <Box sx={{ px: 1.5, py: 1 }}>
                                <Typography variant="subtitle2">{getBulkChangeNewValueHeader(bulkChangeField)}</Typography>
                            </Box>
                        </Box>

                        <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                            {bulkChangeRows.map((row, index) => (
                                <Box
                                    key={`bulk-change-row-${index}`}
                                    sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        borderBottom: index === bulkChangeRows.length - 1
                                            ? 'none'
                                            : (theme) => `1px solid ${theme.palette.divider}`,
                                    }}
                                >
                                    <Box sx={{ borderRight: (theme) => `1px solid ${theme.palette.divider}` }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            variant="standard"
                                            value={row.ftySap}
                                            onChange={handleBulkChangeRowChange(index, 'ftySap')}
                                            onPaste={handleBulkChangePaste(index, 0)}
                                            placeholder={index === 0 ? 'e.g. 12345' : undefined}
                                            disabled={bulkChangeBusy}
                                            InputProps={{ disableUnderline: true, sx: { px: 1.5, py: 1 } }}
                                        />
                                    </Box>
                                    <Box>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            variant="standard"
                                            value={row.newValue}
                                            onChange={handleBulkChangeRowChange(index, 'newValue')}
                                            onPaste={handleBulkChangePaste(index, 1)}
                                            placeholder={index === 0 ? 'e.g. NEW_VALUE' : undefined}
                                            disabled={bulkChangeBusy}
                                            InputProps={{ disableUnderline: true, sx: { px: 1.5, py: 1 } }}
                                        />
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    {bulkChangeError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {bulkChangeError}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseBulkChange} disabled={bulkChangeBusy}>Close</Button>
                    <Button variant="contained" onClick={handleConfirmBulkChange} disabled={bulkChangeBusy}>
                        {bulkChangeBusy ? 'Updating...' : 'Confirm Update'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={Boolean(deleteTarget)} onClose={() => { if (!deleting) setDeleteTarget(null); }}>
                <DialogTitle>Delete Order Data Row</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {`Delete row #${deleteTarget?.id ?? ''}? This action cannot be undone.`}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
                    <Button color="error" variant="contained" onClick={handleDeleteConfirm} disabled={deleting}>
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3500}
                onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    elevation={6}
                    variant="filled"
                    onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AppLayout>
    );
}
