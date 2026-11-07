import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SidebarDiskUsageIndicator from './SidebarDiskUsageIndicator';

const fetchMock = vi.fn();

describe('SidebarDiskUsageIndicator', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('shows loading state first', () => {
        fetchMock.mockImplementation(() => new Promise(() => {}));

        const { container } = render(<SidebarDiskUsageIndicator collapsed={false} />);

        expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull();
    });

    it('shows disk usage unavailable on request error', async () => {
        fetchMock.mockRejectedValue(new Error('network error'));

        render(<SidebarDiskUsageIndicator collapsed={false} />);

        await waitFor(() => {
            expect(screen.getByText('Disk usage unavailable')).toBeInTheDocument();
        });
    });

    it('shows disk usage unavailable when payload is invalid', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ usedBytes: 123 })
        });

        render(<SidebarDiskUsageIndicator collapsed={false} />);

        await waitFor(() => {
            expect(screen.getByText('Disk usage unavailable')).toBeInTheDocument();
        });
    });

    it('renders usage values when payload is valid', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({
                usedBytes: 4 * 1024 * 1024 * 1024,
                allocatedBytes: 10 * 1024 * 1024 * 1024
            })
        });

        render(<SidebarDiskUsageIndicator collapsed={false} />);

        await waitFor(() => {
            expect(screen.getByText('Disk usage')).toBeInTheDocument();
            expect(screen.getByText('40.0% used')).toBeInTheDocument();
            expect(screen.getByText('4.0 GB used of 10.0 GB')).toBeInTheDocument();
            expect(screen.getByText('6.0 GB free remaining')).toBeInTheDocument();
        });
    });
});
