# ---------- Build Stage ----------
FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools only when needed
RUN apk add --no-cache python3 make g++

# Copy only package files first (better caching)
COPY package*.json ./

# Install deps (including dev for tsc build)
RUN npm ci

# Copy the rest of the source
COPY . .

# Build TypeScript
RUN npm run build


# ---------- Production Stage ----------
FROM node:22-alpine AS production

WORKDIR /app

# Copy only the built output & necessary files
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Install ONLY production dependencies
RUN npm ci --omit=dev

# Run as non-root user (security best practice)
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3000

CMD ["node", "dist/src/index.js"]
