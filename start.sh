#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 ou superior é necessário."
  exit 1
fi
echo "RITMO disponível em http://127.0.0.1:8000"
node server/server.mjs
