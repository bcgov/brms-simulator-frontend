# Install the app dependencies in a full Node docker image
FROM registry.access.redhat.com/ubi9/nodejs-20:latest

# Set the environment variables
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}

# Set the working directory
WORKDIR /opt/app-root/src

# Copy package.json, and optionally package-lock.json if it exists
COPY package.json package-lock.json* ./

# Install app dependencies
RUN npm ci 

# Copy the application code
COPY . ./

# Build the Next.js application
RUN npm run build

# Start the application
CMD ["npm", "start"]