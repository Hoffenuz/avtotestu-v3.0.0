#!/usr/bin/env bash
#
# CI quvurini TOZA LINUX muhitida takrorlaydi (GitHub Actions bilan bir xil).
#
# NEGA KERAK:
#   Mahalliy Windows muhiti CI dan farq qiladi va shu sababli xatolar
#   faqat CI da chiqib qolardi. Ikki misol shu loyihada bo'lgan:
#     1. Node 20 <-> jsdom 30 nomuvofiqligi (lokalda Node 24 edi).
#     2. Testlar `.env` ga bog'liq edi — CI da `.env` yo'q.
#   Ikkalasi ham shu skript bilan oldindan tutilardi.
#
# XOST PAPKASI O'ZGARMAYDI:
#   Repo konteynerga FAQAT O'QISHGA (`:ro`) ulanadi va ichkarida nusxaga
#   ko'chiriladi. `npm ci`, `build`, `prebuild` skriptlari faqat konteyner
#   ichida yozadi — sizning ish papkangizga tegmaydi.
#
# `node_modules` KO'CHIRILMAYDI:
#   Windows dagi `node_modules` da Windows uchun kompilyatsiya qilingan
#   ikkilik fayllar bor (esbuild, swc). Ular Linux da ishlamaydi, shuning
#   uchun konteynerda `npm ci` toza o'rnatadi.
#
# Ishlatish:
#   bash scripts/docker-ci.sh          # to'liq quvur
#   bash scripts/docker-ci.sh test     # faqat testlar (tezroq)

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NODE_IMAGE="node:24"          # CI dagi bilan bir xil major versiya
MODE="${1:-all}"

case "$MODE" in
  test) STEPS='npm run test:run' ;;
  all)  STEPS='npm run lint && npm run typecheck && npm run test:run && npm run build' ;;
  *)    echo "Noma'lum rejim: $MODE (kutilgan: all | test)"; exit 2 ;;
esac

echo "=============================================="
echo " Docker CI  |  obraz: $NODE_IMAGE  |  rejim: $MODE"
echo "=============================================="

# MSYS_NO_PATHCONV: Git Bash Windows da yo'llarni avtomatik o'zgartiradi,
# bu esa konteyner ichidagi yo'llarni buzadi.
MSYS_NO_PATHCONV=1 docker run --rm \
  -v "//${REPO_DIR//:/}:/src:ro" \
  -w /app \
  "$NODE_IMAGE" \
  bash -euo pipefail -c "
    echo '--- Muhit ---'
    echo \"Node: \$(node -v)  npm: \$(npm -v)  git: \$(git --version | cut -d' ' -f3)\"
    echo \"OS:   \$(. /etc/os-release && echo \$PRETTY_NAME)\"
    echo

    echo '--- Manba nusxalanmoqda (node_modules va dist tashlab) ---'
    mkdir -p /app
    tar cf - -C /src --exclude=node_modules --exclude=dist --exclude=.wrangler . | tar xf - -C /app
    echo \"Nusxalandi: \$(find /app -type f | wc -l) fayl\"
    echo

    echo '--- .env bormi (CI da BO_LMASLIGI kerak) ---'
    if [ -f /app/.env ]; then
      echo 'DIQQAT: .env nusxalandi — CI sharoitini takrorlash uchun olib tashlanmoqda'
      rm -f /app/.env /app/.env.local /app/.env.production
    else
      echo '.env yo_q — CI bilan bir xil'
    fi
    echo

    echo '--- npm ci ---'
    npm ci --no-audit --no-fund
    echo

    echo '--- CI qadamlari ---'
    export VITE_SUPABASE_URL=https://ci-placeholder.supabase.co
    export VITE_SUPABASE_PUBLISHABLE_KEY=ci-placeholder-anon-key
    $STEPS
  "

echo
echo "=============================================="
echo " ✅ Docker CI muvaffaqiyatli tugadi"
echo "=============================================="
