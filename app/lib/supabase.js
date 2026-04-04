import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseInstance = null;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase environment variables. Database features will not work.");
    // Mock object to prevent runtime crashes
    supabaseInstance = {
        storage: {
            from: () => ({
                upload: async () => ({ error: new Error("Supabase not configured") }),
                getPublicUrl: () => ({ data: { publicUrl: null } })
            })
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => ({ data: [], error: null })
                })
            })
        })
    };
} else {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
