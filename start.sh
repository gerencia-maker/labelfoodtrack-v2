#!/bin/sh
set -e

echo "Syncing database schema..."
prisma db push --schema=./prisma/schema.prisma

echo "Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
