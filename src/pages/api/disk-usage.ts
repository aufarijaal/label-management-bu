import type { NextApiRequest, NextApiResponse } from 'next';

interface DiskConfigResponse {
    attributes?: {
        size_gb?: number;
    };
}

interface DiskUtilResponse {
    metrics?: {
        fs_used_bytes?: number;
    };
}

interface DiskUsageApiPayload {
    usedBytes: number;
    allocatedBytes: number;
}

const SUPABASE_MANAGEMENT_API_BASE = 'https://api.supabase.com/v1';
const BYTES_PER_GB = 1024 * 1024 * 1024;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DiskUsageApiPayload | { error: string }>
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const managementToken = process.env.SUPABASE_MANAGEMENT_API_TOKEN;
    const projectRef = process.env.SUPABASE_PROJECT_REF;

    if (!managementToken || !projectRef) {
        return res.status(503).json({ error: 'Disk usage unavailable' });
    }

    const headers = {
        Authorization: `Bearer ${managementToken}`,
        Accept: 'application/json'
    };

    try {
        const [configRes, utilRes] = await Promise.all([
            fetch(`${SUPABASE_MANAGEMENT_API_BASE}/projects/${projectRef}/config/disk`, {
                method: 'GET',
                headers
            }),
            fetch(`${SUPABASE_MANAGEMENT_API_BASE}/projects/${projectRef}/config/disk/util`, {
                method: 'GET',
                headers
            })
        ]);

        if (!configRes.ok || !utilRes.ok) {
            return res.status(503).json({ error: 'Disk usage unavailable' });
        }

        const [configJson, utilJson] = (await Promise.all([
            configRes.json(),
            utilRes.json()
        ])) as [DiskConfigResponse, DiskUtilResponse];

        const allocatedGb = configJson?.attributes?.size_gb;
        const usedBytes = utilJson?.metrics?.fs_used_bytes;

        if (
            !Number.isFinite(allocatedGb) ||
            !Number.isFinite(usedBytes) ||
            (allocatedGb as number) <= 0 ||
            (usedBytes as number) < 0
        ) {
            return res.status(503).json({ error: 'Disk usage unavailable' });
        }

        const allocatedBytes = Math.round((allocatedGb as number) * BYTES_PER_GB);

        res.setHeader('Cache-Control', 'private, max-age=300, stale-while-revalidate=60');
        return res.status(200).json({
            usedBytes: Math.round(usedBytes as number),
            allocatedBytes
        });
    } catch {
        return res.status(503).json({ error: 'Disk usage unavailable' });
    }
}
