import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import ClearIcon from '@mui/icons-material/Clear';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import type Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { registerTheme } from 'handsontable/themes';

import { supabase } from '../lib/supabaseClient';
import { useColorMode } from '../context/ColorModeContext';
import AppLayout from '../components/AppLayout';
import type { OrderData } from '../types';

// Registers sorting, filters, dropdown menu, etc.
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

const TABLE_NAME = 'order_data';

type MovementRow = Pick<
    OrderData,
    'id' | 'fty_sap' | 'model_name' | 'art' | 'destination' | 'in_at' | 'in_by' | 'out_at' | 'out_by'
>;

type StatusFilter = 'all' | 'in' | 'out' | 'completed';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'in', label: 'In' },
    { value: 'out', label: 'Out' },
    { value: 'completed', label: 'Completed (In + Out)' },
];

function formatDate(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusOf(row: MovementRow): string {
    const hasIn = Boolean(row.in_at);
    const hasOut = Boolean(row.out_at);
    if (hasIn && hasOut) return 'Completed';
    if (hasIn) return 'In';
    if (hasOut) return 'Out';
    return 'Not Started';
}

function toIsoDateOnly(value: string): string | null {
    if (!value) return null;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export default function PoMovementHistoryPage() {
    const router = useRouter();
    const { mode } = useColorMode();

    const [rows, setRows] = React.useState<MovementRow[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    const [searchInput, setSearchInput] = React.useState('');
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');
    const [dateFrom, setDateFrom] = React.useState('');
    const [dateTo, setDateTo] = React.useState('');

    const [summary, setSummary] = React.useState({ total: 0, in: 0, out: 0, completed: 0, pending: 0 });

    // Debounce the search box so we don't fire a query per keystroke.
    React.useEffect(() => {
        const t = setTimeout(() => setSearch(searchInput.trim()), 400);
        return () => clearTimeout(t);
    }, [searchInput]);

    const fetchSummary = React.useCallback(async () => {
        const countOf = async (build: (q: any) => any) => {
            const { count, error: err } = await build(
                supabase.from(TABLE_NAME).select('id', { count: 'exact', head: true })
            );
            if (err) throw new Error(err.message);
            return count ?? 0;
        };

        try {
            const [total, inCount, outCount, completed, pending] = await Promise.all([
                countOf((q) => q),
                countOf((q) => q.not('in_at', 'is', null)),
                countOf((q) => q.not('out_at', 'is', null)),
                countOf((q) => q.not('in_at', 'is', null).not('out_at', 'is', null)),
                countOf((q) => q.is('in_at', null).is('out_at', null)),
            ]);
            setSummary({ total, in: inCount, out: outCount, completed, pending });
        } catch (err) {
            console.error('Failed to load movement summary:', err);
        }
    }, []);

    const fetchRows = React.useCallback(async () => {
        setLoading(true);
        setError(null);

        const normalizedFrom = toIsoDateOnly(dateFrom);
        const normalizedTo = toIsoDateOnly(dateTo);
        const effectiveFrom =
            normalizedFrom && normalizedTo && normalizedFrom > normalizedTo ? normalizedTo : normalizedFrom;
        const effectiveTo =
            normalizedFrom && normalizedTo && normalizedFrom > normalizedTo ? normalizedFrom : normalizedTo;

        const buildQuery = () => {
            let query = supabase
                .from(TABLE_NAME)
                .select('id, fty_sap, model_name, art, destination, in_at, in_by, out_at, out_by');

            // Only show POs that have actual in/out activity.
            query = query.or('in_at.not.is.null,out_at.not.is.null');

            if (search) {
                // Commas would break PostgREST's or() syntax, and %/_ are ilike wildcards.
                const term = `%${search.replace(/[,%_]/g, ' ')}%`;
                query = query.or(`fty_sap.ilike.${term},model_name.ilike.${term},art.ilike.${term}`);
            }

            switch (statusFilter) {
                case 'in':
                    query = query.not('in_at', 'is', null);
                    break;
                case 'out':
                    query = query.not('out_at', 'is', null);
                    break;
                case 'completed':
                    query = query.not('in_at', 'is', null).not('out_at', 'is', null);
                    break;
            }

            if (effectiveFrom || effectiveTo) {
                const inFilters = ['in_at.not.is.null'];
                const outFilters = ['out_at.not.is.null'];
                if (effectiveFrom) {
                    inFilters.push(`in_at.gte.${effectiveFrom}`);
                    outFilters.push(`out_at.gte.${effectiveFrom}`);
                }
                if (effectiveTo) {
                    inFilters.push(`in_at.lte.${effectiveTo}`);
                    outFilters.push(`out_at.lte.${effectiveTo}`);
                }

                query = query.or(`and(${inFilters.join(',')}),and(${outFilters.join(',')})`);
            }

            return query;
        };

        try {
            // Fetch every matching row in batches so no activity is truncated.
            const BATCH_SIZE = 1000;
            const allRows: MovementRow[] = [];
            let from = 0;
            for (;;) {
                const { data, error: err } = await buildQuery().range(from, from + BATCH_SIZE - 1);
                if (err) throw new Error(err.message);
                const batch = (data as MovementRow[]) ?? [];
                allRows.push(...batch);
                if (batch.length < BATCH_SIZE) break;
                from += BATCH_SIZE;
            }

            // Newest activity first.
            const activityTime = (row: MovementRow) => {
                const inTime = row.in_at ? new Date(row.in_at).getTime() : 0;
                const outTime = row.out_at ? new Date(row.out_at).getTime() : 0;
                return Math.max(inTime, outTime);
            };
            allRows.sort((a, b) => activityTime(b) - activityTime(a));

            setRows(allRows);
        } catch (err) {
            console.error('Failed to load PO movement:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setRows([]);
        }
        setLoading(false);
    }, [search, statusFilter, dateFrom, dateTo]);

    React.useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    React.useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    function handleRefresh() {
        fetchSummary();
        fetchRows();
    }

    function clearDateRange() {
        setDateFrom('');
        setDateTo('');
    }

    const hasDateFilter = Boolean(dateFrom || dateTo);

    const htTheme = mode === 'dark' ? MUIThemeForHTTableDark : MUIThemeForHTTableLight;

    // Flatten each row for the grid, with the status derived from in/out activity.
    const tableData = React.useMemo(
        () =>
            rows.map((row) => ({
                id: row.id,
                fty_sap: row.fty_sap ?? '—',
                model_name: row.model_name ?? '—',
                art: row.art ?? '—',
                destination: row.destination ?? '—',
                in_at: formatDate(row.in_at),
                in_by: row.in_by ?? '—',
                out_at: formatDate(row.out_at),
                out_by: row.out_by ?? '—',
                status: statusOf(row),
            })),
        [rows]
    );

    // Cell renderers — Handsontable renders into plain DOM <td> nodes.
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
            td.textContent = (value as string) ?? '—';
            return td;
        },
        []
    );

    const statusRenderer = React.useCallback(
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
            td.style.backgroundColor = 'transparent';

            const badge = document.createElement('span');
            badge.style.display = 'inline-block';
            badge.style.padding = '2px 8px';
            badge.style.borderRadius = '999px';
            badge.style.fontWeight = '600';
            badge.style.fontSize = '12px';
            badge.style.lineHeight = '1.2';
            if (value === 'Completed') {
                badge.style.backgroundColor = mode === 'dark' ? '#0f3a20' : '#e6f4ea';
                badge.style.color = mode === 'dark' ? '#81c995' : '#137333';
            } else if (value === 'In') {
                badge.style.backgroundColor = mode === 'dark' ? '#102a4c' : '#e8f0fe';
                badge.style.color = mode === 'dark' ? '#8ab4f8' : '#1967d2';
            } else if (value === 'Out') {
                badge.style.backgroundColor = mode === 'dark' ? '#3c2f0b' : '#fef7e0';
                badge.style.color = mode === 'dark' ? '#fdd663' : '#8a5a00';
            } else {
                badge.style.backgroundColor = mode === 'dark' ? '#2c2c2c' : '#f1f3f4';
                badge.style.color = mode === 'dark' ? '#9aa0a6' : '#5f6368';
            }
            badge.textContent = (value as string) ?? '—';
            td.appendChild(badge);
            return td;
        },
        [mode]
    );

    const hotColumns = React.useMemo<Handsontable.ColumnSettings[]>(
        () => [
            { data: 'fty_sap', type: 'text', readOnly: true },
            { data: 'model_name', type: 'text', readOnly: true },
            { data: 'art', type: 'text', readOnly: true },
            { data: 'destination', type: 'text', readOnly: true },
            { data: 'in_at', type: 'text', readOnly: true, renderer: dateRenderer },
            { data: 'in_by', type: 'text', readOnly: true },
            { data: 'out_at', type: 'text', readOnly: true, renderer: dateRenderer },
            { data: 'out_by', type: 'text', readOnly: true },
            { data: 'status', type: 'text', readOnly: true, renderer: statusRenderer },
        ],
        [dateRenderer, statusRenderer]
    );

    const HOT_HEADERS = ['PO', 'Model', 'Article', 'Destination', 'In At', 'In By', 'Out At', 'Out By', 'Status'];

    const summaryCards = [
        { label: 'Total POs', value: summary.total, icon: <Inventory2Icon />, color: 'text.primary' },
        { label: 'In', value: summary.in, icon: <LoginIcon />, color: 'info.main' },
        { label: 'Out', value: summary.out, icon: <LogoutIcon />, color: 'warning.main' },
        { label: 'Completed', value: summary.completed, icon: <TaskAltIcon />, color: 'success.main' },
        { label: 'Not Started', value: summary.pending, icon: <PendingActionsIcon />, color: 'text.secondary' },
    ];

    return (
        <AppLayout>
            <Head>
                <title>PO Movement — LabelManager</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 }, flex: 1 }}>
                {/* Page header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            PO Movement
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Track in &amp; out movement of purchase orders.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<QrCodeScannerIcon />}
                        onClick={() => router.push('/po-movement')}
                        sx={{ textTransform: 'none' }}
                    >
                        Record Movement
                    </Button>
                </Box>

                {/* Summary cards */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {summaryCards.map((card) => (
                        <Grid item xs={6} sm={4} md={2.4} key={card.label}>
                            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: card.color, mb: 0.5 }}>
                                        {card.icon}
                                        <Typography variant="body2" color="text.secondary">
                                            {card.label}
                                        </Typography>
                                    </Box>
                                    <Typography variant="h5" fontWeight={700}>
                                        {card.value.toLocaleString()}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Filters */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField
                            size="small"
                            placeholder="Search PO, model, or article…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            sx={{ minWidth: 260, flex: 1 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                                endAdornment: searchInput ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchInput('')}>
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                        />
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                            <InputLabel id="movement-status-label">Status</InputLabel>
                            <Select
                                labelId="movement-status-label"
                                value={statusFilter}
                                label="Status"
                                onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value as StatusFilter)}
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 280 }}>
                            <TextField
                                size="small"
                                type="date"
                                label="From"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 140 }}
                            />
                            <TextField
                                size="small"
                                type="date"
                                label="To"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{ minWidth: 140 }}
                            />
                            {hasDateFilter ? (
                                <Tooltip title="Clear date range">
                                    <IconButton size="small" onClick={clearDateRange}>
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            ) : null}
                        </Box>
                        <Tooltip title="Refresh">
                            <IconButton onClick={handleRefresh} disabled={loading}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </CardContent>
                </Card>

                {/* Movement table — Handsontable handles column sorting, per-column
                    filters (via the header dropdown menu) and virtual scrolling natively. */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {loading ? (
                            <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
                                <CircularProgress size={32} />
                            </Box>
                        ) : error ? (
                            <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
                                <Typography color="error">Failed to load data: {error}</Typography>
                            </Box>
                        ) : rows.length === 0 ? (
                            <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
                                <SwapHorizIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                <Typography color="text.secondary">No PO movement records found.</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                                <HotTable
                                    theme={htTheme}
                                    data={tableData}
                                    columns={hotColumns}
                                    colHeaders={HOT_HEADERS}
                                    rowHeaders
                                    width="100%"
                                    height={540}
                                    stretchH="all"
                                    manualColumnResize
                                    columnSorting
                                    dropdownMenu
                                    filters
                                    navigableHeaders
                                    licenseKey="non-commercial-and-evaluation"
                                />
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </AppLayout>
    );
}
