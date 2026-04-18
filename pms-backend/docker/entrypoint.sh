#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "Starting deployment setup..."

# Ensure we are in the right directory
cd /var/www

# Warm up cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations
echo "Running migrations..."
php artisan migrate --force

# Check if we should seed (optional, check a flag or just skip)
# php artisan db:seed --force

echo "Starting PHP server..."
# Start server using the provided PORT or default to 8000
php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
