import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()
    
    print("Navigating to https://billing.abpseeds.com/ ...")
    page.goto('https://billing.abpseeds.com/')
    page.wait_for_timeout(3000)
    
    # Log in
    print("Logging in...")
    page.fill('input[type="email"]', 'admin@company.com')
    page.fill('input[type="password"]', 'Admin@123')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)
    
    # Go to Product catalog
    print("Navigating to Product catalog...")
    page.click('text="Product catalog"', force=True)
    page.wait_for_timeout(2000)
    
    # Click the Kimchi product row to open the details modal
    print("Opening details modal for 'Kimchi Ramen Permanent'...")
    page.click('text="Kimchi Ramen Permanent"', force=True)
    page.wait_for_timeout(3000)
    
    # Take screenshot of the modal
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/live_kimchi_details.png")
    print("Screenshot captured to live_kimchi_details.png")
    browser.close()
