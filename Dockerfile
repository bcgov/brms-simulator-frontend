# Install the app dependencies in a full Node docker image
FROM registry.access.redhat.com/ubi8/nodejs-18:latest

# Set the environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_GO_RULES_PROJECT_ID
ENV NEXT_PUBLIC_GO_RULES_PROJECT_ID=${NEXT_PUBLIC_GO_RULES_PROJECT_ID}
ARG NEXT_PUBLIC_GO_RULES_BEARER_PAT
ENV NEXT_PUBLIC_GO_RULES_BEARER_PAT=${NEXT_PUBLIC_GO_RULES_BEARER_PAT}
ARG NEXT_PUBLIC_GO_RULES_ACCESS_TOKEN
ENV NEXT_PUBLIC_GO_RULES_ACCESS_TOKEN=${NEXT_PUBLIC_GO_RULES_ACCESS_TOKEN}

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