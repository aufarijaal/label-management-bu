import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    generateVariantMaterialSequence,
    VariantGeneratorResult,
    VariantOutputFormat
} from '../lib/variantMaterialSequence';

const DEFAULT_GENERATOR_VALUES = {
    baseMaterialCode: '',
    startSequence: '1',
    endSequence: '12',
    sequenceWidth: '4',
    repetitionsPerSequence: '3',
    outputFormat: 'line' as VariantOutputFormat
};

const MAX_GENERATOR_ROWS = 50000;

export default function VariantMaterialSequencePage() {
    const router = useRouter();
    const [generatorValues, setGeneratorValues] = React.useState(DEFAULT_GENERATOR_VALUES);
    const [generatorError, setGeneratorError] = React.useState<string | null>(null);
    const [generatorResult, setGeneratorResult] = React.useState<VariantGeneratorResult | null>(null);
    const [generatorOutput, setGeneratorOutput] = React.useState('');
    const [actionFeedback, setActionFeedback] = React.useState<{ severity: 'success' | 'error'; message: string } | null>(null);

    const handleGeneratorFieldChange = (field: keyof typeof DEFAULT_GENERATOR_VALUES) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setGeneratorValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const parseInteger = (value: string, fieldName: string) => {
        if (!value.trim()) {
            throw new Error(`${fieldName} is required.`);
        }

        const parsed = Number(value);
        if (!Number.isInteger(parsed)) {
            throw new Error(`${fieldName} must be a valid integer.`);
        }

        return parsed;
    };

    const handleGenerate = () => {
        setGeneratorError(null);

        try {
            const result = generateVariantMaterialSequence({
                baseMaterialCode: generatorValues.baseMaterialCode,
                startSequence: parseInteger(generatorValues.startSequence, 'Starting sequence'),
                endSequence: parseInteger(generatorValues.endSequence, 'Ending sequence'),
                sequenceWidth: parseInteger(generatorValues.sequenceWidth, 'Sequence width'),
                repetitionsPerSequence: parseInteger(generatorValues.repetitionsPerSequence, 'Repetitions per sequence'),
                outputFormat: generatorValues.outputFormat,
                maxRows: MAX_GENERATOR_ROWS
            });

            setGeneratorResult(result);
            setGeneratorOutput(result.output);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to generate variant sequence output.';
            setGeneratorError(message);
            setGeneratorResult(null);
            setGeneratorOutput('');
        }
    };

    const handleResetGenerator = () => {
        setGeneratorValues(DEFAULT_GENERATOR_VALUES);
        setGeneratorError(null);
        setGeneratorResult(null);
        setGeneratorOutput('');
    };

    const handleCopyAll = async () => {
        if (!generatorOutput) {
            setActionFeedback({ severity: 'error', message: 'Nothing to copy. Generate output first.' });
            return;
        }

        try {
            await navigator.clipboard.writeText(generatorOutput);
            setActionFeedback({ severity: 'success', message: 'Output copied to clipboard.' });
        } catch (err) {
            setActionFeedback({ severity: 'error', message: 'Copy failed. Check browser clipboard permissions.' });
        }
    };

    const triggerDownload = (content: string, filename: string, mimeType: string) => {
        try {
            const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
            setActionFeedback({ severity: 'success', message: `${filename} downloaded.` });
        } catch (err) {
            setActionFeedback({ severity: 'error', message: 'Download failed. Please try again.' });
        }
    };

    const handleDownloadTxt = () => {
        if (!generatorOutput) {
            setActionFeedback({ severity: 'error', message: 'Nothing to download. Generate output first.' });
            return;
        }

        triggerDownload(generatorOutput, 'variant-material-sequence.txt', 'text/plain');
    };

    const handleDownloadCsv = () => {
        if (!generatorResult) {
            setActionFeedback({ severity: 'error', message: 'Nothing to download. Generate output first.' });
            return;
        }

        const csvOutput = generatorResult.rows
            .map((value) => {
                if (!/[",\n\r]/.test(value)) {
                    return value;
                }

                return `"${value.replace(/"/g, '""')}"`;
            })
            .join('\n');

        triggerDownload(csvOutput, 'variant-material-sequence.csv', 'text/csv');
    };

    return (
        <>
            <Head>
                <title>Variant Material Sequence Generator</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>

            <Box
                sx={{
                    background: '#121212',
                    color: '#fff',
                    minHeight: '100vh',
                    py: { xs: 4, md: 6 }
                }}
            >
                <Container maxWidth="lg">
                    <Stack spacing={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
                            <Box>
                                <Typography component="h1" variant="h4" fontWeight={700}>
                                    Variant Material Sequence Generator
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.78)', mt: 0.5 }}>
                                    Generate variant material rows with inclusive sequence ranges and preserved leading zeros.
                                </Typography>
                            </Box>
                            <Button
                                variant="outlined"
                                startIcon={<ArrowBackIcon />}
                                onClick={() => router.push('/')}
                                sx={{ textTransform: 'none', borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}
                            >
                                Back to Home
                            </Button>
                        </Box>

                        <Paper
                            elevation={0}
                            sx={{
                                textAlign: 'left',
                                p: { xs: 2.5, md: 3 },
                                border: '1px solid rgba(255,255,255,0.15)',
                                bgcolor: 'rgba(255,255,255,0.04)',
                                borderRadius: 2
                            }}
                        >
                            <Stack spacing={3}>
                                {generatorError && <Alert severity="error">{generatorError}</Alert>}

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="Base Material Code"
                                            value={generatorValues.baseMaterialCode}
                                            onChange={handleGeneratorFieldChange('baseMaterialCode')}
                                            placeholder="ADJR26FL-ORO89-KZ8669"
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.75)' } }}
                                            InputProps={{ sx: { color: '#fff' } }}
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' } }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField
                                            fullWidth
                                            label="Starting Sequence"
                                            type="number"
                                            value={generatorValues.startSequence}
                                            onChange={handleGeneratorFieldChange('startSequence')}
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.75)' } }}
                                            InputProps={{ sx: { color: '#fff' } }}
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' } }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField
                                            fullWidth
                                            label="Ending Sequence"
                                            type="number"
                                            value={generatorValues.endSequence}
                                            onChange={handleGeneratorFieldChange('endSequence')}
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.75)' } }}
                                            InputProps={{ sx: { color: '#fff' } }}
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' } }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField
                                            fullWidth
                                            label="Sequence Width"
                                            type="number"
                                            value={generatorValues.sequenceWidth}
                                            onChange={handleGeneratorFieldChange('sequenceWidth')}
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.75)' } }}
                                            InputProps={{ sx: { color: '#fff' } }}
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' } }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField
                                            fullWidth
                                            label="Repetitions per Sequence"
                                            type="number"
                                            value={generatorValues.repetitionsPerSequence}
                                            onChange={handleGeneratorFieldChange('repetitionsPerSequence')}
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.75)' } }}
                                            InputProps={{ sx: { color: '#fff' } }}
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' } }}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Output Format"
                                            value={generatorValues.outputFormat}
                                            onChange={handleGeneratorFieldChange('outputFormat')}
                                            InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.75)' } }}
                                            InputProps={{ sx: { color: '#fff' } }}
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' } }}
                                        >
                                            <MenuItem value="line">One code per line</MenuItem>
                                            <MenuItem value="tsv">TSV</MenuItem>
                                            <MenuItem value="csv">CSV</MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="flex-end" sx={{ height: '100%' }}>
                                            <Button variant="contained" onClick={handleGenerate} sx={{ textTransform: 'none' }}>
                                                Generate
                                            </Button>
                                            <Button variant="outlined" onClick={handleResetGenerator} sx={{ textTransform: 'none', borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
                                                Reset
                                            </Button>
                                        </Stack>
                                    </Grid>
                                </Grid>

                                {generatorResult && (
                                    <Stack spacing={2}>
                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                            <Chip
                                                label={`Unique sequences: ${generatorResult.uniqueSequenceCount.toLocaleString()}`}
                                                sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
                                            />
                                            <Chip
                                                label={`Repetitions per sequence: ${generatorResult.repetitionsPerSequence.toLocaleString()}`}
                                                sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
                                            />
                                            <Chip
                                                label={`Total output rows: ${generatorResult.totalRows.toLocaleString()}`}
                                                sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
                                            />
                                        </Stack>

                                        <Box>
                                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                                                Complete Result
                                            </Typography>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 2,
                                                    bgcolor: 'rgba(0,0,0,0.35)',
                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                    borderRadius: 1.5,
                                                    maxHeight: 420,
                                                    overflow: 'auto'
                                                }}
                                            >
                                                <Typography component="pre" sx={{ m: 0, fontFamily: 'monospace', color: '#fff', fontSize: 13 }}>
                                                    {generatorOutput}
                                                </Typography>
                                            </Paper>
                                        </Box>

                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                            <Button variant="contained" onClick={handleCopyAll} sx={{ textTransform: 'none' }}>
                                                Copy All
                                            </Button>
                                            <Button variant="outlined" onClick={handleDownloadTxt} sx={{ textTransform: 'none', borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
                                                Download TXT
                                            </Button>
                                            <Button variant="outlined" onClick={handleDownloadCsv} sx={{ textTransform: 'none', borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
                                                Download CSV
                                            </Button>
                                        </Stack>
                                    </Stack>
                                )}
                            </Stack>
                        </Paper>
                    </Stack>
                </Container>

                <Snackbar
                    open={Boolean(actionFeedback)}
                    autoHideDuration={2500}
                    onClose={() => setActionFeedback(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    {actionFeedback ? (
                        <Alert onClose={() => setActionFeedback(null)} severity={actionFeedback.severity} variant="filled" sx={{ width: '100%' }}>
                            {actionFeedback.message}
                        </Alert>
                    ) : null}
                </Snackbar>
            </Box>
        </>
    );
}
