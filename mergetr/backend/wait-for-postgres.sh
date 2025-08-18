#!/bin/sh
# Attends que PostgreSQL soit prêt

echo "⏳ Waiting for postgres..."

until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER"; do
  sleep 1
done

echo "✅ Postgres is ready - launching backend"
exec "$@"
