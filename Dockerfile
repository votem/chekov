# Base this container on Node 6
FROM node:6-alpine


# Ensure system is fully up-to-date
RUN apk update \
 && rm -rf /var/cache/apk/*


# Create a non-root user for running the service
RUN adduser -S service

# Set where the service will be installed
WORKDIR /opt/service


# Install application dependencies
COPY package.json ./
RUN npm install --prod --verbose


# Place the application code itself
COPY app.js app.js


# Execute the service as a particular user
USER service
CMD [ "npm", "start" ]
