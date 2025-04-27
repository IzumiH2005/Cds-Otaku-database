#!/bin/bash
export VITE_DEV_SERVER_HOST=0.0.0.0
export VITE_DEV_SERVER_PORT=5173

echo "Starting development server..."
npm run dev -- --host 0.0.0.0 --port 5173