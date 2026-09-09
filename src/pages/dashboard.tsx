import * as React from 'react';
import Head from 'next/head';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import LabelIcon from '@mui/icons-material/Label';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import GroupIcon from '@mui/icons-material/Group';
import PrintIcon from '@mui/icons-material/Print';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AppLayout from '../components/AppLayout';
import type { Department } from '../types';

const UNASSIGNED_KEY = '__unassigned__';

const CHART_COLOR_PALETTE = ['#0097A7', '#34A853', '#FBBC05', '#EA4335', '#8E24AA', '#3949AB'];

function colorForDeptId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return CHART_COLOR_PALETTE[hash % CHART_COLOR_PALETTE.length];
}

const DATE_RANGE_OPTIONS = [
    { value: 1, label: 'Past 1 Month' },
    { value: 3, label: 'Past 3 Months' },
    { value: 6, label: 'Past 6 Months' },
    { value: 12, label: 'Past 1 Year' },
];

interface ChartRow {
    dept: string;
    label: string;
    total: number;
    color: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'User';

    const [departments, setDepartments] = React.useState<Department[]>([]);
    const deptMap = React.useMemo(
        () => Object.fromEntries(departments.map((d) => [d.id, d.title])),
        [departments]
    );

    const [dateRange, setDateRange] = React.useState(3);
    const [rawTotals, setRawTotals] = React.useState<Record<string, number>>({});
    const [totalPrinted, setTotalPrinted] = React.useState(0);
    const [chartLoading, setChartLoading] = React.useState(true);

    // All-time stats (not date-filtered)
    const [statsLoading, setStatsLoading] = React.useState(true);
    const [totalAllTime, setTotalAllTime] = React.useState(0);
    const [pendingCount, setPendingCount] = React.useState(0);
    const [topDeptId, setTopDeptId] = React.useState<string | null>(null);

    const chartData = React.useMemo<ChartRow[]>(() => {
        return Object.entries(rawTotals)
            .map(([dept, total]) => ({
                dept,
                label: dept === UNASSIGNED_KEY ? 'Unassigned' : (deptMap[dept] ?? dept),
                total,
                color: dept === UNASSIGNED_KEY ? '#9E9E9E' : colorForDeptId(dept),
            }))
            .sort((a, b) => b.total - a.total);
    }, [rawTotals, deptMap]);

    React.useEffect(() => {
        async function fetchDepartments() {
            const { data } = await supabase.from('departments').select('id, title');
            setDepartments(data ?? []);
        }
        fetchDepartments();
    }, []);

    React.useEffect(() => {
        async function fetchStats() {
            setStatsLoading(true);

            const { data, error } = await supabase
                .from('ila_avery_note_items')
                .select('print_qty, done, dept_id');

            if (error || !data) {
                setStatsLoading(false);
                return;
            }

            let total = 0;
            let pending = 0;
            const deptTotals: Record<string, number> = {};

            for (const row of data) {
                total += row.print_qty ?? 0;
                if (row.done === false) pending += 1;
                const key = row.dept_id ?? UNASSIGNED_KEY;
                deptTotals[key] = (deptTotals[key] ?? 0) + (row.print_qty ?? 0);
            }

            const topKey = Object.entries(deptTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

            setTotalAllTime(total);
            setPendingCount(pending);
            setTopDeptId(topKey);
            setStatsLoading(false);
        }

        fetchStats();
    }, []);

    React.useEffect(() => {
        async function fetchChartData() {
            setChartLoading(true);
            const from = new Date();
            from.setMonth(from.getMonth() - dateRange);

            const { data, error } = await supabase
                .from('ila_avery_note_items')
                .select('dept_id, print_qty')
                .gte('created_at', from.toISOString());

            if (error || !data) {
                setRawTotals({});
                setChartLoading(false);
                return;
            }

            const totals: Record<string, number> = {};
            let grandTotal = 0;
            for (const row of data) {
                const key = row.dept_id ?? UNASSIGNED_KEY;
                totals[key] = (totals[key] ?? 0) + (row.print_qty ?? 0);
                grandTotal += row.print_qty ?? 0;
            }

            setRawTotals(totals);
            setTotalPrinted(grandTotal);
            setChartLoading(false);
        }

        fetchChartData();
    }, [dateRange]);

    return (
        <AppLayout>
            <Head>
                <title>Dashboard — LabelManager</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, md: 4 }, flex: 1 }}>
                {/* Page header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Overview
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Welcome back, {displayName.split(' ')[0]}! Here&apos;s what&apos;s happening.
                        </Typography>
                    </Box>
                </Box>

                {/* Stats cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {[
                        { label: 'Total Labels Requested', value: totalAllTime.toLocaleString(), icon: <LabelIcon fontSize="large" />, color: '#0097A7', loading: statsLoading },
                        { label: 'Requests Still Pending', value: pendingCount.toLocaleString(), icon: <PendingActionsIcon fontSize="large" />, color: '#FBBC05', loading: statsLoading },
                        { label: 'Most Active Department', value: topDeptId ? (deptMap[topDeptId] ?? topDeptId) : '—', icon: <GroupIcon fontSize="large" />, color: '#EA4335', loading: statsLoading },
                    ].map((stat) => (
                        <Grid item xs={12} sm={6} lg={3} key={stat.label}>
                            <Card
                                elevation={0}
                                sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 3,
                                    height: '100%'
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                {stat.label}
                                            </Typography>
                                            {stat.loading ? (
                                                <CircularProgress size={28} sx={{ mt: 0.5 }} />
                                            ) : (
                                                <Typography variant="h4" fontWeight={700}>
                                                    {stat.value}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                bgcolor: `${stat.color}18`,
                                                color: stat.color
                                            }}
                                        >
                                            {stat.icon}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Print Qty by Department chart */}
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 4 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h6" fontWeight={700}>
                                    Labels requested by Department
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Total quantity requested, grouped by department
                                </Typography>
                            </Box>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel id="date-range-label">Time Period</InputLabel>
                                <Select
                                    labelId="date-range-label"
                                    value={dateRange}
                                    label="Time Period"
                                    onChange={(e) => setDateRange(Number(e.target.value))}
                                >
                                    {DATE_RANGE_OPTIONS.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Divider sx={{ mb: 3 }} />

                        {chartLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                                <CircularProgress />
                            </Box>
                        ) : chartData.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 280 }}>
                                <Typography color="text.secondary">No data available for this period.</Typography>
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                                    <XAxis dataKey="label" tick={{ fontSize: 13 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => v.toLocaleString()} />
                                    <RechartsTooltip
                                        formatter={(value) => [Number(value).toLocaleString(), 'Labels Requested']}
                                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                    />
                                    <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={80}>
                                        {chartData.map((entry) => (
                                            <Cell key={entry.dept} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}

                        {!chartLoading && chartData.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                                {chartData.map((row) => (
                                    <Box key={row.dept} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: row.color, flexShrink: 0 }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {row.label}: <strong>{row.total.toLocaleString()}</strong>
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </AppLayout>
    );
}

