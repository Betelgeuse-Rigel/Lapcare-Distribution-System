import os
import time
from playwright.sync_api import sync_playwright

# Setup test images
source_img = "/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/media__1783582202102.jpg"
valid_img = "/Users/nikola/Downloads/BiswasDistribution/Lapcare-Distribution-System/valid_4mb_image.jpg"
overlimit_img = "/Users/nikola/Downloads/BiswasDistribution/Lapcare-Distribution-System/overlimit_test_image.jpg"

if os.path.exists(source_img):
    with open(source_img, "rb") as f:
        raw_data = f.read()
    
    # 4MB valid image
    with open(valid_img, "wb") as f:
        f.write(raw_data + b"\x00" * (4 * 1024 * 1024))
        
    # 22MB overlimit image
    with open(overlimit_img, "wb") as f:
        f.write(raw_data + b"\x00" * (22 * 1024 * 1024))

category_name = f"Limit Test Category {int(time.time())}"

with sync_playwright() as p:
    print("Launching visible browser on your screen...")
    browser = p.chromium.launch(headless=False, slow_mo=2000)
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()
    
    # Auto accept delete dialogs
    page.on("dialog", lambda dialog: dialog.accept())
    
    print("Navigating to https://billing.abpseeds.com/ ...")
    page.goto('https://billing.abpseeds.com/')
    page.wait_for_timeout(2000)
    
    # Log in
    print("Logging in...")
    page.fill('input[type="email"]', 'admin@company.com')
    page.fill('input[type="password"]', 'Admin@123')
    page.click('button[type="submit"]')
    page.wait_for_timeout(3000)
    
    # Navigate to Product categories
    print("Navigating to Product categories...")
    page.click('text="Product categories"', force=True)
    page.wait_for_timeout(2000)
    
    # Open Add Category
    page.click('button:has-text("Add Category")')
    page.wait_for_timeout(1000)
    page.locator('input[type="text"]').first.fill(category_name)
    
    # 1. Test 22MB Overlimit Upload
    print("Selecting 22MB over-limit image (should reflect error toast)...")
    page.set_input_files('input[type="file"]', overlimit_img)
    page.wait_for_timeout(4000) # wait to display toast
    
    # 2. Test 4MB Valid Upload
    print("Selecting 4MB valid image (should upload successfully)...")
    page.set_input_files('input[type="file"]', valid_img)
    page.wait_for_timeout(5000) # wait to upload
    
    print("Saving Category...")
    page.click('button:has-text("Save Category")')
    page.wait_for_timeout(3000)
    
    # Clean up the created category
    print(f"Cleaning up category '{category_name}'...")
    cat_row = page.locator(f'tr:has-text("{category_name}")')
    cat_delete_btn = cat_row.locator('button:has-text("Delete")')
    cat_delete_btn.click()
    page.wait_for_timeout(3000)
    
    print("Tests finished!")
    browser.close()
