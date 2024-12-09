# Use Node.js LTS
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Create a startup script that matches your update_pm2.sh functionality
RUN echo '#!/bin/sh\n\
echo $(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ") > lastModified.txt\n\
node index.js & \n\
node src/discord/bot.js & \n\
wait' > docker-start.sh

RUN chmod +x docker-start.sh

# Start the services
CMD ["/docker-start.sh"]