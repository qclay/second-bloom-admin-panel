#!/bin/bash
set -e

echo "🔄 Rolling back deployment..."

# In this simple setup, rollback means stopping current and trying to start previous if it exists
# But since we use :latest, we can't easily go back without tag management.
# For now, we just ensure the service is down if it's broken, or try to restart it.

docker-compose down
docker-compose up -d

echo "✅ Rollback complete (restarted with current image)"
