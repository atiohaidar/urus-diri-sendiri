import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip"; // Library dasar untuk fitur floating (melayang)

import { cn } from "@/lib/utils"; // Fungsi pembantu untuk menggabungkan class CSS

/**
 * KENAPA PAKAI TOOLTIP?
 * 1. Menghemat Tempat: Kalau ada tombol yang cuma ikon saja (misal ikon '+'), 
 *    user mungkin bingung itu tombol apa. Tooltip kasih tahu: "Tambah Data Baru".
 * 2. Panduan User: Membantu user baru memahami fungsi fitur tanpa membuat 
 *    tampilan penuh dengan teks penjelasan yang panjang.
 * 3. Aksesibilitas: Memberikan konteks tambahan pada elemen aplikasi.
 * 
 * PERUMPAMAAN: Tooltip adalah "Label Gantung" pada barang di toko.
 * Kita tidak perlu nempel teks besar di barangnya, cukup kasih label kecil 
 * yang bisa dibuka kalau mau tahu detailnya.
 */

// Saklar Pusat: Harus dipasang di App.tsx agar semua tooltip bisa jalan
const TooltipProvider = TooltipPrimitive.Provider;

// Pembungkus satu kesatuan Tooltip
const Tooltip = TooltipPrimitive.Root;

// Pemicu: Elemen yang kalau disentuh/di-hover bakal memunculkan teks (misal: Button)
const TooltipTrigger = TooltipPrimitive.Trigger;

// Konten: Kotak melayang yang berisi teks penjelasan
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref} // Penunjuk koordinat agar kotak melayang tahu harus muncul di mana
    sideOffset={sideOffset} // Jarak antara kotak tooltip dengan tombol pemicunya
    className={cn(
      // Styling: z-50 (paling depan), bg-popover (warna background), shadow-md (bayangan)
      // data-[state]: Mengatur animasi saat muncul (animate-in) dan saat hilang (animate-out)
      "z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
