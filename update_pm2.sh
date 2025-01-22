#!/bin/bash

# Stop all PM2 processes
pm2 stop all

# Delete all PM2 processes
pm2 delete all

# Update lastModified timestamp (fixed command)
date -u +"%Y-%m-%dT%H:%M:%S.%3NZ" > lastModified.txt

# Start new PM2 instances with proper paths
pm2 start /var/www/the-isb-api/index.js --name "api-server" 
pm2 start /var/www/the-isb-api/imageServer.js --name "image-server"
pm2 start /var/www/the-isb-api/src/discord/bot.js --name "discord-bot"

# Save the PM2 process list
pm2 save

# Display the status of PM2 processes
pm2 status

# Refresh nginx
sudo systemctl restart nginx
