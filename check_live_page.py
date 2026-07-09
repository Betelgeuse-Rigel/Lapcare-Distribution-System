import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    print("Launching headed browser...")
    browser = p.chromium.launch(headless=False)
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()
    
    print("Navigating to https://billing.abpseeds.com/ ...")
    page.goto('https://billing.abpseeds.com/')
    page.wait_for_timeout(2000)
    
    # Log in
    print("Logging in...")
    page.fill('input[type="email"]', 'admin@company.com')
    page.fill('input[type="password"]', 'Admin@123')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)
    
    # Take screenshot of Dashboard
    print("Saving dashboard screenshot...")
    page.screenshot(path='/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/live_admin_dashboard.png')
    
    # Go to Product catalog
    print("Navigating to Product catalog...")
    page.click('text="Product catalog"', force=True)
    page.wait_for_timeout(2000)
    
    # Take screenshot of Catalog
    print("Saving catalog screenshot...")
    page.screenshot(path='/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/live_admin_catalog.png')
    
    # Go to Product categories
    print("Navigating to Product categories...")
    page.click('text="Product categories"', force=True)
    page.wait_for_timeout(2000)
    
    # Take screenshot of Categories
    print("Saving categories screenshot...")
    page.screenshot(path='/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/live_admin_categories.png')
    
    print("Done!")
    browser.close()
