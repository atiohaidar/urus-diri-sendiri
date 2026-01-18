import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner"; // Library Sonner: Alternatif notifikasi yang lebih modern & ringan

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * KENAPA HARUS ADA 2 (TOASTER & SONNER)?
 * Sebenarnya satu saja cukup, tapi biasanya keduanya dipasang karena:
 * 1. Fleksibilitas Layout: Toaster (Radix) lebih kuat untuk notifikasi kompleks yang 
 *    punya banyak tombol atau struktur teks yang rumit.
 * 2. Estetika & Kecepatan: Sonner jauh lebih unggul dalam hal animasi "stacking" 
 *    (notifikasi bertumpuk) yang sangat mulus dan kode yang jauh lebih simpel.
 * 3. Standar Template: Banyak template modern (seperti Shadcn/UI) menyertakan keduanya 
 *    agar developer bisa pilih: "Mau yang serius (Toaster)" atau "Mau yang asik (Sonner)".
 * 
 * SARAN: Untuk aplikasi kamu, saya sarankan pakai SONNER untuk hampir semua hal 
 * karena animasinya lebih cocok dengan gaya aplikasi modern/mobile.
 */

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        // Styling: Di sini kita atur agar warna Sonner sinkron dengan tema aplikasi kita (shadcn/ui)
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
