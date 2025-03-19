# BUILDER IMAGE
FROM node:current-bookworm-slim AS builder
WORKDIR /app

# Copy project code to container
COPY . . 

# Get latest repositories and install Python
RUN apt-get update -y && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-venv && \
    apt-get clean

# Create Python virtual environment
RUN python3 -m venv FastAPI/venv && \
    . FastAPI/venv/bin/activate && \
    pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir -r FastAPI/requirements_dockerfile.txt

# Install npm packages
RUN npm ci --only=production --omit=dev && \
    npm cache clean --force

# RUNTIME IMAGE
FROM node:current-bookworm-slim AS runtime
WORKDIR /app

# Copy code and installed dependencies (node_modules, venv, docker_start.sh) to runtime container
COPY --from=builder /app/FastAPI/app.py /app/FastAPI/
COPY --from=builder /app/FastAPI/venv /app/FastAPI/venv
COPY --from=builder /app/lib /app/lib
COPY --from=builder /app/models /app/models
COPY --from=builder /app/package.json /app/package-lock.json /app/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/src /app/src
COPY --from=builder /app/jsconfig.json /app/
COPY --from=builder /app/.env /app/
COPY --from=builder /app/docker_start.sh /app/

# Remove windows ^M character, add execute permissions
RUN sed -i 's/\r$//' ./docker_start.sh && \
    chmod 750 ./docker_start.sh

# Install MongoDB
RUN apt-get update -y && \
    apt-get install -y gnupg curl && \
    curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor && \
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list && \
    apt-get update -y && \
    apt-get install -y --no-install-recommends mongodb-org-server mongodb-mongosh && \
    apt-get clean

# Install Other Packages
RUN apt-get install -y --no-install-recommends python3 python3-pip python3-venv && \
    apt-get clean

# Cleanup
# RUN rm -rf /tmp/*; \
#     rm -rf /var/tmp/*; \
#     rm -rf /root/.cache

VOLUME /app/FastAPI/models
VOLUME /app/MongoDB/data

# Forward ports 3000 27017
EXPOSE 3000 27017 8000

# Run startup script
CMD ["./docker_start.sh"]
