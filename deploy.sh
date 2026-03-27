#!/bin/bash
set -e

IMAGE="southamerica-east1-docker.pkg.dev/project-2c115a8a-65f0-4214-8e9/solar-erp/backend:latest"
PROJECT="project-2c115a8a-65f0-4214-8e9"
REGION="southamerica-east1"
SERVICE="solar-erp-backend"

echo "==> Building image..."
docker build --platform linux/amd64 -t "$IMAGE" -f docker/backend.Dockerfile ./backend

echo "==> Pushing image..."
docker push "$IMAGE"

echo "==> Updating Cloud Run..."

# Write env vars to a temp YAML file — avoids escaping issues with special chars (e.g. CORS_ORIGINS has brackets/quotes)
ENV_FILE=$(mktemp /tmp/solar-erp-env-XXXXXX.yaml)
trap "rm -f $ENV_FILE" EXIT

CORS_ORIGINS_VAL=$(grep ^CORS_ORIGINS .env | cut -d '=' -f2-)

cat > "$ENV_FILE" <<EOF
ANTHROPIC_API_KEY: $(grep ^ANTHROPIC_API_KEY .env | cut -d '=' -f2-)
TELEGRAM_BOT_TOKEN: $(grep ^TELEGRAM_BOT_TOKEN .env | cut -d '=' -f2-)
TELEGRAM_WEBHOOK_SECRET: $(grep ^TELEGRAM_WEBHOOK_SECRET .env | cut -d '=' -f2-)
DATABASE_URL: $(grep ^DATABASE_URL .env | cut -d '=' -f2-)
SECRET_KEY: $(grep ^SECRET_KEY .env | cut -d '=' -f2-)
CORS_ORIGINS: '$CORS_ORIGINS_VAL'
INTERNAL_API_SECRET: $(grep ^INTERNAL_API_SECRET .env | cut -d '=' -f2-)
EOF

gcloud run services update "$SERVICE" \
  --region="$REGION" \
  --project="$PROJECT" \
  --image="$IMAGE" \
  --env-vars-file="$ENV_FILE"

echo "==> Done."
