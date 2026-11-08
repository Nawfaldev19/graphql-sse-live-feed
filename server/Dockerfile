FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Compile, then drop dev-only packages (TypeScript, tsx, test and lint tools) before copying node_modules on.
RUN npm run build && npm prune --omit=dev

FROM node:20-slim
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 4000
# Runs the compiled JavaScript; data lives in /app/data (mounted as a volume).
CMD ["node", "dist/main.js"]
