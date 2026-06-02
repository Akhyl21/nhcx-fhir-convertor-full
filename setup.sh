#!/bin/bash
echo "========================================"
echo "  NHCX FHIR Convertor - Auto Setup"
echo "========================================"

echo "[1/2] Installing backend..."
cd backend && npm install --legacy-peer-deps
echo "[2/2] Installing frontend..."
cd ../frontend && npm install --legacy-peer-deps
cd ..

echo ""
echo "========================================"
echo "  Done! Now run:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo "  Open: http://localhost:3000"
echo "========================================"
