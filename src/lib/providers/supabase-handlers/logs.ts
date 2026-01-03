import { supabase } from '../../supabase';
import { ActivityLog } from '../../types';
import { getImage, deleteImage } from '../../idb';

export const fetchLogs = async (userId: string, since?: string) => {
    let query = supabase
        .from('logs')
        .select('*')
        .order('timestamp', { ascending: false });

    if (since) {
        query = query.gt('updated_at', since);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((r: any) => ({
        id: r.id,
        timestamp: r.timestamp,
        type: r.type,
        content: r.content,
        mediaId: r.media_url,
        category: r.category,
        updatedAt: r.updated_at,
        deletedAt: r.deleted_at
    })) as ActivityLog[];
};

export const syncLog = async (userId: string, log: ActivityLog) => {
    let contentOrUrl = log.mediaId;

    // Image handling for logs
    if (log.type === 'photo' && log.mediaId && !log.mediaId.startsWith('http')) {
        const blobBase64 = await getImage(log.mediaId);
        if (blobBase64) {
            const res = await fetch(blobBase64);
            const blob = await res.blob();
            const fileName = `${userId}/logs-${Date.now()}.jpg`;
            const { data, error } = await supabase.storage.from('images').upload(fileName, blob);
            if (error) throw error;

            if (data) {
                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                contentOrUrl = publicUrl;
                // Delete local binary data to save space, keeping the cloud URL
                await deleteImage(log.mediaId);
            }
        }
    }

    const row = {
        id: log.id,
        timestamp: log.timestamp,
        type: log.type,
        content: log.content,
        media_url: contentOrUrl,
        category: log.category,
        updated_at: log.updatedAt || new Date().toISOString(),
        deleted_at: log.deletedAt || null,
        user_id: userId
    };

    const { error } = await supabase.from('logs').upsert(row);
    if (error) throw error;
};

export const deleteRemoteLog = async (userId: string, id: string) => {
    const { error } = await supabase
        .from('logs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw error;
};
