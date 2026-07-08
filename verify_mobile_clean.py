from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 400, "height": 800})
    
    print("Navigating to https://billing.abpseeds.com/?view=mobile ...")
    page.goto('https://billing.abpseeds.com/?view=mobile')
    page.wait_for_timeout(3000)
    
    has_mobile_portal = page.locator('text="B2B DISTRIBUTOR ORDERING PLATFORM"').count() > 0
    print(f"Has Mobile Portal Title: {has_mobile_portal}")
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/live_clean_mobile_load.png")
    
    if has_mobile_portal:
        page.fill('input[placeholder="Enter 10-digit number"]', '9000000001')
        page.fill('input[placeholder="Enter secret password"]', 'password123')
        page.locator('button:has-text("Access Portal")').click()
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle')
        page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/live_clean_mobile_logged_in.png")
        print("Successfully logged in to mobile.")
        
        # Click Computer
        page.locator('text="Computer"').first.click()
        page.wait_for_timeout(2000)
        page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/live_clean_mobile_catalog.png")
        print("Opened mobile catalog.")
        
    browser.close()
