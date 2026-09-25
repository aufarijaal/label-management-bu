import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '../context/AuthContext';

/* -------------------------------------------------------------------------
   CONFIG
   Endpoint for the Google Apps Script web app that appends rows to the PO
   movement sheet. Set NEXT_PUBLIC_PO_MOVEMENT_SCRIPT_URL in .env.local to
   avoid hardcoding deployment URLs in source; falls back to the original
   deployment if unset.
   ------------------------------------------------------------------------- */
const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_PO_MOVEMENT_SCRIPT_URL;

const STORAGE_KEY_OPERATOR = 'po_movement_operator_name';
const PO_LENGTH = 8;

// MUI's icon set has no 1D-barcode glyph — reuse the original inline SVG.
function BarcodeIcon(props) {
    return (
        <Box component="svg" viewBox="0 0 24 24" sx={{ width: 20, height: 20, ...props.sx }}>
            <path
                fill="currentColor"
                fillRule="evenodd"
                d="M2 6h1v12H2zm2 0h2v12H4zm4 0h1v12H8zm2 0h3v12h-3zm4 0h1v12h-1zm3 0h1v12h-1zm2 0h1v12h-1zm2 0h1v12h-1z"
            />
        </Box>
    );
}

function formatPo(item) {
    return item.method === 'Manual' ? `IB${item.po}` : item.po;
}

let idCounter = 0;
function nextId() {
    idCounter += 1;
    return `po-${Date.now()}-${idCounter}`;
}

const paperSx = {
    p: 2.5,
    bgcolor: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 2
};

const darkFieldSx = {
    '& .MuiOutlinedInput-root': {
        color: '#fff',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
        '&.Mui-focused fieldset': { borderColor: '#fff' }
    },
    '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.5)' },
    '& .MuiInputAdornment-root': { color: 'rgba(255,255,255,0.6)' }
};

export default function PoMovementPage() {
    const router = useRouter();
    const { user } = useAuth();

    // ---- operator ----
    // Lazily read any previously saved name on this device so there's no
    // extra render before it shows up.
    const [operatorName, setOperatorName] = React.useState(() =>
        typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY_OPERATOR) : null
    );
    const [nameDraft, setNameDraft] = React.useState('');
    const [editingName, setEditingName] = React.useState(false);

    // ---- batch of POs waiting to be submitted ----
    // item: { id, po, method: 'QR' | 'Barcode' | 'Manual', status: 'idle' | 'pending' | 'success' | 'error' }
    const [items, setItems] = React.useState([]);
    const [manualValue, setManualValue] = React.useState('');
    const [manualError, setManualError] = React.useState('');
    const manualInputRef = React.useRef(null);

    // ---- camera scanner ----
    const [scannerOpen, setScannerOpen] = React.useState(false);
    const [scannerMode, setScannerMode] = React.useState('QR');
    const [scannerError, setScannerError] = React.useState('');
    const html5QrRef = React.useRef(null);

    // ---- confirm + submit ----
    const [pendingAction, setPendingAction] = React.useState(null); // 'IN' | 'OUT'
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    const [snackbar, setSnackbar] = React.useState(null); // { severity, message }

    /* ---------------------------------------------------------------------
       If this device has no saved operator name yet, fall back to the
       signed-in Google account's name/email so returning users usually
       don't have to type anything.
       --------------------------------------------------------------------- */
    React.useEffect(() => {
        if (!operatorName && (user?.user_metadata?.full_name || user?.email)) {
            setOperatorName(user.user_metadata?.full_name || user.email);
        }
    }, [user, operatorName]);

    function saveOperatorName(name) {
        const trimmed = name.trim();
        if (!trimmed) return;
        setOperatorName(trimmed);
        setEditingName(false);
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY_OPERATOR, trimmed);
        }
    }

    /* ---------------------------------------------------------------------
       Batch list
       --------------------------------------------------------------------- */
    function addItem(rawPo, method) {
        const cleaned = String(rawPo || '').trim().toUpperCase();
        if (!cleaned) return;

        const isDuplicate = items.some((it) => it.po === cleaned && it.method === method);
        if (isDuplicate) {
            setSnackbar({ severity: 'info', message: `${method === 'Manual' ? 'IB' : ''}${cleaned} is already in the list` });
            return;
        }

        setItems((prev) => [...prev, { id: nextId(), po: cleaned, method, status: 'idle' }]);
        setSnackbar({ severity: 'success', message: `Added ${method === 'Manual' ? 'IB' : ''}${cleaned}` });
    }

    function removeItem(id) {
        setItems((prev) => prev.filter((it) => it.id !== id));
    }

    /* ---------------------------------------------------------------------
       Manual entry — mirrors a handheld scanner typing digits + Enter into
       a focused field: auto-commits at 8 digits, refocuses for the next one.
       --------------------------------------------------------------------- */
    function handleManualChange(e) {
        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, PO_LENGTH);
        setManualValue(digitsOnly);
        setManualError('');
        if (digitsOnly.length === PO_LENGTH) {
            addItem(digitsOnly, 'Manual');
            setManualValue('');
        }
    }

    function commitManual() {
        if (!manualValue) return;
        if (manualValue.length !== PO_LENGTH) {
            setManualError(`PO number must be ${PO_LENGTH} digits`);
            return;
        }
        addItem(manualValue, 'Manual');
        setManualValue('');
    }

    function handleManualKeyDown(e) {
        if (e.key === 'Enter') commitManual();
    }

    /* ---------------------------------------------------------------------
       Scanner (QR + Barcode) via the locally installed html5-qrcode package.
       Imported dynamically (not at module top level) so it's only pulled
       into the bundle and touches the DOM/camera once the modal is actually
       opened, and never during server-side rendering.
       --------------------------------------------------------------------- */
    function openScanner(mode) {
        setScannerMode(mode);
        setScannerError('');
        setScannerOpen(true);
    }

    function closeScanner() {
        const instance = html5QrRef.current;
        html5QrRef.current = null;
        setScannerOpen(false);
        if (instance) {
            instance
                .stop()
                .then(() => instance.clear())
                .catch(() => {});
        }
    }

    React.useEffect(() => {
        if (!scannerOpen) return;
        let cancelled = false;

        import('html5-qrcode').then(({ Html5Qrcode, Html5QrcodeSupportedFormats }) => {
            if (cancelled) return;

            const formats =
                scannerMode === 'QR'
                    ? [Html5QrcodeSupportedFormats.QR_CODE]
                    : [
                          Html5QrcodeSupportedFormats.CODE_128,
                          Html5QrcodeSupportedFormats.CODE_39,
                          Html5QrcodeSupportedFormats.EAN_13,
                          Html5QrcodeSupportedFormats.EAN_8,
                          Html5QrcodeSupportedFormats.UPC_A,
                          Html5QrcodeSupportedFormats.UPC_E
                      ];

            const instance = new Html5Qrcode('scannerViewport', { formatsToSupport: formats, verbose: false });
            html5QrRef.current = instance;

            instance
                .start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.7777778 },
                    (decodedText) => {
                        addItem(decodedText, scannerMode);
                        closeScanner();
                    },
                    () => {
                        /* per-frame scan miss is normal while searching */
                    }
                )
                .catch((err) => {
                    console.error('Unable to start camera:', err);
                    setScannerError('Could not access the camera. Check permissions and use HTTPS or localhost.');
                });
        });

        return () => {
            cancelled = true;
            const instance = html5QrRef.current;
            html5QrRef.current = null;
            if (instance) {
                instance
                    .stop()
                    .then(() => instance.clear())
                    .catch(() => {});
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scannerOpen, scannerMode]);

    /* ---------------------------------------------------------------------
       Confirm + batch submit
       --------------------------------------------------------------------- */
    function startMovement(action) {
        if (items.length === 0 || submitting) return;
        setPendingAction(action);
        setConfirmOpen(true);
    }

    async function submitOne(item, action, name) {
        const payload = {
            name,
            po: formatPo(item),
            action,
            inputMethod: item.method
        };
        try {
            const res = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                // text/plain avoids a CORS preflight against Apps Script Web Apps.
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`Bad response: ${res.status}`);
            const data = await res.json();
            if (!data || data.status !== 'ok') throw new Error((data && data.message) || 'Server rejected the request');
            return true;
        } catch (err) {
            console.error('Submit failed for', payload.po, err);
            return false;
        }
    }

    async function submitItems(targetItems) {
        setSubmitting(true);
        setItems((prev) => prev.map((it) => (targetItems.some((t) => t.id === it.id) ? { ...it, status: 'pending' } : it)));

        // Submitted one at a time (not in parallel) — Apps Script web apps can
        // throttle or drop concurrent requests, and this lets each PO report
        // its own success/failure instead of the whole batch failing together.
        for (const item of targetItems) {
            // eslint-disable-next-line no-await-in-loop
            const ok = await submitOne(item, pendingAction, operatorName);
            setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: ok ? 'success' : 'error' } : it)));
        }

        setSubmitting(false);
    }

    function submitBatch() {
        submitItems(items);
    }

    function retryFailed() {
        submitItems(items.filter((it) => it.status === 'error'));
    }

    const allSubmitted = items.length > 0 && items.every((it) => it.status === 'success' || it.status === 'error');
    const hasStarted = items.some((it) => it.status !== 'idle');
    const failedCount = items.filter((it) => it.status === 'error').length;
    const succeededCount = items.filter((it) => it.status === 'success').length;

    function closeConfirmDialog() {
        // Drop successes; leave failures in the main list so they're visible
        // and can be retried later without re-scanning everything.
        setItems((prev) => prev.filter((it) => it.status !== 'success'));
        setConfirmOpen(false);
        setPendingAction(null);
    }

    React.useEffect(() => {
        if (confirmOpen && !submitting && hasStarted && allSubmitted && failedCount === 0) {
            const t = setTimeout(() => {
                setSnackbar({ severity: 'success', message: `${succeededCount} PO${succeededCount === 1 ? '' : 's'} recorded` });
                closeConfirmDialog();
            }, 900);
            return () => clearTimeout(t);
        }
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [confirmOpen, submitting, hasStarted, allSubmitted, failedCount]);

    return (
        <>
            <Head>
                <title>PO Movement</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            </Head>

            <Box sx={{ background: '#121212', color: '#fff', minHeight: '100vh' }}>
                <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Toolbar sx={{ gap: 1 }}>
                        <IconButton edge="start" color="inherit" onClick={() => router.push('/dashboard')}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
                            PO Movement
                        </Typography>
                        <Chip
                            label={operatorName || 'Set name'}
                            icon={<EditIcon sx={{ fontSize: 16, color: 'inherit' }} />}
                            variant="outlined"
                            onClick={() => {
                                setNameDraft(operatorName || '');
                                setEditingName(true);
                            }}
                            sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
                        />
                    </Toolbar>
                </AppBar>

                <Container maxWidth="sm" sx={{ py: 3 }}>
                    <Stack spacing={2.5}>
                        <Paper elevation={0} sx={paperSx}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                                Add a PO
                            </Typography>

                            <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
                                <Button fullWidth variant="outlined" color="inherit" startIcon={<QrCodeScannerIcon />} onClick={() => openScanner('QR')}>
                                    Scan QR
                                </Button>
                                <Button fullWidth variant="outlined" color="inherit" startIcon={<BarcodeIcon />} onClick={() => openScanner('Barcode')}>
                                    Scan barcode
                                </Button>
                            </Stack>

                            <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.12)' }}>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    OR ENTER MANUALLY
                                </Typography>
                            </Divider>

                            <TextField
                                inputRef={manualInputRef}
                                fullWidth
                                value={manualValue}
                                onChange={handleManualChange}
                                onKeyDown={handleManualKeyDown}
                                onBlur={commitManual}
                                placeholder="XXXXXXXX"
                                inputProps={{ inputMode: 'numeric' }}
                                InputProps={{ startAdornment: <InputAdornment position="start">IB</InputAdornment> }}
                                error={!!manualError}
                                helperText={manualError || `${manualValue.length}/${PO_LENGTH} digits`}
                                sx={darkFieldSx}
                            />
                        </Paper>

                        <Paper elevation={0} sx={paperSx}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: items.length ? 1 : 0 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    Batch ({items.length})
                                </Typography>
                                {items.length > 0 && (
                                    <Button size="small" color="inherit" disabled={submitting} onClick={() => setItems([])}>
                                        Clear all
                                    </Button>
                                )}
                            </Stack>

                            {items.length === 0 ? (
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                    No POs added yet — scan or type an 8-digit PO number above.
                                </Typography>
                            ) : (
                                <List disablePadding>
                                    {items.map((item, idx) => (
                                        <React.Fragment key={item.id}>
                                            {idx > 0 && <Divider component="li" sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />}
                                            <ListItem
                                                disableGutters
                                                secondaryAction={
                                                    <IconButton edge="end" disabled={submitting} onClick={() => removeItem(item.id)}>
                                                        <DeleteOutlineIcon sx={{ color: 'rgba(255,255,255,0.6)' }} />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText
                                                    primary={formatPo(item)}
                                                    secondary={item.status === 'error' ? 'Failed to save — try again' : item.method}
                                                    secondaryTypographyProps={{
                                                        sx: { color: item.status === 'error' ? '#f28b82' : 'rgba(255,255,255,0.5)' }
                                                    }}
                                                />
                                            </ListItem>
                                        </React.Fragment>
                                    ))}
                                </List>
                            )}
                        </Paper>

                        <Stack direction="row" spacing={2}>
                            <Button
                                fullWidth
                                size="large"
                                variant="contained"
                                color="success"
                                disabled={items.length === 0 || submitting}
                                onClick={() => startMovement('IN')}
                            >
                                Mark IN
                            </Button>
                            <Button
                                fullWidth
                                size="large"
                                variant="contained"
                                color="error"
                                disabled={items.length === 0 || submitting}
                                onClick={() => startMovement('OUT')}
                            >
                                Mark OUT
                            </Button>
                        </Stack>
                    </Stack>
                </Container>
            </Box>

            {/* Operator name */}
            <Dialog open={editingName || !operatorName} maxWidth="xs" fullWidth>
                <DialogTitle>Operator name</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        margin="dense"
                        placeholder="Your name"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') saveOperatorName(nameDraft);
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    {operatorName && <Button onClick={() => setEditingName(false)}>Cancel</Button>}
                    <Button variant="contained" disabled={!nameDraft.trim()} onClick={() => saveOperatorName(nameDraft)}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Camera scanner */}
            <Dialog open={scannerOpen} onClose={closeScanner} maxWidth="xs" fullWidth>
                <DialogTitle>{scannerMode === 'QR' ? 'Scan QR code' : 'Scan barcode'}</DialogTitle>
                <DialogContent>
                    {scannerError ? (
                        <Alert severity="error">{scannerError}</Alert>
                    ) : (
                        <Box id="scannerViewport" sx={{ minHeight: 260, '& video': { width: '100%', borderRadius: 1 } }} />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeScanner}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Confirm + submit batch */}
            <Dialog
                open={confirmOpen}
                maxWidth="xs"
                fullWidth
                onClose={() => {
                    if (!submitting) closeConfirmDialog();
                }}
            >
                <DialogTitle>
                    {hasStarted && allSubmitted
                        ? 'Submission summary'
                        : `Confirm ${pendingAction} for ${items.length} PO${items.length === 1 ? '' : 's'}`}
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                        Operator: {operatorName}
                    </Typography>
                    <List dense disablePadding>
                        {items.map((item) => (
                            <ListItem
                                key={item.id}
                                disableGutters
                                secondaryAction={
                                    item.status === 'pending' ? (
                                        <CircularProgress size={18} />
                                    ) : item.status === 'success' ? (
                                        <CheckCircleIcon color="success" fontSize="small" />
                                    ) : item.status === 'error' ? (
                                        <ErrorOutlineIcon color="error" fontSize="small" />
                                    ) : null
                                }
                            >
                                <ListItemText primary={formatPo(item)} secondary={item.method} />
                            </ListItem>
                        ))}
                    </List>
                    {hasStarted && allSubmitted && (
                        <Typography variant="body2" sx={{ mt: 1.5 }} color={failedCount ? 'error' : 'success.main'}>
                            {succeededCount} of {items.length} saved{failedCount ? ` — ${failedCount} failed` : ''}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    {!hasStarted && !submitting && (
                        <>
                            <Button onClick={closeConfirmDialog}>Cancel</Button>
                            <Button variant="contained" onClick={submitBatch}>
                                Confirm
                            </Button>
                        </>
                    )}
                    {submitting && <Button disabled>Saving…</Button>}
                    {hasStarted && allSubmitted && failedCount > 0 && (
                        <>
                            <Button onClick={closeConfirmDialog}>Close</Button>
                            <Button variant="contained" color="error" onClick={retryFailed}>
                                Retry failed
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            <Snackbar
                open={!!snackbar}
                autoHideDuration={2500}
                onClose={() => setSnackbar(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {snackbar ? (
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                ) : undefined}
            </Snackbar>
        </>
    );
}