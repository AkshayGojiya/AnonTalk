#!/bin/sh
set -e

echo "Running prisma migrate deploy..."
npx prisma migrate deploy --schema=./prisma/schema.prisma

exec "$@"
