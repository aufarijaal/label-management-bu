import * as React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
    buildDiskUsageSummary,
    formatBytes,
    isValidDiskUsageApiResponse,
    type DiskUsageSummary
} from '../lib/diskUsage';

interface SidebarDiskUsageIndicatorProps {
    collapsed: boolean;
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface DiskUsageState {
    loading: boolean;
    error: boolean;
    unavailable: boolean;
    data: DiskUsageSummary | null;
}

const initialState: DiskUsageState = {
    loading: true,
    error: false,
    unavailable: false,
    data: null
};

function getProgressColor(state: DiskUsageState): 'primary' | 'warning' | 'error' {
    if (!state.data) {
        return 'primary';
    }

    if (state.data.criticalCapacity) {
        return 'error';
    }

    if (state.data.nearCapacity) {
        return 'warning';
    }

    return 'primary';
}

export default function SidebarDiskUsageIndicator({ collapsed }: SidebarDiskUsageIndicatorProps) {
    const [state, setState] = React.useState<DiskUsageState>(initialState);

    React.useEffect(() => {
        let mounted = true;

        const fetchDiskUsage = async () => {
            if (!mounted) {
                return;
            }

            setState((prev) => ({
                ...prev,
                loading: true,
                error: false,
                unavailable: false,
                data: null
            }));

            try {
                const response = await fetch('/api/disk-usage', {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                    cache: 'no-store'
                });

                if (!mounted) {
                    return;
                }

                if (!response.ok) {
                    setState({ loading: false, error: true, unavailable: false, data: null });
                    return;
                }

                const payload: unknown = await response.json();

                if (!isValidDiskUsageApiResponse(payload)) {
                    setState({ loading: false, error: false, unavailable: true, data: null });
                    return;
                }

                setState({
                    loading: false,
                    error: false,
                    unavailable: false,
                    data: buildDiskUsageSummary(payload)
                });
            } catch {
                if (!mounted) {
                    return;
                }

                setState({ loading: false, error: true, unavailable: false, data: null });
            }
        };

        void fetchDiskUsage();
        const timer = window.setInterval(fetchDiskUsage, REFRESH_INTERVAL_MS);

        return () => {
            mounted = false;
            window.clearInterval(timer);
        };
    }, []);

    if (state.loading) {
        return (
            <Box sx={{ px: collapsed ? 1 : 2, pb: 2 }}>
                <Skeleton variant="rounded" height={6} sx={{ borderRadius: 8 }} />
                {!collapsed && <Skeleton variant="text" sx={{ mt: 1 }} width="80%" />}
            </Box>
        );
    }

    if (state.error) {
        return (
            <Box sx={{ px: collapsed ? 1 : 2, pb: 2 }}>
                <Typography variant="caption" color="error.main" aria-live="polite">
                    Disk usage unavailable
                </Typography>
            </Box>
        );
    }

    if (state.unavailable || !state.data) {
        return (
            <Box sx={{ px: collapsed ? 1 : 2, pb: 2 }}>
                <Typography variant="caption" color="text.secondary" aria-live="polite">
                    Disk usage unavailable
                </Typography>
            </Box>
        );
    }

    const { usedBytes, allocatedBytes, remainingBytes, usedPercent, nearCapacity, criticalCapacity } = state.data;
    const percentLabel = `${usedPercent.toFixed(1)}% used`;
    const usedLabel = `${formatBytes(usedBytes)} used`;
    const remainingLabel = `${formatBytes(remainingBytes)} free`;

    return (
        <Box sx={{ px: collapsed ? 1 : 2, pb: 2 }}>
            {!collapsed && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="caption" color="text.secondary">
                        Disk usage
                    </Typography>
                    <Typography
                        variant="caption"
                        color={criticalCapacity ? 'error.main' : nearCapacity ? 'warning.main' : 'text.secondary'}
                    >
                        {percentLabel}
                    </Typography>
                </Box>
            )}

            <Tooltip title={collapsed ? `Disk usage: ${percentLabel}` : ''} placement="right">
                <LinearProgress
                    variant="determinate"
                    color={getProgressColor(state)}
                    value={usedPercent}
                    aria-label="Disk usage"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Number(usedPercent.toFixed(1))}
                    aria-valuetext={`${percentLabel}. ${usedLabel}. ${remainingLabel}.`}
                    sx={{
                        height: 6,
                        borderRadius: 999,
                        bgcolor: 'action.hover'
                    }}
                />
            </Tooltip>

            {!collapsed && (
                <Box sx={{ mt: 0.75 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {usedLabel} of {formatBytes(allocatedBytes)}
                    </Typography>
                    <Typography
                        variant="caption"
                        color={criticalCapacity ? 'error.main' : nearCapacity ? 'warning.main' : 'text.secondary'}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        aria-live="polite"
                    >
                        {nearCapacity && <WarningAmberIcon sx={{ fontSize: 14 }} />}
                        {remainingLabel} remaining
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
