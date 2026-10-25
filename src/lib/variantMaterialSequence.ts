export type VariantOutputFormat = 'line' | 'tsv' | 'csv';

export interface VariantGeneratorInput {
    baseMaterialCode: string;
    startSequence: number;
    endSequence: number;
    sequenceWidth: number;
    repetitionsPerSequence: number;
    outputFormat: VariantOutputFormat;
    maxRows?: number;
}

export interface VariantGeneratorResult {
    rows: string[];
    output: string;
    uniqueSequenceCount: number;
    repetitionsPerSequence: number;
    totalRows: number;
}

export function generateVariantMaterialSequence(input: VariantGeneratorInput): VariantGeneratorResult {
    const {
        baseMaterialCode,
        startSequence,
        endSequence,
        sequenceWidth,
        repetitionsPerSequence,
        outputFormat,
        maxRows = 50000
    } = input;

    const base = String(baseMaterialCode || '').trim();
    if (!base) {
        throw new Error('Base material code is required.');
    }

    if (!Number.isInteger(startSequence) || !Number.isInteger(endSequence)) {
        throw new Error('Starting and ending sequence must be valid integers.');
    }

    if (endSequence < startSequence) {
        throw new Error('Ending sequence must be greater than or equal to starting sequence.');
    }

    if (!Number.isInteger(sequenceWidth) || sequenceWidth <= 0) {
        throw new Error('Sequence width must be a positive integer.');
    }

    if (!Number.isInteger(repetitionsPerSequence) || repetitionsPerSequence <= 0) {
        throw new Error('Repetitions per sequence must be a positive integer.');
    }

    const uniqueSequenceCount = endSequence - startSequence + 1;
    const totalRows = uniqueSequenceCount * repetitionsPerSequence;

    if (totalRows > maxRows) {
        throw new Error(`Output too large (${totalRows.toLocaleString()} rows). Reduce the range or repetitions.`);
    }

    const rows: string[] = [];

    for (let seq = startSequence; seq <= endSequence; seq += 1) {
        const sequencePart = String(seq).padStart(sequenceWidth, '0');
        const materialCode = `${base}${sequencePart}`;

        for (let i = 0; i < repetitionsPerSequence; i += 1) {
            rows.push(materialCode);
        }
    }

    return {
        rows,
        output: formatRows(rows, outputFormat),
        uniqueSequenceCount,
        repetitionsPerSequence,
        totalRows
    };
}

function formatRows(rows: string[], outputFormat: VariantOutputFormat): string {
    if (outputFormat === 'csv') {
        return rows.map(escapeCsvCell).join('\n');
    }

    if (outputFormat === 'tsv') {
        return rows.map(escapeTsvCell).join('\n');
    }

    return rows.join('\n');
}

function escapeCsvCell(value: string): string {
    const needsQuotes = /[",\n\r]/.test(value);
    if (!needsQuotes) {
        return value;
    }

    return `"${value.replace(/"/g, '""')}"`;
}

function escapeTsvCell(value: string): string {
    return value.replace(/\t/g, ' ');
}
