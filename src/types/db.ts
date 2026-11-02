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
    art: string | null;
    remark: string | null;
    print_qty: number | null;
    created_at: string | null;
    done: 'pending' | 'cancel' | 'done' | boolean | null;
    input_id: string | null;
    dept_id: string | null;
    returned: number | null;
    short_group_code: string | null;
    label_id: string | null;
};

export type OrderData = {
    id: number;
    fty_sap: string | null;
    gtn: string | null;
    release_date: string | null;
    model_number: string | null;
    model_name: string | null;
    art: string | null;
    destination: string | null;
    size_1: number | null;
    size_1t: number | null;
    size_2: number | null;
    size_2t: number | null;
    size_3: number | null;
    size_3t: number | null;
    size_4: number | null;
    size_4t: number | null;
    size_5: number | null;
    size_5t: number | null;
    size_6: number | null;
    size_6t: number | null;
    size_7: number | null;
    size_7t: number | null;
    size_8: number | null;
    size_8t: number | null;
    size_9: number | null;
    size_9t: number | null;
    size_10: number | null;
    size_10t: number | null;
    size_11: number | null;
    size_11t: number | null;
    size_12: number | null;
    size_12t: number | null;
    size_13: number | null;
    size_13t: number | null;
    old_gtn: string | null;
    old_sap: string | null;
    changes: string | null;
};
