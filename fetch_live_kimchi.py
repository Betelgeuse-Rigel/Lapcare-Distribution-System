import requests

login_url = "https://billing.abpseeds.com/api/admin/auth/login"
products_url = "https://billing.abpseeds.com/api/admin/products"

# Log in
print("Logging in...")
login_res = requests.post(login_url, json={"email": "admin@company.com", "password": "Admin@123"})
token = login_res.json().get("token")

if token:
    headers = {"Authorization": f"Bearer {token}"}
    print("Fetching live products...")
    res = requests.get(products_url, headers=headers)
    if res.status_code == 200:
        products = res.json()
        kimchi = next((p for p in products if p.get("name").lower() == "kimchi"), None)
        if kimchi:
            print("FOUND KIMCHI PRODUCT:")
            print(f"ID: {kimchi.get('id')}")
            print(f"SKU: {kimchi.get('sku')}")
            print(f"Images field: {kimchi.get('images')}")
            print(f"IsActive: {kimchi.get('isActive')}")
        else:
            print("Product 'kimchi' not found in live products database.")
            print("Available products:", [p.get("name") for p in products])
    else:
        print(f"Failed to fetch products: {res.status_code} {res.text}")
else:
    print("Failed to authenticate.")
