import asyncio
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    
    # Register console handler
    page.on("console", lambda msg: print(f"CONSOLE: {msg.type}: {msg.text}"))
    
    # Register response handler to see failing requests
    page.on("response", lambda response: print(f"NETWORK: {response.status} {response.url}") if not response.ok else None)
    
    print("Navigating to https://billing.abpseeds.com/ ...")
    try:
        page.goto('https://billing.abpseeds.com/', timeout=10000)
        page.wait_for_timeout(3000)
    except Exception as e:
        print(f"Navigation error: {e}")
        
    browser.close()
