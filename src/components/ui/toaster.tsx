import { useToast } from "@/hooks/use-toast"; // Hook utama buat manggil notifikasi
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

/**
 * CARA TRIGGER TOASTER (CARA PAKAI):
 * 1. Di komponen kamu, import hooknya: import { useToast } from "@/hooks/use-toast";
 * 2. Panggil di dalam komponen: const { toast } = useToast();
 * 3. Jalankan fungsinya: 
 *    toast({
 *      title: "Berhasil!",
 *      description: "Data sudah disimpan.",
 *    });
 * 
 * PERUMPAMAAN: Toaster adalah "Layar Pengumuman" di mall.
 * File ini kerjanya nunggu instruksi. Kalau ada yang teriak "toast!",
 * dia bakal buatin kotak pengumuman dan nampilin di pojok layar.
 */

export function Toaster() {
  const { toasts } = useToast(); // Mengambil daftar antrean notifikasi yang harus muncul

  return (
    <ToastProvider>
      {/* Melakukan looping (map) untuk nampilin semua notifikasi yang ada di antrean */}
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose /> {/* Tombol (X) buat nutup notifikasi */}
          </Toast>
        );
      })}
      {/* ToastViewport: Area tempat notifikasi bakal muncul (misal: Pojok Kanan Atas) */}
      <ToastViewport />
    </ToastProvider>
  );
}
