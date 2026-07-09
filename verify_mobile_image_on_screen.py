import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    print("Launching visible browser on your screen...")
    browser = p.chromium.launch(headless=False, slow_mo=2000)
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()
    
    print("Navigating to Mobile Portal Simulator...")
    page.goto('https://billing.abpseeds.com/?view=mobile')
    page.wait_for_timeout(3000)
    
    # Log in as Retailer A
    print("Logging in to mobile app as Retailer...")
    page.fill('input[placeholder="Enter 10-digit number"]', '9000000001')
    page.fill('input[placeholder="Enter secret password"]', 'password123')
    page.click('button:has-text("Access Portal")')
    page.wait_for_timeout(4000)
    
    # Click the Kimchi Category
    print("Opening category 'Kimchi Category Permanent' in mobile app...")
    page.click('text="Kimchi Category Permanent"', force=True)
    page.wait_for_timeout(3000)
    
    # Click the product to open details
    print("Opening details modal for 'Kimchi Ramen Permanent'...")
    page.click('text="Kimchi Ramen Permanent"', force=True)
    page.wait_for_timeout(3000)
    
    print("SHOWING DETAILS MODAL. Verify the image on the mobile app simulator on your screen now! Keeping open for 15 seconds...")
    time.sleep(15)
    
    print("Test completed.")
    browser.close()
