import requests

login_url = "https://billing.abpseeds.com/api/auth/login"
upload_url = "https://billing.abpseeds.com/api/admin/upload"

# Log in
print("Logging in...")
login_res = requests.post(login_url, json={"email": "admin@company.com", "password": "Admin@123"})
print(f"Login Status: {login_res.status_code}")
token = login_res.json().get("token")
print(f"Token acquired: {token is not None}")

# Upload
if token:
    headers = {"Authorization": f"Bearer {token}"}
    files = {"image": ("UI.jpeg", open("/Users/nikola/Downloads/BiswasDistribution/Lapcare-Distribution-System/UI.jpeg", "rb"), "image/jpeg")}
    print("Uploading image...")
    upload_res = requests.post(upload_url, headers=headers, files=files)
    print(f"Upload Status Code: {upload_res.status_code}")
    print(f"Upload Response: {upload_res.text}")
    
    url = upload_res.json().get("url") if upload_res.status_code == 200 else None
    if url:
        print(f"Verifying uploaded file link: {url}")
        verify_res = requests.get(url)
        print(f"File GET Status Code: {verify_res.status_code}")
