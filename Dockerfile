# Use the official Node.js image.
# https://hub.docker.com/_/node
FROM node:22-alpine

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
RUN npm ci

# Copy local code to the container image.
COPY . .

# Build the Vite React app for production
RUN npm run build

# Set Node environment to production
ENV NODE_ENV=production

# Run the web service on container startup.
CMD [ "npm", "start" ]
