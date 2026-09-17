#!/bin/sh
set -e

TSX="./node_modules/.bin/tsx"
PORT="${PORT:-43123}"

echo "Ejecutando migraciones…"
"$TSX" --tsconfig tsconfig.json src/server/db/migrate.ts
"$TSX" --tsconfig tsconfig.json scripts/ensure-migration-0014.ts

echo "Limpieza catálogo demo (segundo plano)…"
"$TSX" --tsconfig tsconfig.json scripts/cleanup-catalog-demo.ts &

echo "Iniciando seed en segundo plano…"
"$TSX" --tsconfig tsconfig.json scripts/seed.ts &

echo "Iniciando servidor en puerto ${PORT}…"
exec node server.js
