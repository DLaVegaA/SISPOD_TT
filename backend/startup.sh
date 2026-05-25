#!/bin/bash
# Dependencias de sistema para Puppeteer/Chromium en Azure App Service Linux
apt-get update && apt-get install -y \
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
  libasound2 \
  --no-install-recommends

node dist/server.js