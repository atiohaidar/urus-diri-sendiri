
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { saveLog } from '@/lib/storage';
import { toast } from '@/components/ui/use-toast';
import { triggerSuccessHaptic } from '@/lib/haptics';

export const AppNotificationListener = () => {
    const navigate = useNavigate();

    useEffect(() => {
        let listenerHandle: any;

        const setupListener = async () => {
            console.log("🔔 Global Notification Listener Registered");

            listenerHandle = await LocalNotifications.addListener(
                'localNotificationActionPerformed',
                async (notification) => {
                    console.log("🔔 Notification Action Received:", notification.actionId);

                    const { actionId, inputValue, notification: notif } = notification;

                    // Handle Reply Input (Auto Save)
                    if (actionId === 'reply' && inputValue) {
                        const intention = notif.extra?.intention || '';

                        // Coba ambil data waktu dari payload
                        // Fallback ke default jika tidak ada (untuk kompatibilitas notif lama)
                        const duration = notif.extra?.duration || 0;
                        const startTimeMs = notif.extra?.startTime || Date.now();
                        const startTime = new Date(startTimeMs);

                        // Format Log Content
                        const startTimeFormatted = startTime.toLocaleTimeString('id-ID', {
                            hour: '2-digit', minute: '2-digit'
                        });
                        const dateFormatted = startTime.toLocaleDateString('id-ID', {
                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                        });

                        // Helper format duration
                        const formatDuration = (s: number) => {
                            if (!s) return '0 menit';
                            const m = Math.floor(s / 60);
                            const sec = s % 60;
                            return m > 0 ? `${m} menit ${sec > 0 ? `${sec} detik` : ''}` : `${sec} detik`;
                        };
                        const durationStr = formatDuration(duration);

                        const logContent = `⏱️ Sesi Fokus (Auto-Log)\n` +
                            `📅 ${dateFormatted}\n` +
                            `🕐 Mulai: ${startTimeFormatted}\n` +
                            `🎯 Target: ${durationStr}\n` +
                            `⏰ Realisasi: ${durationStr} ✅\n\n` +
                            `💭 Niat:\n${intention}\n\n` +
                            `✍️ Realita:\n${inputValue}`;

                        try {
                            // 1. SAVE LOG DIRECTLY
                            await saveLog({
                                type: 'text',
                                content: logContent
                            });

                            // 2. FEEDBACK
                            triggerSuccessHaptic();
                            toast({
                                title: "✅ Log Berhasil Disimpan!",
                                description: "Input dari notifikasi telah dicatat.",
                                duration: 3000
                            });

                            // 3. NAVIGATE TO HISTORY
                            // Kita pakai setTimeout sedikit agar user 'ngeh' aplikasi terbuka dulu
                            setTimeout(() => {
                                navigate('/history', { state: { tab: 'logs' } });
                            }, 500);

                        } catch (e) {
                            console.error("Failed to auto-save log from notification", e);
                            toast({
                                title: "Gagal Menyimpan Log",
                                description: "Silakan coba simpan manual.",
                                variant: "destructive"
                            });
                            // Fallback: Buka creator page dengan data yang sudah diisi
                            navigate('/log-creator', {
                                state: {
                                    recoverSession: {
                                        intention,
                                        reality: inputValue,
                                        duration,
                                        startTime
                                    }
                                }
                            });
                        }
                    }

                    // Handle "Buka App" Action (Timer Finished click)
                    else if (actionId === 'tap' || actionId === 'open') {
                        // User clicked the notification or "Open App" button
                        // Navigate to Log Creator to finish manually if not replied yet
                        if (notif.extra?.type === 'timer_finished') {
                            navigate('/log-creator', {
                                state: {
                                    recoverSession: {
                                        intention: notif.extra.intention,
                                        duration: notif.extra.duration,
                                        startTime: new Date(notif.extra.startTime || Date.now())
                                    }
                                }
                            });
                        }
                    }
                }
            );
        };

        setupListener();

        return () => {
            if (listenerHandle) {
                listenerHandle.remove();
            }
        };
    }, [navigate]);

    return null; // Invisible component
};
