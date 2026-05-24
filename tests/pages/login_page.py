from tests.pages.base_page import BasePage

class LoginPage(BasePage):
    """Page Object for interacting with the Login Page UI."""
    
    def __init__(self, page):
        super().__init__(page)
        # Locators (Selectors)
        self.email_input = page.locator("input[type='email']")
        self.password_input = page.locator("input[placeholder='••••••••']")
        self.submit_button = page.locator("button[type='submit']")
        self.tab_masuk = page.locator("button:has-text('Masuk (Login)')")
        self.tab_buat_akun = page.locator("button:has-text('Buat Akun')")
        self.info_tip = page.locator("form p").first
        self.app_title = page.locator("h1:has-text('Urus Diri Sendiri')")
        self.password_toggle = page.locator("button:has(svg.lucide-eye, svg.lucide-eye-off)")

    def navigate(self, url):
        self.page.goto(url)
        # Tunggu form login dirender sempurna di halaman
        self.page.wait_for_selector("form", timeout=10000)

    def fill_login_form(self, email, password):
        self.email_input.fill(email)
        self.password_input.fill(password)

    def click_submit(self):
        self.submit_button.click()

    def switch_to_register(self):
        self.tab_buat_akun.click()

    def switch_to_login(self):
        self.tab_masuk.click()

    def toggle_password_visibility(self):
        self.password_toggle.click()
