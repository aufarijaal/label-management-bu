import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import SearchIcon from '@mui/icons-material/Search';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';

import { supabase } from '../lib/supabaseClient';
import type { AveryNoteItem } from '../types';

const TABLE_NAME = 'ila_avery_note_items';
const TAKER_NAME_KEY = 'repro_taker_name';

export default function ReproMovementPage() {
    const router = useRouter();
    const [query, setQuery] = React.useState('');
    const [rows, setRows] = React.useState<AveryNoteItem[]>([]);
    const [searching, setSearching] = React.useState(false);
    const [searched, setSearched] = React.useState(false);
    const [updatingId, setUpdatingId] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [snackbar, setSnackbar] = React.useState<string | null>(null);
    const [nameDialogOpen, setNameDialogOpen] = React.useState(() =>
        typeof window !== 'undefined' ? !(window.localStorage.getItem(TAKER_NAME_KEY)?.trim()) : true
    );
    const [takenBy, setTakenBy] = React.useState(() =>
        typeof window !== 'undefined' ? (window.localStorage.getItem(TAKER_NAME_KEY) ?? '') : ''
    );
    const [nameDraft, setNameDraft] = React.useState(() =>
        typeof window !== 'undefined' ? (window.localStorage.getItem(TAKER_NAME_KEY) ?? '') : ''
    );
    const [departmentMap, setDepartmentMap] = React.useState<Record<string, string>>({});
    const [confirmationRow, setConfirmationRow] = React.useState<AveryNoteItem | null>(null);

    const searchRows = async () => {
        const term = query.trim();
        if (!term) {
            setError('Masukkan nomor GTN terlebih dahulu.');
            return;
        }

        setSearching(true);
        setSearched(true);
        setError(null);

        try {
            const safeTerm = term.replace(/,/g, ' ');

            const [result, departmentResult] = await Promise.all([
                supabase
                    .from(TABLE_NAME)
                    .select('id, seq, po_no, art, remark, print_qty, created_at, status, input_id, dept_id, returned, short_group_code, label_id, taken_by, taken_at')
                    .or(`po_no.ilike.%${safeTerm}%,art.ilike.%${safeTerm}%,label_id.ilike.%${safeTerm}%,remark.ilike.%${safeTerm}%`)
                    .order('created_at', { ascending: false })
                    .order('seq', { ascending: false })
                    .limit(500),
                supabase.from('departments').select('id, title').order('title', { ascending: true })
            ]);

            if (result.error) throw result.error;
            setRows(result.data ?? []);
            setDepartmentMap(Object.fromEntries((departmentResult.data ?? []).map((department) => [department.id, department.title])));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Gagal mencari data.');
            setRows([]);
        } finally {
            setSearching(false);
        }
    };

    const handleKonfirmAmbil = async (row: AveryNoteItem) => {
        if (!takenBy.trim()) {
            setNameDialogOpen(true);
            return;
        }
        setUpdatingId(row.id);
        setError(null);

        const takenAt = new Date().toISOString();
        const previousStatus = row.status;
        const previousTakenBy = row.taken_by;
        const previousTakenAt = row.taken_at;
        setRows((current) => current.map((item) => item.id === row.id
            ? { ...item, status: 'done', taken_by: takenBy, taken_at: takenAt }
            : item));

        const { error: updateError } = await supabase
            .from(TABLE_NAME)
            .update({ status: 'done', taken_by: takenBy, taken_at: takenAt })
            .eq('id', row.id);

        if (updateError) {
            setRows((current) => current.map((item) => item.id === row.id
                ? { ...item, status: previousStatus, taken_by: previousTakenBy, taken_at: previousTakenAt }
                : item));
            setError(updateError.message);
        } else {
            setSnackbar('Pengambilan berhasil dikonfirmasi.');
        }
        setUpdatingId(null);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        void searchRows();
    };

    const saveTakerName = (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedName = nameDraft.trim();
        if (!trimmedName) return;
        setTakenBy(trimmedName);
        if (typeof window !== 'undefined') window.localStorage.setItem(TAKER_NAME_KEY, trimmedName);
        setNameDialogOpen(false);
    };

    function formatTakenAt(value: string | null) {
        if (!value) return '—';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
    }

    function formatDateTime(value: string | null) {
        if (!value) return '—';
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
    }

    return (
        <>
            <Head>
                <title>Pengambilan Repro</title>
            </Head>
            <Dialog open={nameDialogOpen} onClose={() => takenBy.trim() && setNameDialogOpen(false)} disableEscapeKeyDown={!takenBy.trim()}>
                <DialogTitle>Nama Pengambil</DialogTitle>
                <DialogContent sx={{ pt: '8px !important', minWidth: { xs: 280, sm: 360 } }}>
                    <Box component="form" id="taker-name-form" onSubmit={saveTakerName}>
                        <TextField
                            autoFocus
                            fullWidth
                            required
                            label="Nama"
                            placeholder="Masukkan nama Anda"
                            value={nameDraft}
                            onChange={(event) => setNameDraft(event.target.value)}
                            inputProps={{ autoComplete: 'name' }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    {takenBy.trim() && <Button onClick={() => setNameDialogOpen(false)}>Batal</Button>}
                    <Button type="submit" form="taker-name-form" variant="contained" disabled={!nameDraft.trim()}>
                        Simpan Nama
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={Boolean(confirmationRow)}
                onClose={() => setConfirmationRow(null)}
                aria-labelledby="confirm-taken-title"
            >
                <DialogTitle id="confirm-taken-title">Apakah anda yakin?</DialogTitle>
                <DialogContent sx={{ pt: '8px !important' }}>
                    <Typography>
                        Konfirmasi bahwa item PO {confirmationRow?.po_no || '—'} sudah diambil.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmationRow(null)}>Batal</Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => {
                            const row = confirmationRow;
                            setConfirmationRow(null);
                            if (row) void handleKonfirmAmbil(row);
                        }}
                        startIcon={<TaskAltIcon />}
                    >
                        Ya, Konfirmasi
                    </Button>
                </DialogActions>
            </Dialog>
            <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 3 } }}>
                <Stack spacing={2.5}>
                    <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
                            <Button
                                variant="text"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => router.push('/')}
                                sx={{ px: 0, minWidth: 0, textTransform: 'none' }}
                            >
                                Kembali ke Home
                            </Button>
                            {takenBy && (
                                <Chip
                                    icon={<EditIcon />}
                                    label={`Nama: ${takenBy}`}
                                    variant="outlined"
                                    onClick={() => {
                                        setNameDraft(takenBy);
                                        setNameDialogOpen(true);
                                    }}
                                    sx={{ maxWidth: '55%' }}
                                />
                            )}
                        </Stack>
                        <Typography variant="h5" component="h1" fontWeight={700}>
                            Pengambilan Repro
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Cari berdasarkan nomor GTN lalu konfirmasi pengambilan item.
                        </Typography>
                    </Box>

                    <Box component="form" onSubmit={handleSubmit}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            <TextField
                                fullWidth
                                label="Nomor GTN"
                                placeholder="Masukkan nomor GTN"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                inputProps={{ inputMode: 'search', autoComplete: 'off' }}
                                size="medium"
                            />
                            <Button
                                type="submit"
                                variant="contained"
                                size="large"
                                disabled={searching}
                                startIcon={searching ? <CircularProgress size={18} color="inherit" /> : <SearchIcon />}
                                sx={{ minHeight: 56, minWidth: { xs: '100%', sm: 140 } }}
                            >
                                Cari
                            </Button>
                        </Stack>
                    </Box>

                    {error && <Alert severity="error">{error}</Alert>}

                    {searched && !searching && rows.length === 0 && !error && (
                        <Alert severity="info">Tidak ada data untuk pencarian “{query.trim()}”.</Alert>
                    )}

                    {rows.length > 0 && (
                        <Stack spacing={1.5}>
                            <Typography variant="subtitle1" fontWeight={700}>
                                {rows.length} data ditemukan
                            </Typography>
                            {rows.map((row) => {
                                const status = typeof row.status === 'string'
                                    ? row.status.trim().toLowerCase()
                                    : 'pending';
                                const updating = updatingId === row.id;
                                return (
                                    <Card key={row.id} variant="outlined" sx={{ borderRadius: 2 }}>
                                        <CardContent sx={{ p: { xs: 1.25, sm: 1.5 }, '&:last-child': { pb: { xs: 1.25, sm: 1.5 } } }}>
                                            <Stack spacing={1}>
                                                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="caption" color="text.secondary">PO Number</Typography>
                                                        <Typography variant="subtitle1" fontWeight={700} noWrap>{row.po_no || '—'}</Typography>
                                                    </Box>
                                                    <Chip
                                                        size="small"
                                                        icon={status === 'done' ? <TaskAltIcon /> : undefined}
                                                        label={status === 'done' ? 'Sudah Ambil' : status === 'cancel' ? 'Cancel' : 'Belum Ambil'}
                                                        color={status === 'done' ? 'success' : status === 'cancel' ? 'default' : 'warning'}
                                                    />
                                                </Stack>

                                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 0.75 }}>
                                                    <Box><Typography variant="caption" color="text.secondary">Article</Typography><Typography variant="body2" noWrap>{row.art || '—'}</Typography></Box>
                                                    <Box><Typography variant="caption" color="text.secondary">Seq</Typography><Typography variant="body2">{row.seq ?? '—'}</Typography></Box>
                                                    <Box><Typography variant="caption" color="text.secondary">Qty</Typography><Typography variant="body2">{row.print_qty ?? '—'} pc</Typography></Box>
                                                    <Box><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body2" noWrap>{row.dept_id ? departmentMap[row.dept_id] ?? row.dept_id : '—'}</Typography></Box>
                                                    <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'span 2' } }}><Typography variant="caption" color="text.secondary">Created</Typography><Typography variant="body2">{formatDateTime(row.created_at)}</Typography></Box>
                                                </Box>

                                                <Box sx={{ bgcolor: 'action.selected', borderLeft: '4px solid', borderColor: 'warning.main', borderRadius: 1, px: 1, py: 0.75 }}>
                                                    <Typography variant="caption" color="text.secondary">Remark</Typography>
                                                    <Typography variant="subtitle2" fontWeight={800} sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                        {row.remark || '—'}
                                                    </Typography>
                                                </Box>

                                                {status === 'done' && (row.taken_by || row.taken_at) && (
                                                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.75 }}>
                                                        <Box><Typography variant="caption" color="text.secondary">Diambil oleh</Typography><Typography variant="body2">{row.taken_by || '—'}</Typography></Box>
                                                        <Box><Typography variant="caption" color="text.secondary">Waktu ambil</Typography><Typography variant="body2">{formatTakenAt(row.taken_at)}</Typography></Box>
                                                    </Box>
                                                )}

                                                {status !== 'done' ? (
                                                    <Button
                                                        fullWidth
                                                        variant="contained"
                                                        color="success"
                                                        size="medium"
                                                        disabled={updating}
                                                        startIcon={updating ? <CircularProgress size={16} color="inherit" /> : <TaskAltIcon />}
                                                        onClick={() => {
                                                            setConfirmationRow(row);
                                                        }}
                                                        sx={{ minHeight: 44, fontWeight: 700 }}
                                                    >
                                                        Konfirm Ambil
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        color="success"
                                                        size="small"
                                                        disabled
                                                        startIcon={<TaskAltIcon />}
                                                        sx={{ minHeight: 36 }}
                                                    >
                                                        Sudah dikonfirmasi
                                                    </Button>
                                                )}
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </Stack>
                    )}
                </Stack>

                <Snackbar
                    open={Boolean(snackbar)}
                    autoHideDuration={2500}
                    onClose={() => setSnackbar(null)}
                    message={snackbar}
                />
            </Container>
        </>
    );
}
