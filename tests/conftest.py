import os
import pytest
from playwright.sync_api import sync_playwright

@pytest.fixture(scope="function")
def page():
    """Fixture to initialize browser, context, page and clean up after test finishes."""
    # Pastikan direktori screenshots ada untuk menyimpan visual report
    os.makedirs("tests/screenshots", exist_ok=True)
    
    with sync_playwright() as p:
        # Jalankan headed mode agar pengguna dapat melihat simulasi tes secara langsung
        browser = p.chromium.launch(headless=False, slow_mo=400)
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            locale="id-ID"
        )
        page = context.new_page()
        yield page
        browser.close()
