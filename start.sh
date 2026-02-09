#!/bin/sh

echo "Running Prisma migrations..."
prisma migrate deploy --schema=./prisma/schema.prisma 2>&1 || echo "Migration warning (may be first run)"

echo "Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
