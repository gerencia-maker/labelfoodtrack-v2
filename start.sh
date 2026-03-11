#!/bin/sh

echo "Syncing database schema..."
prisma db push --schema=./prisma/schema.prisma --accept-data-loss 2>&1 || echo "Schema sync warning (check logs above)"

echo "Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
