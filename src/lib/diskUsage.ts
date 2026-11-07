export interface DiskUsageSnapshot {
    usedBytes: number;
    allocatedBytes: number;
}

export interface DiskUsageSummary extends DiskUsageSnapshot {
    remainingBytes: number;
    usedPercent: number;
    nearCapacity: boolean;
    criticalCapacity: boolean;
}

export interface DiskUsageApiResponse {
    usedBytes: number;
    allocatedBytes: number;
}

export function clampPercentage(value: number): number {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.min(100, value));
}

export function buildDiskUsageSummary(snapshot: DiskUsageSnapshot): DiskUsageSummary {
    const safeUsed = Number.isFinite(snapshot.usedBytes) ? Math.max(snapshot.usedBytes, 0) : 0;
    const safeAllocated = Number.isFinite(snapshot.allocatedBytes)
        ? Math.max(snapshot.allocatedBytes, 0)
        : 0;

    const remainingBytes = Math.max(safeAllocated - safeUsed, 0);
    const usedPercent = safeAllocated > 0 ? clampPercentage((safeUsed / safeAllocated) * 100) : 0;

    return {
        usedBytes: safeUsed,
        allocatedBytes: safeAllocated,
        remainingBytes,
        usedPercent,
        nearCapacity: usedPercent >= 85,
        criticalCapacity: usedPercent >= 95
    };
}

export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    const precision = value >= 100 || unitIndex === 0 ? 0 : 1;
    return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export function isValidDiskUsageApiResponse(value: unknown): value is DiskUsageApiResponse {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const parsed = value as DiskUsageApiResponse;

    return (
        Number.isFinite(parsed.usedBytes) &&
        parsed.usedBytes >= 0 &&
        Number.isFinite(parsed.allocatedBytes) &&
        parsed.allocatedBytes > 0
    );
}
