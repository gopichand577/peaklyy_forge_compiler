# Peaklyy Forge Compiler Backend Container
FROM node:20-bookworm-slim

# Install system compiler runtimes: Python, Java OpenJDK, C/C++ GCC/G++, Go, Rust, PHP
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    default-jdk-headless \
    golang-go \
    rustc \
    php-cli \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy server application
COPY server ./server

# Install server production dependencies
# Skip postinstall script (--ignore-scripts) since OpenJDK is pre-installed via apt
WORKDIR /app/server
RUN npm ci --omit=dev --ignore-scripts || npm install --omit=dev --ignore-scripts

ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "index.js"]
