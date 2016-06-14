# Base this container on Node 6
FROM node:6


# Set where the service will be installed
WORKDIR /opt/service


# Install application dependencies
COPY package.json ./
RUN npm install --prod --verbose


# Place the application code itself
COPY app.js app.js


# Execute the service
CMD [ "npm", "start" ]
