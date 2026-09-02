#!/bin/sh
set -e

echo "Syncing database schema..."
# The client is generated during the image build. Regenerating it here would
# try to write into root-owned node_modules while the container runs as nextjs.
./node_modules/.bin/prisma db push --schema=./prisma/schema.prisma --skip-generate

echo "Starting Next.js server on port ${PORT:-3000}..."
exec node server.js
