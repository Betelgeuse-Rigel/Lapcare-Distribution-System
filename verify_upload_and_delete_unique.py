import time
from playwright.sync_api import sync_playwright

unique_suffix = int(time.time())
category_name = f"Upload Delete Test {unique_suffix}"
product_name = f"Playwright Product {unique_suffix}"
sku_code = f"DEL-{unique_suffix % 10000}"

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
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/categories_page_init.png")
    
    # Add Category
    print(f"Adding Category '{category_name}'...")
    page.click('button:has-text("Add Category")')
    page.wait_for_timeout(1000)
    page.locator('input[type="text"]').first.fill(category_name)
    page.set_input_files('input[type="file"]', '/Users/nikola/Downloads/BiswasDistribution/Lapcare-Distribution-System/UI.jpeg')
    page.wait_for_timeout(3000) # wait for upload
    
    print("Saving Category...")
    page.click('button:has-text("Save Category")')
    page.wait_for_timeout(4000)
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/category_upload_saved.png")
    
    # Verify image URL
    print("Verifying image loaded...")
    images = page.locator('table img').all()
    print(f"Total category images rendered: {len(images)}")
    for i, img in enumerate(images):
        src = img.get_attribute("src")
        print(f"Category image {i} src: {src}")
        
    # Go to Product catalog
    print("Navigating to Product catalog...")
    page.click('text="Product catalog"', force=True)
    page.wait_for_timeout(2000)
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/catalog_page_init.png")
    
    # Add Product
    print(f"Adding Product '{product_name}'...")
    page.click('button:has-text("Add Product")')
    page.wait_for_timeout(1000)
    
    page.locator('.form-group:has-text("Product Name") input').fill(product_name)
    page.locator('.form-group:has-text("SKU Code") input').fill(sku_code)
    page.locator('.form-group:has-text("Brand") input').fill('OEM')
    
    # Select category
    page.select_option('.form-group:has-text("Category") select', label=category_name)
    
    page.locator('.form-group:has-text("T1 Price") input').fill('100')
    page.locator('.form-group:has-text("T2 Price") input').fill('100')
    page.locator('.form-group:has-text("T3 Price") input').fill('100')
    
    page.locator('.form-group:has-text("Initial Stock") input').fill('10')
    page.locator('.form-group:has-text("Low Threshold") input').fill('5')
    
    # File input
    page.locator('.form-group:has-text("Product Image") input[type="file"]').set_input_files('/Users/nikola/Downloads/BiswasDistribution/Lapcare-Distribution-System/UI.jpeg')
    page.wait_for_timeout(3000)
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/product_upload_filled.png")
    
    page.click('button:has-text("Save")')
    page.wait_for_timeout(3000)
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/product_upload_saved.png")
    
    # Delete Product
    print(f"Deleting Product '{product_name}'...")
    row = page.locator(f'tr:has-text("{product_name}")')
    delete_btn = row.locator('button:has-text("Delete")')
    delete_btn.click()
    page.wait_for_timeout(3000)
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/product_deleted.png")
    
    # Delete Category to clean up
    print(f"Navigating to Product categories to clean up '{category_name}'...")
    page.click('text="Product categories"', force=True)
    page.wait_for_timeout(2000)
    cat_row = page.locator(f'tr:has-text("{category_name}")')
    cat_delete_btn = cat_row.locator('button:has-text("Delete")')
    cat_delete_btn.click()
    page.wait_for_timeout(3000)
    page.screenshot(path="/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/category_deleted.png")
    
    print("All tasks completed successfully!")
    browser.close()
