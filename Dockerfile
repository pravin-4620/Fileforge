FROM node:22-bookworm-slim

ENV NODE_ENV=production \
    PORT=5001 \
    PYTHONUNBUFFERED=1

ENV PATH="/app/backend/.venv/bin:${PATH}"

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    ffmpeg \
    fonts-dejavu \
    imagemagick \
    libreoffice \
    p7zip-full \
    python3 \
    python3-pip \
    python3-venv \
    unoconv \
  && rm -rf /var/lib/apt/lists/* \
  && if ! command -v magick >/dev/null 2>&1; then ln -s /usr/bin/convert /usr/local/bin/magick; fi

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY client/package.json client/package.json
RUN npm ci --omit=dev --workspace backend --include-workspace-root=false

COPY backend ./backend
RUN python3 -m venv /app/backend/.venv \
  && /app/backend/.venv/bin/pip install --no-cache-dir -r /app/backend/requirements.txt

WORKDIR /app/backend
CMD ["node", "src/server.js"]
