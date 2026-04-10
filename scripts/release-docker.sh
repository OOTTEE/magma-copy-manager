#!/bin/bash

# --- Magma Dockerized Release Wrapper ---
# This script builds the release agent and runs the release process inside it.
# It only requires 'docker' to be installed on the host.

set -e

IMAGE_NAME="magma-release-agent"
DOCKERFILE="infra/Dockerfile.release"

echo "🐳 Building release agent image..."
docker build -t $IMAGE_NAME -f $DOCKERFILE .

echo "🚀 Running release process in container..."
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "$(pwd):/app" \
  $IMAGE_NAME
