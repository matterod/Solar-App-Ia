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
ANTHROPIC_KEY=$(grep ANTHROPIC_API_KEY .env | cut -d '=' -f2-)
gcloud run services update "$SERVICE" \
  --region="$REGION" \
  --project="$PROJECT" \
  --image="$IMAGE" \
  --set-env-vars "ANTHROPIC_API_KEY=$ANTHROPIC_KEY"

echo "==> Done."
