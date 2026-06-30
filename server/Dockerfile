# Alternative to render.yaml — build the auth server as a container.
# Build context is the repository root: `docker build -f server/Dockerfile .`
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./
EXPOSE 8787
CMD ["node", "index.js"]
