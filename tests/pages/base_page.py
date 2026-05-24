class BasePage:
    """Base Class representing common elements and behaviors across pages."""
    
    def __init__(self, page):
        self.page = page

    def wait_for_selector(self, selector, timeout=10000):
        self.page.wait_for_selector(selector, timeout=timeout)

    def is_visible(self, selector):
        return self.page.locator(selector).is_visible()

    def get_text(self, selector):
        return self.page.locator(selector).inner_text()
