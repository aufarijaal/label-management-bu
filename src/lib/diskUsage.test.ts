import { describe, expect, it } from 'vitest';
import {
    buildDiskUsageSummary,
    clampPercentage,
    formatBytes,
    isValidDiskUsageApiResponse
} from './diskUsage';

describe('disk usage calculations', () => {
    it('clamps percentage to valid bounds', () => {
        expect(clampPercentage(-25)).toBe(0);
        expect(clampPercentage(42.5)).toBe(42.5);
        expect(clampPercentage(120)).toBe(100);
    });

    it('calculates remaining and used percent with clamps', () => {
        const summary = buildDiskUsageSummary({
            usedBytes: 120,
            allocatedBytes: 100
        });

        expect(summary.usedPercent).toBe(100);
        expect(summary.remainingBytes).toBe(0);
        expect(summary.criticalCapacity).toBe(true);
        expect(summary.nearCapacity).toBe(true);
    });

    it('formats bytes with human readable units', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(1024)).toBe('1.0 KB');
        expect(formatBytes(1024 * 1024 * 3)).toBe('3.0 MB');
    });

    it('validates API payload shape', () => {
        expect(isValidDiskUsageApiResponse({ usedBytes: 1, allocatedBytes: 2 })).toBe(true);
        expect(isValidDiskUsageApiResponse({ usedBytes: -1, allocatedBytes: 2 })).toBe(false);
        expect(isValidDiskUsageApiResponse({ usedBytes: 1, allocatedBytes: 0 })).toBe(false);
        expect(isValidDiskUsageApiResponse(null)).toBe(false);
    });
});
