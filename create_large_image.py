import os

source_path = "/Users/nikola/.gemini/antigravity-ide/brain/a519c41d-be42-49d3-b829-a45d40d5c7fe/media__1783582202102.jpg"
target_path = "/Users/nikola/Downloads/BiswasDistribution/Lapcare-Distribution-System/large_test_image.jpg"

if os.path.exists(source_path):
    with open(source_path, "rb") as f:
        data = f.read()
    
    # Pad the file with 4MB of trailing zero bytes
    large_data = data + b"\x00" * (4 * 1024 * 1024)
    
    with open(target_path, "wb") as f:
        f.write(large_data)
        
    print(f"Large image created successfully at {target_path}!")
    print(f"File size: {os.path.getsize(target_path) / (1024 * 1024):.2f} MB")
else:
    print(f"Source file {source_path} not found.")
