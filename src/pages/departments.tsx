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
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import GroupIcon from '@mui/icons-material/Group';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AppLayout from '../components/AppLayout';
import type { Department } from '../types';

const TABLE_NAME = 'departments';

export default function DepartmentsPage() {
    const { user } = useAuth();

    const [rows, setRows] = React.useState<Department[]>([]);
    const [fetching, setFetching] = React.useState(true);
    const [fetchError, setFetchError] = React.useState<string | null>(null);

    const [search, setSearch] = React.useState('');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [dialogMode, setDialogMode] = React.useState<'add' | 'edit'>('add');
    const [formId, setFormId] = React.useState('');
    const [formTitle, setFormTitle] = React.useState('');
    const [formError, setFormError] = React.useState<string | null>(null);
    const [saving, setSaving] = React.useState(false);

    const [deleteTarget, setDeleteTarget] = React.useState<Department | null>(null);
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
            .select('id, title')
            .order('title', { ascending: true });
        if (error) {
            setFetchError(error.message);
        } else {
            setRows(data ?? []);
        }
        setFetching(false);
    }, []);

    React.useEffect(() => {
        if (!user) return;
        fetchRows();
    }, [user, fetchRows]);

    const filteredRows = React.useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return rows;
        return rows.filter(
            (r) => r.id.toLowerCase().includes(q) || r.title.toLowerCase().includes(q)
        );
    }, [rows, search]);

    const paginatedRows = filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    const openAddDialog = () => {
        setDialogMode('add');
        setFormId('');
        setFormTitle('');
        setFormError(null);
        setDialogOpen(true);
    };

    const openEditDialog = (row: Department) => {
        setDialogMode('edit');
        setFormId(row.id);
        setFormTitle(row.title);
        setFormError(null);
        setDialogOpen(true);
    };

    const closeDialog = () => {
        if (saving) return;
        setDialogOpen(false);
    };

    const handleSave = async () => {
        const id = formId.trim();
        const title = formTitle.trim();
        if (!id || !title) {
            setFormError('Both ID and Title are required.');
            return;
        }
        setSaving(true);
        setFormError(null);

        if (dialogMode === 'add') {
            const { error } = await supabase.from(TABLE_NAME).insert({ id, title });
            if (error) {
                setFormError(error.message);
                setSaving(false);
                return;
            }
        } else {
            const { error } = await supabase.from(TABLE_NAME).update({ title }).eq('id', id);
            if (error) {
                setFormError(error.message);
                setSaving(false);
                return;
            }
        }

        setSaving(false);
        setDialogOpen(false);
        setSnackbar({ open: true, message: dialogMode === 'add' ? 'Department created.' : 'Department updated.', severity: 'success' });
        fetchRows();
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', deleteTarget.id);
        setDeleting(false);
        if (error) {
            const message = error.code === '23503'
                ? 'Cannot delete: this department is referenced by existing avery note items.'
                : error.message;
            setSnackbar({ open: true, message, severity: 'error' });
        } else {
            setSnackbar({ open: true, message: 'Department deleted.', severity: 'success' });
            fetchRows();
        }
        setDeleteTarget(null);
    };

    return (
        <AppLayout>
            <Head>
                <title>Departments — LabelManager</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <Box sx={{ py: 4, px: { xs: 2, md: 4 }, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4 }}>
                    <GroupIcon sx={{ color: 'primary.main', fontSize: 32 }} />
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Departments
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Manage the list of departments
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
                        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                            <TextField
                                size="small"
                                placeholder="Search by ID or Title…"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
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
                                sx={{ width: { xs: '100%', sm: 280 } }}
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={openAddDialog}
                                sx={{ ml: 'auto' }}
                            >
                                Add Department
                            </Button>
                        </Box>

                        {fetchError && (
                            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                                Failed to load data: {fetchError}
                            </Typography>
                        )}

                        <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', width: 200 }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Title</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', width: 120 }} align="right">
                                            Actions
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {fetching ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                                                <CircularProgress size={32} />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {search ? 'No records match your search.' : 'No departments found.'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedRows.map((row) => (
                                            <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontFamily="monospace">
                                                        {row.id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{row.title}</TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => openEditDialog(row)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" onClick={() => setDeleteTarget(row)}>
                                                            <DeleteIcon fontSize="small" color="error" />
                                                        </IconButton>
                                                    </Tooltip>
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

            {/* Add / Edit dialog */}
            <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="xs">
                <DialogTitle>{dialogMode === 'add' ? 'Add Department' : 'Edit Department'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="ID"
                            value={formId}
                            onChange={(e) => setFormId(e.target.value)}
                            disabled={dialogMode === 'edit'}
                            size="small"
                            fullWidth
                            autoFocus={dialogMode === 'add'}
                        />
                        <TextField
                            label="Title"
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            size="small"
                            fullWidth
                            autoFocus={dialogMode === 'edit'}
                        />
                        {formError && (
                            <Alert severity="error" sx={{ mt: 0.5 }}>
                                {formError}
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDialog} disabled={saving}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving}>
                        {saving ? <CircularProgress size={20} /> : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete confirmation */}
            <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} fullWidth maxWidth="xs">
                <DialogTitle>Delete Department</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete <strong>{deleteTarget?.title}</strong> ({deleteTarget?.id})? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleting}>
                        {deleting ? <CircularProgress size={20} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AppLayout>
    );
}
