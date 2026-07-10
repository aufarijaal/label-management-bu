import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
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
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LabelIcon from '@mui/icons-material/Label';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import ListAltIcon from '@mui/icons-material/ListAlt';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { useColorMode } from '../context/ColorModeContext';

const DRAWER_WIDTH = 240;

interface AveryNoteItem {
    id: string;
    seq: number | null;
    po_no: string | null;
    remark: string | null;
    print_qty: number | null;
    created_at: string | null;
}

type Order = 'asc' | 'desc';
type OrderByKey = keyof AveryNoteItem;

const navItems = [
    { label: 'Overview', icon: <DashboardIcon />, href: '/dashboard' },
    { label: 'Labels', icon: <LabelIcon />, href: '/dashboard' },
    { label: 'Avery Notes', icon: <NoteAltIcon />, href: '/avery-notes', active: true },
    { label: 'Analytics', icon: <TrendingUpIcon />, href: '/dashboard' },
    { label: 'Team', icon: <GroupIcon />, href: '/dashboard' },
    { label: 'Settings', icon: <SettingsIcon />, href: '/dashboard' }
];

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
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const { mode, toggleColorMode } = useColorMode();
    const [mobileOpen, setMobileOpen] = React.useState(false);

    const [rows, setRows] = React.useState<AveryNoteItem[]>([]);
    const [fetching, setFetching] = React.useState(true);
    const [fetchError, setFetchError] = React.useState<string | null>(null);

    const [search, setSearch] = React.useState('');
    const [dateFrom, setDateFrom] = React.useState('');
    const [dateTo, setDateTo] = React.useState('');
    const [multiPoOpen, setMultiPoOpen] = React.useState(false);
    const [multiPoText, setMultiPoText] = React.useState('');
    const [multiPoList, setMultiPoList] = React.useState<string[]>([]);
    const [multiPoNotFound, setMultiPoNotFound] = React.useState<string[]>([]);
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<OrderByKey>('seq');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    React.useEffect(() => {
        if (!loading && !user) {
            router.replace('/signin');
        }
    }, [user, loading, router]);

    React.useEffect(() => {
        if (!user) return;
        async function fetchData() {
            setFetching(true);
            setFetchError(null);
            const { data, error } = await supabase
                .from('ila_avery_note_items')
                .select('id, seq, po_no, remark, print_qty, created_at')
                .order('seq', { ascending: true });
            if (error) {
                setFetchError(error.message);
            } else {
                setRows(data ?? []);
            }
            setFetching(false);
        }
        fetchData();
    }, [user]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

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
            return true;
        });
    }, [rows, search, dateFrom, dateTo, multiPoList]);

    const sortedRows = React.useMemo(
        () => [...filteredRows].sort(getComparator(order, orderBy)),
        [filteredRows, order, orderBy]
    );

    const paginatedRows = sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (loading || !user) return null;

    const displayName = user.user_metadata?.full_name ?? user.email ?? 'User';
    const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
    const initials = displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const DrawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center' }}>
                <LabelIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Typography variant="h6" fontWeight={700} color="primary.main">
                    LabelManager
                </Typography>
            </Box>
            <Divider />
            <List sx={{ flex: 1, px: 1, py: 2 }}>
                {navItems.map((item) => (
                    <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton
                            selected={!!item.active}
                            onClick={() => router.push(item.href)}
                            sx={{
                                borderRadius: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'primary.main',
                                    color: '#fff',
                                    '& .MuiListItemIcon-root': { color: '#fff' },
                                    '&:hover': { bgcolor: 'primary.dark' }
                                }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{ fontWeight: item.active ? 600 : 400 }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar src={avatarUrl} sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>
                    {initials}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                        {displayName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {user.email}
                    </Typography>
                </Box>
                <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
                    <IconButton size="small" onClick={toggleColorMode}>
                        {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
                    </IconButton>
                </Tooltip>
                <Tooltip title="Sign out">
                    <IconButton size="small" onClick={handleSignOut}>
                        <LogoutIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <>
            <Head>
                <title>Avery Notes — LabelManager</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                {/* Sidebar — desktop */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        width: DRAWER_WIDTH,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: DRAWER_WIDTH,
                            boxSizing: 'border-box',
                            border: 'none',
                            borderRight: '1px solid',
                            borderColor: 'divider'
                        }
                    }}
                >
                    {DrawerContent}
                </Drawer>

                {/* Sidebar — mobile */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': { width: DRAWER_WIDTH }
                    }}
                >
                    {DrawerContent}
                </Drawer>

                {/* Main content */}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                        bgcolor: 'background.default'
                    }}
                >
                    {/* Top App Bar (mobile only) */}
                    <AppBar
                        position="static"
                        color="default"
                        elevation={0}
                        sx={{
                            display: { xs: 'flex', md: 'none' },
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper'
                        }}
                    >
                        <Toolbar>
                            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2 }}>
                                <MenuIcon />
                            </IconButton>
                            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ flexGrow: 1 }}>
                                LabelManager
                            </Typography>
                            <Avatar src={avatarUrl} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 12 }}>
                                {initials}
                            </Avatar>
                        </Toolbar>
                    </AppBar>

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
                                                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    <TableSortLabel
                                                        active={orderBy === 'created_at'}
                                                        direction={orderBy === 'created_at' ? order : 'asc'}
                                                        onClick={() => handleRequestSort('created_at')}
                                                    >
                                                        Created At
                                                    </TableSortLabel>
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {fetching ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                        <CircularProgress size={32} />
                                                    </TableCell>
                                                </TableRow>
                                            ) : paginatedRows.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {search || dateFrom || dateTo ? 'No records match your filters.' : 'No records found.'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedRows.map((row) => (
                                                    <TableRow
                                                        key={row.id}
                                                        hover
                                                        sx={{ '&:last-child td': { borderBottom: 0 } }}
                                                    >
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
                                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {formatDateTime(row.created_at)}
                                                            </Typography>
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
                </Box>
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
        </>
    );
}
