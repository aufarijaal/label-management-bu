/** Database entity types — mirrors Supabase `public` schema tables. */

export type Department = {
    id: string;
    title: string;
};

export type InputType = {
    id: string;
    title: string;
};

export type AveryNoteItem = {
    id: string;
    seq: number | null;
    po_no: string | null;
    remark: string | null;
    print_qty: number | null;
    created_at: string | null;
    done: boolean | null;
    input_id: string | null;
    dept_id: string | null;
    returned: number | null;
};
