# Configuration settings for automated UI testing Urus Diri Sendiri

BASE_URL = "http://localhost:8080"

# Default timeouts in milliseconds
DEFAULT_TIMEOUT = 10000

# Dummy user credentials for testing form inputs
DUMMY_USER = {
    "email": "playwright.test@urusdiri.app",
    "password": "SuperSecretPassword123!"
}

# Invalid user credentials for testing validation / error message feedback
INVALID_USER = {
    "email": "salah-email.com",
    "password": "123"
}
