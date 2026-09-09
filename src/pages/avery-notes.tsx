import * as React from 'react';
import Head from 'next/head';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ClearIcon from '@mui/icons-material/Clear';
import ListAltIcon from '@mui/icons-material/ListAlt';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AppLayout from '../components/AppLayout';
import type { AveryNoteItem, Department, InputType } from '../types';

const CHIP_COLORS: Array<'primary' | 'secondary' | 'warning' | 'success' | 'info' | 'error'> = [
    'primary',
    'secondary',
    'warning',
    'success',
    'info',
    'error',
];

function colorForId(id: string | null): 'primary' | 'secondary' | 'warning' | 'success' | 'info' | 'error' | 'default' {
    if (!id) return 'default';
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return CHIP_COLORS[hash % CHIP_COLORS.length];
}

type Order = 'asc' | 'desc';
type OrderByKey = keyof AveryNoteItem;

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
    const aVal = a[orderBy];
    const bVal = b[orderBy];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (bVal < aVal) return -1;
    if (bVal > aVal) return 1;
    return 0;
}

function getComparator(order: Order, orderBy: OrderByKey) {
    return order === 'desc'
        ? (a: AveryNoteItem, b: AveryNoteItem) => descendingComparator(a, b, orderBy)
        : (a: AveryNoteItem, b: AveryNoteItem) => -descendingComparator(a, b, orderBy);
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

    const [search, setSearch] = React.useState('');
    const [dateFrom, setDateFrom] = React.useState('');
    const [dateTo, setDateTo] = React.useState('');
    const [multiPoOpen, setMultiPoOpen] = React.useState(false);
    const [multiPoText, setMultiPoText] = React.useState('');
    const [multiPoList, setMultiPoList] = React.useState<string[]>([]);
    const [multiPoNotFound, setMultiPoNotFound] = React.useState<string[]>([]);
    const [deptFilter, setDeptFilter] = React.useState<string>('');
    const [inputFilter, setInputFilter] = React.useState<string>('');
    const [doneFilter, setDoneFilter] = React.useState<string>('all');
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<OrderByKey>('seq');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

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
            const [itemsRes, deptRes, inputRes] = await Promise.all([
                supabase
                    .from('ila_avery_note_items')
                    .select('id, seq, po_no, remark, print_qty, created_at, done, input_id, dept_id, returned')
                    .order('seq', { ascending: true }),
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
    }, [user]);

    const handleRequestSort = (property: OrderByKey) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
        setPage(0);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const filteredRows = React.useMemo(() => {
        const q = search.toLowerCase();
        const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
        const to = dateTo ? new Date(dateTo).setHours(23, 59, 59, 999) : null;
        return rows.filter((r) => {
            if (q) {
                const matchText =
                    (r.po_no ?? '').toLowerCase().includes(q) ||
                    (r.remark ?? '').toLowerCase().includes(q) ||
                    String(r.seq ?? '').includes(q) ||
                    String(r.print_qty ?? '').includes(q);
                if (!matchText) return false;
            }
            if (from !== null || to !== null) {
                const ts = r.created_at ? new Date(r.created_at).getTime() : null;
                if (ts === null) return false;
                if (from !== null && ts < from) return false;
                if (to !== null && ts > to) return false;
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
    }, [rows, search, dateFrom, dateTo, multiPoList, deptFilter, inputFilter, doneFilter]);

    const sortedRows = React.useMemo(
        () => [...filteredRows].sort(getComparator(order, orderBy)),
        [filteredRows, order, orderBy]
    );

    const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <AppLayout>
            <Head>
                <title>Avery Notes — LabelManager</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <Box sx={{ py: 4, px: { xs: 2, md: 4 }, flex: 1 }}>
                        {/* Page header */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                            <NoteAltIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                            <Box>
                                <Typography variant="h4" fontWeight={700}>
                                    Avery Notes
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Avery note print queue items
                                </Typography>
                            </Box>
                            <Box sx={{ ml: 'auto' }}>
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
                                        onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ width: 160 }}
                                    />
                                    <TextField
                                        size="small"
                                        label="To"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ width: 160 }}
                                    />
                                    {(dateFrom || dateTo) && (
                                        <Tooltip title="Clear date filter">
                                            <IconButton
                                                size="small"
                                                onClick={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
                                            >
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
                                                onClick={() => { setMultiPoList([]); setMultiPoText(''); setMultiPoNotFound([]); setPage(0); }}
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
                                            onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }}
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
                                            onChange={(e) => { setInputFilter(e.target.value); setPage(0); }}
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
                                            onChange={(e) => { setDoneFilter(e.target.value); setPage(0); }}
                                        >
                                            <MenuItem value="all">All Items</MenuItem>
                                            <MenuItem value="done">Completed</MenuItem>
                                            <MenuItem value="pending">Pending</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>

                                {fetchError && (
                                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                                        Failed to load data: {fetchError}
                                    </Typography>
                                )}

                                {multiPoNotFound.length > 0 && (
                                    <Alert
                                        severity="warning"
                                        sx={{ mb: 2 }}
                                        onClose={() => setMultiPoNotFound([])}
                                    >
                                        <strong>{multiPoNotFound.length} PO{multiPoNotFound.length > 1 ? 's' : ''} not found:</strong>{' '}
                                        {multiPoNotFound.join(', ')}
                                    </Alert>
                                )}

                                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', width: 48 }}>#</TableCell>
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'seq'}
                                                        direction={orderBy === 'seq' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('seq')}
                                                    >
                                                        Seq
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'po_no'}
                                                        direction={orderBy === 'po_no' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('po_no')}
                                                    >
                                                        PO No
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'remark'}
                                                        direction={orderBy === 'remark' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('remark')}
                                                    >
                                                        Remark
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="right">
                                                    <TableSortLabel
                                                        active={orderBy === 'print_qty'}
                                                        direction={orderBy === 'print_qty' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('print_qty')}
                                                    >
                                                        Print Qty
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="right">
                                                    <TableSortLabel
                                                        active={orderBy === 'returned'}
                                                        direction={orderBy === 'returned' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('returned')}
                                                    >
                                                        Returned
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'created_at'}
                                                        direction={orderBy === 'created_at' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('created_at')}
                                                    >
                                                        Created At
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'dept_id'}
                                                        direction={orderBy === 'dept_id' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('dept_id')}
                                                    >
                                                        Department
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'input_id'}
                                                        direction={orderBy === 'input_id' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('input_id')}
                                                    >
                                                        Input Type
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="center">
                                                    <TableSortLabel
                                                        active={orderBy === 'done'}
                                                        direction={orderBy === 'done' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('done')}
                                                    >
                                                        Status
                                                    </TableSortLabel>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {fetching ? (
                                                <TableRow>
                                                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                                                        <CircularProgress size={32} />
                                                    </TableCell>
                                                </TableRow>
                                            ) : paginatedRows.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {search || dateFrom || dateTo ? 'No records match your filters.' : 'No records found.'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedRows.map((row, index) => (
                                                    <TableRow
                                                        key={row.id}
                                                        hover
                                                        sx={{ '&:last-child td': { borderBottom: 0 } }}
                                                    >
                                                        <TableCell sx={{ color: 'text.secondary' }}>{page * rowsPerPage + index + 1}</TableCell>
                                                        <TableCell>{row.seq ?? '—'}</TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={500}>
                                                                {row.po_no ?? '—'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>{row.remark ?? '—'}</TableCell>
                                                        <TableCell align="right">
                                                            <Chip
                                                                label={row.print_qty ?? '—'}
                                                                size="small"
                                                                color={
                                                                    row.print_qty != null && row.print_qty > 1
                                                                        ? 'warning'
                                                                        : 'default'
                                                                }
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">{row.returned ?? '—'}</TableCell>
                                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatDateTime(row.created_at)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            {row.dept_id ? (
                                                                <Chip
                                                                    label={deptMap[row.dept_id] ?? row.dept_id}
                                                                    size="small"
                                                                    color={colorForId(row.dept_id)}
                                                                    variant="outlined"
                                                                />
                                                            ) : '—'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {row.input_id ? (
                                                                <Chip
                                                                    label={inputMap[row.input_id] ?? row.input_id}
                                                                    size="small"
                                                                    color={colorForId(row.input_id)}
                                                                    variant="outlined"
                                                                />
                                                            ) : '—'}
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {row.done
                                                                ? <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
                                                                : <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <TablePagination
                                    component="div"
                                    count={filteredRows.length}
                                    page={page}
                                    onPageChange={(_, newPage) => setPage(newPage)}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={(e) => {
                                        setRowsPerPage(parseInt(e.target.value, 10));
                                        setPage(0);
                                    }}
                                    rowsPerPageOptions={[10, 25, 50, 100]}
                                />
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
                            setPage(0);
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
