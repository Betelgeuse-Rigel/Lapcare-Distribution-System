#!/bin/bash
if [ -z "$1" ]; then
  echo "Error: Please provide the path to your AWS PEM key file."
  echo "Usage: ./deploy.sh /path/to/your-aws-key.pem"
  exit 1
fi

KEY_PATH=$1
SERVER_IP="3.7.123.18"

echo "=== Step 1: Building frontend locally ==="
cd frontend
npm run build
cd ..

if [ ! -d "frontend/dist" ]; then
  echo "Error: Build folder frontend/dist does not exist. Build failed."
  exit 1
fi

echo "=== Step 2: Creating tar archive ==="
tar -czf dist.tar.gz -C frontend/dist .

echo "=== Step 3: Uploading archive to AWS server ==="
scp -i "$KEY_PATH" dist.tar.gz ubuntu@$SERVER_IP:~/

echo "=== Step 4: Extracting directly inside live Nginx container ==="
ssh -i "$KEY_PATH" ubuntu@$SERVER_IP "docker cp ~/dist.tar.gz b2b_distributor_frontend:/usr/share/nginx/html/ && docker exec b2b_distributor_frontend sh -c 'cd /usr/share/nginx/html && tar -xzf dist.tar.gz && rm dist.tar.gz' && rm -f ~/dist.tar.gz"

echo "=== Step 5: Cleaning up local files ==="
rm -f dist.tar.gz

echo "=== Deployment Successful ==="
echo "Please reload https://billing.abpseeds.com in your browser."
