import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

if (!isSupabaseConfigured) {
    console.warn('Supabase credentials missing. Cloud storage will not work.');
}

// Use dummy values if not configured to prevent crash on createClient
// valid URL format is required by some versions
const clientUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const clientKey = isSupabaseConfigured ? supabaseKey : 'placeholder';

export const supabase = createClient(clientUrl, clientKey);

export const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
        throw new Error("Supabase is not configured in this environment.");
    }

    const redirectTo = Capacitor.isNativePlatform()
        ? 'com.urusdirisendiri.app://login-callback'
        : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo,
            queryParams: {
                prompt: 'select_account'
            }
        }
    });
    if (error) throw error;
};

export const signOut = async () => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};
