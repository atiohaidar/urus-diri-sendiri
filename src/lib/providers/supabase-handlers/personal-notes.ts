import { supabase } from '@/lib/supabase';
import { PersonalNotesData } from '@/lib/types';

const TABLE = 'personal_notes';

export const fetchPersonalNotes = async (userId: string): Promise<PersonalNotesData | null> => {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            throw error;
        }

        if (!data) return null;

        // Map snake_case to camelCase
        return {
            isSetup: data.is_setup,
            passwordHash: data.password_hash,
            encryptedData: data.encrypted_data,
            salt: data.salt,
            iv: data.iv,
            updatedAt: data.updated_at,
        };
    } catch (error) {
        console.error('Error fetching personal notes from Supabase:', error);
        throw error;
    }
};

export const syncPersonalNotes = async (userId: string, data: PersonalNotesData): Promise<void> => {
    try {
        // Map camelCase to snake_case
        const payload = {
            user_id: userId,
            is_setup: data.isSetup,
            password_hash: data.passwordHash,
            encrypted_data: data.encryptedData,
            salt: data.salt,
            iv: data.iv,
            updated_at: data.updatedAt, // Use client timestamp or let server handle it? DB has trigger, but we send it.
        };

        const { error } = await supabase
            .from(TABLE)
            .upsert(payload, { onConflict: 'user_id' });

        if (error) throw error;

    } catch (error) {
        console.error('Error syncing personal notes to Supabase:', error);
        throw error;
    }
};
