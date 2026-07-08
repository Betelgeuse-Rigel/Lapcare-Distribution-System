import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()
    
    # Listen to console and network
    page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
    page.on("request", lambda req: print(f"REQ: {req.method} {req.url}") if "api" in req.url else None)
    page.on("response", lambda res: print(f"RES: {res.status} {res.url}") if "api" in res.url else None)
    
    # Handle dialogs
    def handle_dialog(dialog):
        print(f"Dialog: {dialog.message}")
        dialog.accept()
        
    page.on("dialog", handle_dialog)
    
    print("Navigating...")
    page.goto('https://billing.abpseeds.com/')
    page.wait_for_timeout(3000)
    
    # Log in
    print("Logging in...")
    page.fill('input[type="email"]', 'admin@company.com')
    page.fill('input[type="password"]', 'Admin@123')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)
    
    # Click Product categories
    print("Navigating to Product categories...")
    page.click('text="Product categories"', force=True)
    page.wait_for_timeout(2000)
    
    # Add Category
    print("Adding Category 'Upload Delete Test'...")
    page.click('button:has-text("Add Category")')
    page.wait_for_timeout(1000)
    page.locator('input[type="text"]').first.fill('Upload Delete Test')
    page.set_input_files('input[type="file"]', '/Users/nikola/Downloads/BiswasDistribution/Lapcare-Distribution-System/UI.jpeg')
    page.wait_for_timeout(3000) # wait for upload
    
    print("Saving Category...")
    page.click('button:has-text("Save Category")')
    page.wait_for_timeout(4000)
    
    browser.close()
