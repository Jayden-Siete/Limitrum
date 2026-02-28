#!/usr/bin/env bash
set -euo pipefail

# Google Cloud project where the service will be deployed.
PROJECT_ID="${PROJECT_ID:-your-gcp-project-id}"
# Cloud Run service name.
SERVICE_NAME="${SERVICE_NAME:-limitrum-api}"
# GCP region for build + deploy.
REGION="${REGION:-us-central1}"
# Container image destination in Artifact Registry.
IMAGE_URI="${IMAGE_URI:-${REGION}-docker.pkg.dev/${PROJECT_ID}/limitrum/${SERVICE_NAME}:latest}"

# Runtime configuration passed to Cloud Run.
DATABASE_URL="${DATABASE_URL:-}"
DATABASE_AUTH_TOKEN="${DATABASE_AUTH_TOKEN:-}"
LIMITRUM_API_URL="${LIMITRUM_API_URL:-}"

echo "Deploying ${SERVICE_NAME} to project ${PROJECT_ID} in ${REGION}"

# Use the target project for all subsequent gcloud commands.
gcloud config set project "${PROJECT_ID}"

# Build the container image from the root Dockerfile using Cloud Build.
gcloud builds submit --tag "${IMAGE_URI}" .

# Deploy image to Cloud Run with environment variables required by the API/DB layer.
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_URI}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "DATABASE_URL=${DATABASE_URL},DATABASE_AUTH_TOKEN=${DATABASE_AUTH_TOKEN},LIMITRUM_API_URL=${LIMITRUM_API_URL}"

# Print the deployed service URL.
gcloud run services describe "${SERVICE_NAME}" \
  --region "${REGION}" \
  --format="value(status.url)"
