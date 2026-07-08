from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    
    print("Navigating...")
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
    
    # Click Add Category
    print("Clicking Add Category...")
    page.click('button:has-text("Add Category")')
    page.wait_for_timeout(2000)
    
    # Take screenshot of the page after clicking
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/categories_page_after_click.png")
    
    # Get all inputs
    inputs = page.locator('input').all()
    print(f"Total inputs on screen: {len(inputs)}")
    for i, inp in enumerate(inputs):
        print(f"Input {i}: type={inp.get_attribute('type')}, placeholder={inp.get_attribute('placeholder')}, name={inp.get_attribute('name')}")
        
    browser.close()
