import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // During build time (prerendering), environment variables might not be set.
    // Use fallback placeholder values to prevent the build process from crashing.
    return createBrowserClient(
        url || 'https://placeholder-project.supabase.co',
        anonKey || 'placeholder-anon-key'
    );
}   