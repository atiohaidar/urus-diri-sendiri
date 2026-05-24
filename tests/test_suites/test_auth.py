import uuid
import pytest
from tests.config import BASE_URL, DUMMY_USER, INVALID_USER
from tests.pages.login_page import LoginPage

def test_login_page_renders_correctly(page):
    """Menjamin seluruh elemen utama halaman login dirender dengan benar."""
    login_page = LoginPage(page)
    login_page.navigate(BASE_URL)
    
    # Assertions / Pengecekan kebenaran
    assert login_page.app_title.is_visible(), "Judul utama 'Urus Diri Sendiri' tidak terlihat!"
    assert login_page.email_input.is_visible(), "Kolom email input tidak ditemukan!"
    assert login_page.password_input.is_visible(), "Kolom password input tidak ditemukan!"
    assert login_page.submit_button.is_visible(), "Tombol submit tidak ditemukan!"
    assert login_page.submit_button.is_disabled(), "Tombol submit harus dinonaktifkan secara default saat kolom kosong!"


def test_switch_between_tabs(page):
    """Memastikan tab dapat berpindah secara responsif antara 'Masuk' dan 'Buat Akun'."""
    login_page = LoginPage(page)
    login_page.navigate(BASE_URL)

    # Secara default di Tab Masuk
    info_login = login_page.info_tip.inner_text()
    assert "Koneksi cloud wajib aktif" in info_login, "Teks panduan default di tab Masuk tidak sesuai!"

    # Berpindah ke Tab Buat Akun
    login_page.switch_to_register()
    page.wait_for_timeout(300) # Tunggu transisi animasi UI singkat
    
    info_register = login_page.info_tip.inner_text()
    assert "Buat akun baru" in info_register, "Teks panduan di tab Buat Akun tidak sesuai!"

    # Kembali ke Tab Masuk
    login_page.switch_to_login()
    page.wait_for_timeout(300)
    
    assert "Koneksi cloud wajib aktif" in login_page.info_tip.inner_text(), "Gagal berpindah kembali ke tab Masuk!"


def test_validation_active_submit_button(page):
    """Memastikan tombol submit hanya aktif ketika input form sudah diisi dengan benar."""
    login_page = LoginPage(page)
    login_page.navigate(BASE_URL)

    # Pastikan tombol non-aktif di awal
    assert login_page.submit_button.is_disabled()

    # Isi dengan dummy user
    login_page.fill_login_form(DUMMY_USER["email"], DUMMY_USER["password"])
    
    # Simpan screenshot sukses input form
    screenshot_path = "tests/screenshots/form_filled_success.png"
    page.screenshot(path=screenshot_path)
    print(f"\nTangkapan layar berhasil disimpan ke: {screenshot_path}")
    
    assert login_page.submit_button.is_enabled(), "Tombol masuk tetap non-aktif padahal form sudah terisi!"


def test_password_visibility_toggle(page):
    """Menguji fungsionalitas tombol toggle/mata untuk menyembunyikan dan melihat password."""
    login_page = LoginPage(page)
    login_page.navigate(BASE_URL)

    # Cek tipe input default adalah 'password'
    assert login_page.password_input.get_attribute("type") == "password", "Secara default password harus disembunyikan!"

    # Klik tombol mata untuk memperlihatkan password
    login_page.toggle_password_visibility()
    page.wait_for_timeout(200)
    assert login_page.password_input.get_attribute("type") == "text", "Tipe input tidak berubah menjadi 'text' setelah di-toggle!"

    # Klik kembali untuk menyembunyikan
    login_page.toggle_password_visibility()
    page.wait_for_timeout(200)
    assert login_page.password_input.get_attribute("type") == "password", "Gagal menyembunyikan kembali password setelah di-toggle ulang!"


def test_register_and_login_success(page):
    """Menguji pendaftaran akun baru hingga berhasil masuk ke dashboard."""
    login_page = LoginPage(page)
    login_page.navigate(BASE_URL)

    # 1. Berpindah ke tab Buat Akun
    login_page.switch_to_register()
    page.wait_for_timeout(300)

    # 2. Isi form dengan email unik/random dan password valid
    unique_email = f"test_{uuid.uuid4().hex[:8]}@urusdiri.app"
    login_page.fill_login_form(unique_email, "SecurePassword123!")
    
    # 3. Klik tombol submit (Buat Akun & Masuk)
    login_page.click_submit()

    # 4. Tunggu proses registrasi & sinkronisasi data
    # Kita tunggu sampai elemen header halaman utama (dashboard) dirender
    page.wait_for_selector("header", timeout=15000)

    # 5. Pengecekan Dashboard
    # Pastikan judul utama aplikasi tidak lagi berada di halaman login
    assert not login_page.app_title.is_visible(), "Layar login masih terlihat!"
    
    # Pastikan sapaan di HomeHeader dirender
    dashboard_header = page.locator("h1.font-handwriting").first
    assert dashboard_header.is_visible(), "Header dashboard tidak ditemukan!"
    
    # Simpan screenshot dashboard sukses sebagai laporan
    dashboard_screenshot = "tests/screenshots/dashboard_success.png"
    page.screenshot(path=dashboard_screenshot)
    print(f"\nDashboard berhasil diakses! Screenshot disimpan di: {dashboard_screenshot}")
