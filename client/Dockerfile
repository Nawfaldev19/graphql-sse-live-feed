FROM node:20-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .

EXPOSE 5176
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5176"]
