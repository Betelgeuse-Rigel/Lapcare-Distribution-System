from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    
    print("Navigating to https://billing.abpseeds.com/ ...")
    page.goto('https://billing.abpseeds.com/')
    page.wait_for_timeout(3000)
    
    # Check if we see the login form
    has_admin_portal = page.locator('text="ADMIN PORTAL"').count() > 0
    print(f"Has Admin Portal Title: {has_admin_portal}")
    
    # Take screenshot
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/live_clean_desktop_load.png")
    
    # Log in
    if has_admin_portal:
        page.fill('input[type="email"]', 'admin@company.com')
        page.fill('input[type="password"]', 'Admin@123')
        page.click('button[type="submit"]')
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
        page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/live_clean_desktop_logged_in.png")
        print("Successfully logged in.")
        
    browser.close()
