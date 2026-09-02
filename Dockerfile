FROM node:22-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` ejecuta postinstall, que genera el cliente a partir de este esquema.
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci

# --- Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars must be available at build time (Next.js inlines them)
# Firebase public config (not secrets — safe to hardcode)
ARG NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyD4C84SU11hVqXi0_Xtpt9eldsRYX7Ydo8"
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="labelfoodtrack.firebaseapp.com"
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID="labelfoodtrack"
ARG NEXT_PUBLIC_DEMO_MODE="false"
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_DEMO_MODE=$NEXT_PUBLIC_DEMO_MODE

# Prisma generate + Next.js build
RUN npx prisma generate
RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma client runtime
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Entrypoint script
COPY --chown=nextjs:nodejs start.sh ./start.sh
RUN chmod +x ./start.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["./start.sh"]
