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
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SearchIcon from '@mui/icons-material/Search';
import Grid from '@mui/material/Grid';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AppLayout from '../components/AppLayout';
import type { OrderData } from '../types';

const TABLE_NAME = 'order_data';

type FormState = {
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

const SIZE_KEYS: Array<keyof FormState> = [
    'size_1', 'size_1t', 'size_2', 'size_2t', 'size_3', 'size_3t', 'size_4', 'size_4t', 'size_5', 'size_5t', 'size_6', 'size_6t',
    'size_7', 'size_7t', 'size_8', 'size_8t', 'size_9', 'size_9t', 'size_10', 'size_10t', 'size_11', 'size_11t', 'size_12', 'size_12t',
    'size_13', 'size_13t'
];

const TEXT_FIELDS: Array<keyof FormState> = [
    'fty_sap',
    'gtn',
    'model_number',
    'model_name',
    'art',
    'destination',
    'old_gtn',
    'old_sap',
    'changes'
];

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
    const payload: Record<string, string | number | null> = {
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

export default function OrderDataPage() {
    const { user } = useAuth();

    const [rows, setRows] = React.useState<OrderData[]>([]);
    const [fetching, setFetching] = React.useState(true);
    const [fetchError, setFetchError] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState('');

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
            .limit(500);

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
        const q = search.trim().toLowerCase();
        if (!q) return rows;

        return rows.filter((row) => {
            const pool = [
                row.id,
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
    }, [rows, search]);

    const handleFieldChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: event.target.value }));
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

        let payload: Record<string, string | number | null>;
        try {
            payload = buildPayload(form);
        } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Failed to validate form values.');
            setSaving(false);
            return;
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
                                placeholder="Search by SAP, GTN, model, ART, destination..."
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
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={openAddDialog}
                                sx={{ ml: 'auto' }}
                            >
                                Add Order Row
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
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>ID</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Release Date</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>FTY SAP</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>GTN</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Model Number</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Model Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>ART</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Destination</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Changes</TableCell>
                                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }} align="right">
                                            Actions
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
                                    ) : filteredRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {search ? 'No records match your search.' : 'No order data records found.'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredRows.map((row) => (
                                            <TableRow key={row.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                                <TableCell>{row.id}</TableCell>
                                                <TableCell>{row.release_date ?? '-'}</TableCell>
                                                <TableCell>{row.fty_sap ?? '-'}</TableCell>
                                                <TableCell>{row.gtn ?? '-'}</TableCell>
                                                <TableCell>{row.model_number ?? '-'}</TableCell>
                                                <TableCell>{row.model_name ?? '-'}</TableCell>
                                                <TableCell>{row.art ?? '-'}</TableCell>
                                                <TableCell>{row.destination ?? '-'}</TableCell>
                                                <TableCell>{row.changes ?? '-'}</TableCell>
                                                <TableCell align="right">
                                                    <Tooltip title="Edit">
                                                        <IconButton size="small" onClick={() => openEditDialog(row)}>
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            </Box>

            <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="lg">
                <DialogTitle>{dialogMode === 'add' ? 'Add Order Data Row' : `Edit Row #${editingId}`}</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2} sx={{ mt: 0 }}>
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
