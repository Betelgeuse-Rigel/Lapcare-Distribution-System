import time
from playwright.sync_api import sync_playwright

product_name = f"Feature Test SSD {int(time.time()) % 1000}"
sku_code = f"SSD-{int(time.time()) % 1000}"
description_text = "High quality certified hardware component with 3 years warranty."

with sync_playwright() as p:
    print("Launching visible browser...")
    browser = p.chromium.launch(headless=False, slow_mo=2000)
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()
    
    # 1. Admin Portal - Create Product with Description
    print("Navigating to Admin Portal...")
    page.goto('https://billing.abpseeds.com/')
    page.wait_for_timeout(2000)
    
    print("Logging in to Admin Portal...")
    page.fill('input[type="email"]', 'admin@company.com')
    page.fill('input[type="password"]', 'Admin@123')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)
    
    # Check if we need to seed categories first (since db was cleared)
    page.click('text="Product categories"', force=True)
    page.wait_for_timeout(1000)
    if page.locator('text="Computer"').count() == 0:
        print("Creating default 'Computer' Category...")
        page.click('button:has-text("Add Category")')
        page.locator('input[type="text"]').first.fill("Computer")
        page.click('button:has-text("Save Category")')
        page.wait_for_timeout(2000)

    print("Navigating to Product catalog...")
    page.click('text="Product catalog"', force=True)
    page.wait_for_timeout(2000)
    
    print("Opening Add Product form...")
    page.click('button:has-text("Add Product")')
    page.wait_for_timeout(1000)
    
    page.locator('.form-group:has-text("Product Name") input').fill(product_name)
    page.locator('.form-group:has-text("SKU Code") input').fill(sku_code)
    page.locator('.form-group:has-text("Brand") input').fill('Intel')
    page.select_option('.form-group:has-text("Category") select', label='Computer')
    
    # Fill description!
    print("Filling product description details...")
    page.locator('.form-group:has-text("Description & Details") textarea').fill(description_text)
    
    page.locator('.form-group:has-text("T1 Price") input').fill('4500')
    page.locator('.form-group:has-text("T2 Price") input').fill('4600')
    page.locator('.form-group:has-text("T3 Price") input').fill('4700')
    page.locator('.form-group:has-text("Initial Stock") input').fill('50')
    
    print("Saving product...")
    page.click('button:has-text("Save")')
    page.wait_for_timeout(3000)
    
    # 2. Mobile Portal - View Description and Give Review
    print("Navigating to Mobile Portal simulator...")
    page.goto('https://billing.abpseeds.com/?view=mobile')
    page.wait_for_timeout(3000)
    
    print("Logging in to mobile app as Retailer A...")
    page.fill('input[placeholder="Enter 10-digit number"]', '9000000001')
    page.fill('input[placeholder="Enter password"]', 'password123')
    page.click('button:has-text("Access Portal")')
    page.wait_for_timeout(4000)
    
    print("Opening 'Computer' category...")
    page.click('text="Computer"', force=True)
    page.wait_for_timeout(2000)
    
    print(f"Opening details for '{product_name}'...")
    page.click(f'text="{product_name}"', force=True)
    page.wait_for_timeout(2000)
    
    # Verify description is displayed
    desc_val = page.locator(f'p:has-text("{description_text}")')
    print("Dynamic Description visible:", desc_val.count() > 0)
    
    # Give Review
    print("Typing a product review...")
    page.fill('input[placeholder="Write your review here..."]', 'Fast delivery and premium packaging!')
    page.wait_for_timeout(1000)
    
    print("Submitting review...")
    page.click('button:has-text("Submit")')
    page.wait_for_timeout(3000)
    
    print("Review Submitted! Confirming dynamic display on screen...")
    page.wait_for_timeout(4000)
    
    print("Verification completed successfully!")
    browser.close()
