import time
from playwright.sync_api import sync_playwright

category_name = "Kimchi Category"
product_name = "Kimchi Ramen"
sku_code = "KIMCHI-101"

with sync_playwright() as p:
    print("Launching visible browser on your screen...")
    browser = p.chromium.launch(headless=False, slow_mo=2000)
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()
    
    # Handle dialog confirmations automatically
    def handle_dialog(dialog):
        print(f"DIALOG CONFIRMATION: {dialog.message}")
        time.sleep(1) # delay so user can see dialog
        dialog.accept()
        print("Accepted dialog.")
        
    page.on("dialog", handle_dialog)
    
    print("Navigating to https://billing.abpseeds.com/ ...")
    page.goto('https://billing.abpseeds.com/')
    page.wait_for_timeout(2000)
    
    # Log in
    print("Entering Admin Credentials...")
    page.fill('input[type="email"]', 'admin@company.com')
    page.fill('input[type="password"]', 'Admin@123')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)
    
    # Navigate to Product categories
    print("Navigating to Product categories...")
    page.click('text="Product categories"', force=True)
    page.wait_for_timeout(2000)
    
    # Add Category
    print(f"Creating Category: '{category_name}'...")
    page.click('button:has-text("Add Category")')
    page.wait_for_timeout(1000)
    page.locator('input[type="text"]').first.fill(category_name)
    page.set_input_files('input[type="file"]', '/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/media__1783512991562.jpg')
    page.wait_for_timeout(4000) # wait for upload
    
    print("Saving Category...")
    page.click('button:has-text("Save Category")')
    page.wait_for_timeout(3000)
    
    # Navigate to Product catalog
    print("Navigating to Product catalog...")
    page.click('text="Product catalog"', force=True)
    page.wait_for_timeout(2000)
    
    # Add Product
    print(f"Creating Product: '{product_name}'...")
    page.click('button:has-text("Add Product")')
    page.wait_for_timeout(1000)
    
    page.locator('.form-group:has-text("Product Name") input').fill(product_name)
    page.locator('.form-group:has-text("SKU Code") input').fill(sku_code)
    page.locator('.form-group:has-text("Brand") input').fill('kimchi')
    
    # Select category
    page.select_option('.form-group:has-text("Category") select', label=category_name)
    
    page.locator('.form-group:has-text("T1 Price") input').fill('200')
    page.locator('.form-group:has-text("T2 Price") input').fill('220')
    page.locator('.form-group:has-text("T3 Price") input').fill('220')
    
    page.locator('.form-group:has-text("Initial Stock") input').fill('20')
    page.locator('.form-group:has-text("Low Threshold") input').fill('5')
    
    # Upload Product image
    page.locator('.form-group:has-text("Product Image") input[type="file"]').set_input_files('/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/media__1783512991562.jpg')
    page.wait_for_timeout(4000)
    
    print("Saving Product...")
    page.click('button:has-text("Save")')
    page.wait_for_timeout(3000)
    
    # Click on the product name in the row to open the details modal
    print(f"Opening details modal for '{product_name}'...")
    page.click(f'td:has-text("{product_name}")')
    page.wait_for_timeout(3000)
    
    print("SHOWING DETAILS MODAL. Verify the image on your screen now! Keeping open for 15 seconds...")
    time.sleep(15)
    
    # Close details modal
    page.click('button:has-text("✕")')
    page.wait_for_timeout(1500)
    
    # Delete the Product
    print(f"Deleting the product: '{product_name}'...")
    row = page.locator(f'tr:has-text("{product_name}")')
    delete_btn = row.locator('button:has-text("Delete")')
    delete_btn.click()
    page.wait_for_timeout(3000)
    
    # Delete Category to clean up
    print(f"Navigating to Product categories to delete: '{category_name}'...")
    page.click('text="Product categories"', force=True)
    page.wait_for_timeout(2000)
    cat_row = page.locator(f'tr:has-text("{category_name}")')
    cat_delete_btn = cat_row.locator('button:has-text("Delete")')
    cat_delete_btn.click()
    page.wait_for_timeout(3000)
    
    print("All tasks completed successfully!")
    browser.close()
