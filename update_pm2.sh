#!/bin/bash

# Stop all PM2 processes
pm2 stop all

# Delete all PM2 processes
pm2 delete all

echo $(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ") > lastModified.txt

# Start new PM2 instances
pm2 start index.js --name "api-server" 
pm2 start imageServer.js --name "image-server"

# Save the PM2 process list
pm2 save

# Display the status of PM2 processes
pm2 status

# Refresh nginx
sudo systemctl restart nginx