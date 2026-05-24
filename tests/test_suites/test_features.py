import uuid
import pytest
from tests.config import BASE_URL
from tests.pages.login_page import LoginPage

def test_complete_user_flow(page):
    """Menguji alur lengkap dari pendaftaran, penambahan prioritas, penyelesaian, hapus prioritas, hingga penulisan catatan ide di Parking Lot."""
    login_page = LoginPage(page)
    login_page.navigate(BASE_URL)

    # ==========================================
    # 1. REGISTER & LOGIN UTUH
    # ==========================================
    print("\n[1/3] Melakukan pendaftaran akun baru...")
    login_page.switch_to_register()
    page.wait_for_timeout(300)

    unique_email = f"test_flow_{uuid.uuid4().hex[:8]}@urusdiri.app"
    login_page.fill_login_form(unique_email, "SecureFlow123!")
    login_page.click_submit()

    # Tunggu sinkronisasi awal dan masuk ke dashboard
    page.wait_for_selector("header", timeout=15000)
    print("[OK] Berhasil masuk ke Dashboard.")

    # ==========================================
    # 2. FITUR PRIORITAS (HOME SCREEN)
    # ==========================================
    print("\n[2/3] Menguji fungsionalitas Prioritas...")
    
    # Masukkan prioritas baru
    priority_text = "Belajar E2E Automation dengan Playwright"
    priority_input = page.locator("section:has-text('Prioritas') input:visible")
    
    # Tunggu input muncul di halaman
    priority_input.first.wait_for(state="visible", timeout=5000)
    priority_input.first.fill(priority_text)
    
    # Tekan Enter untuk mengirim prioritas baru (karena pada kondisi kosong tombol Plus tidak dirender)
    priority_input.first.press("Enter")
    page.wait_for_timeout(1000) # Tunggu render prioritas baru
    
    # Verifikasi prioritas muncul di list
    priority_item = page.locator(f"section:has-text('Prioritas') span:has-text('{priority_text}'):visible")
    assert priority_item.first.is_visible(), "Gagal menambahkan item prioritas ke daftar!"
    print("[OK] Prioritas berhasil ditambahkan.")

    # Ambil screenshot kondisi prioritas terbuat
    page.screenshot(path="tests/screenshots/1_priority_created.png")

    # Selesaikan prioritas (klik checkbox)
    # Gunakan button checkbox terdekat dari prioritas yang kita buat
    checkbox = page.locator("section:has-text('Prioritas') div.group:visible").first.locator("button").first
    # Jika belum tercentang, item checkbox kita klik
    checkbox.click()
    page.wait_for_timeout(500)
    
    # Form dialog catatan opsional akan muncul
    # Masukkan catatan opsional penyelesaian
    note_textarea = page.locator("textarea[placeholder*='Ada catatan khusus']:visible")
    if note_textarea.is_visible():
        note_textarea.fill("Selesai dipelajari dengan sangat baik dalam 1 sesi.")
        save_note_btn = page.locator("button:has-text('✓ Simpan'):visible")
        save_note_btn.click()
        page.wait_for_timeout(1000)
        
    print("[OK] Prioritas berhasil ditandai selesai.")
    
    # Ambil screenshot kondisi prioritas selesai
    page.screenshot(path="tests/screenshots/2_priority_completed.png")

    # Hapus prioritas
    # Hover atau langsung klik tombol hapus (Trash2 icon)
    delete_btn = page.locator("section:has-text('Prioritas') div.group:visible").first.locator("button[aria-label='Delete priority']").first
    # Klik tombol hapus
    delete_btn.click()
    page.wait_for_timeout(1000)
    
    # Pastikan prioritas hilang
    assert not priority_item.first.is_visible(), "Gagal menghapus item prioritas!"
    print("[OK] Prioritas berhasil dihapus.")

    # ==========================================
    # 3. FITUR KOTAK IDE / PARKING LOT
    # ==========================================
    print("\n[3/3] Menguji fungsionalitas Tempat Parkir Ide...")
    
    # Navigasi ke menu "Ide" di sidebar
    ide_nav_btn = page.locator("button:has-text('Ide'), button:has(svg.lucide-lightbulb)").first
    ide_nav_btn.click()
    
    # Tunggu halaman "Tempat Parkir Ide" terbuka
    page.wait_for_selector("h1:has-text('Tempat Parkir Ide')", timeout=10000)
    print("[OK] Berhasil berpindah ke halaman 'Tempat Parkir Ide'.")
    
    # Klik tombol FAB (Pencil/PenLine icon) untuk membuat ide baru
    fab_btn = page.locator("button:has(svg.lucide-pen-line)").first
    fab_btn.click()
    
    # Tunggu Note Editor terbuka
    page.wait_for_selector("input[placeholder='Judul...']", timeout=10000)
    
    # Isi Judul Ide
    ide_title = "Rencana Proyek AI Modern"
    page.locator("input[placeholder='Judul...']").fill(ide_title)
    
    # Isi Konten Ide ke Quill Editor
    ide_content = "Ide membuat asisten pintar berbasis model penalaran modern yang bisa menguji aplikasi web secara otonom."
    page.locator(".ql-editor").fill(ide_content)
    
    # Klik tombol Selesai untuk menyimpan
    selesal_btn = page.locator("button:has-text('Selesai')")
    selesal_btn.click()
    page.wait_for_timeout(1000) # Tunggu proses save selesai

    # Klik tombol kembali di editor untuk kembali ke daftar ide (karena setelah save, editor tetap terbuka dalam mode read-only)
    back_btn = page.locator("button:has(svg.lucide-arrow-left)")
    back_btn.click()
    
    # Tunggu halaman kembali ke list ide
    page.wait_for_selector("h1:has-text('Tempat Parkir Ide')", timeout=10000)
    page.wait_for_timeout(1500) # Tunggu transisi data selesai
    
    # Verifikasi ide baru muncul di daftar
    assert page.locator(f"h3:has-text('{ide_title}')").first.is_visible(), "Catatan ide baru tidak muncul di daftar!"
    print("[OK] Ide baru berhasil disimpan dan muncul di daftar.")
    
    # Ambil screenshot sukses list ide
    page.screenshot(path="tests/screenshots/3_ideas_saved.png")
    
    print("\n[SUCCESS] SELURUH ALUR PENGUJIAN BEST-CASE FITUR BERHASIL DIJALANKAN!")
