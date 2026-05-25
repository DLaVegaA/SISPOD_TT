#!/bin/bash
set -e

cd /home/site/wwwroot

# ── Dependencias de sistema para Chromium ──────────────────────────
apt-get update -qq && apt-get install -y --no-install-recommends \
  libgbm-dev \
  libnss3 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2t64 \
  && rm -rf /var/lib/apt/lists/*

# ── Instalar dependencias Node si no están ─────────────────────────
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install --omit=dev
fi

# ── Arrancar servidor ──────────────────────────────────────────────
echo "Iniciando SISPOD backend..."
node dist/server.js