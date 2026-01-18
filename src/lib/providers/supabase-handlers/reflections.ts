import { supabase } from '../../supabase';
import { Reflection } from '../../types';
import { getImage, deleteImage } from '../../idb';

export const fetchReflections = async (userId: string, since?: string) => {
    let query = supabase
        .from('reflections')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

    if (since) {
        query = query.gt('updated_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((row: any) => ({
        id: row.id,
        date: row.date,
        winOfDay: row.win_of_day,
        hurdle: row.hurdle,
        priorities: row.priorities || [],
        smallChange: row.small_change,
        todayRoutines: row.today_routines,
        todayPriorities: row.today_priorities,
        images: row.images || [],
        imageIds: [], // We don't sync IDB IDs from server
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at
    })) as Reflection[];
};

export const syncReflection = async (userId: string, reflection: Reflection) => {
    let finalImageUrls = reflection.images || [];

    // Upload images if they exist in IDB
    if (reflection.imageIds && reflection.imageIds.length > 0) {
        for (const id of reflection.imageIds) {
            const blobBase64 = await getImage(id);
            if (blobBase64) {
                const res = await fetch(blobBase64);
                const blob = await res.blob();
                const fileName = `${userId}/${Date.now()}-${id}.jpg`;

                const { data, error } = await supabase.storage
                    .from('images')
                    .upload(fileName, blob);

                if (!error && data) {
                    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                    finalImageUrls.push(publicUrl);

                    // PERFORMANCE: We keep the local image in IDB as a cache.
                    // This allows instant viewing even when offline or on slow connections.
                    // await deleteImage(id); 
                } else if (error) {
                    throw error;
                }
            }
        }
    }

    const row = {
        id: reflection.id,
        date: reflection.date,
        win_of_day: reflection.winOfDay,
        hurdle: reflection.hurdle,
        priorities: reflection.priorities,
        small_change: reflection.smallChange,
        today_routines: reflection.todayRoutines,
        today_priorities: reflection.todayPriorities,
        images: finalImageUrls,
        updated_at: reflection.updatedAt || new Date().toISOString(),
        deleted_at: reflection.deletedAt || null,
        user_id: userId
    };

    const { error } = await supabase.from('reflections').upsert(row);
    if (error) throw error;
};
