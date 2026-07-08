import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    
    # Track requests
    def handle_request(request):
        if "upload" in request.url:
            print(f"Upload Request URL: {request.url}")
            print(f"Headers: {request.headers}")
            
    def handle_response(response):
        if "upload" in response.url:
            print(f"Upload Response Status: {response.status}")
            try:
                print(f"Response Body: {response.text()}")
            except Exception as e:
                print(f"Could not read body: {e}")

    page.on("request", handle_request)
    page.on("response", handle_response)
    
    print("Navigating to https://billing.abpseeds.com/ ...")
    page.goto('https://billing.abpseeds.com/')
    page.wait_for_timeout(3000)
    
    # Log in
    page.fill('input[type="email"]', 'admin@company.com')
    page.fill('input[type="password"]', 'Admin@123')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)
    
    # Click Product categories
    page.click('text="Product categories"')
    page.wait_for_timeout(2000)
    
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/categories_page.png")
    
    # Click Add Category button
    page.click('text="Add Category"')
    page.wait_for_timeout(1000)
    
    # Fill input
    page.fill('input[placeholder="Category Name"]', 'Test Category Playwright')
    
    # Upload file
    file_input = page.locator('input[type="file"]')
    file_input.set_input_files("/Users/nikola/Downloads/BiswasDistribution/Lapcare-Distribution-System/UI.jpeg")
    page.wait_for_timeout(2000)
    
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/categories_upload_modal.png")
    
    # Click Save Category
    page.click('button:has-text("Save Category")')
    page.wait_for_timeout(4000)
    
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/categories_upload_finished.png")
    
    browser.close()
