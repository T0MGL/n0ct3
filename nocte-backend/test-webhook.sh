#!/bin/bash

# Test n8n Webhook Integration
# Este script prueba el envío de datos al webhook de n8n

echo "🧪 Testing n8n Webhook Integration"
echo "=================================="
echo ""

# Test 1: Health Check
echo "1️⃣ Testing backend health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
  echo "✅ Backend is running"
else
  echo "❌ Backend is not responding"
  echo "   Make sure to start the backend: cd nocte-backend && npm run dev"
  exit 1
fi
echo ""

# Test 2: Geocode API (without API key - fallback)
echo "2️⃣ Testing geocode API (fallback mode)..."
GEOCODE_RESPONSE=$(curl -s -X POST http://localhost:3000/api/geocode \
  -H "Content-Type: application/json" \
  -d '{
    "city": "Asunción",
    "address": "Av. Mariscal López 1234"
  }')

if [[ $GEOCODE_RESPONSE == *"googleMapsLink"* ]]; then
  echo "✅ Geocode API working"
  echo "   Response: $GEOCODE_RESPONSE"
else
  echo "❌ Geocode API failed"
  echo "   Response: $GEOCODE_RESPONSE"
fi
echo ""

# Test 3: Send Order to n8n
echo "3️⃣ Testing send order to n8n..."
ORDER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/send-order \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Usuario",
    "phone": "+595 971 123456",
    "location": "Asunción",
    "address": "Av. Test 123, barrio Test",
    "googleMapsLink": "https://www.google.com/maps?q=-25.2968294,-57.6311821",
    "quantity": 2,
    "total": 420000,
    "orderNumber": "#NOCTE-TEST-001",
    "paymentIntentId": "pi_test_123456"
  }')

if [[ $ORDER_RESPONSE == *"success"* ]]; then
  echo "✅ Order sent to n8n successfully"
  echo "   Response: $ORDER_RESPONSE"
else
  echo "❌ Failed to send order to n8n"
  echo "   Response: $ORDER_RESPONSE"
  echo ""
  echo "⚠️  Check:"
  echo "   - Is N8N_WEBHOOK_URL configured in nocte-backend/.env?"
  echo "   - Is n8n webhook active and listening?"
fi
echo ""

echo "=================================="
echo "🎯 Test Complete!"
echo ""
echo "Next steps:"
echo "1. Check n8n to see if it received the test order"
echo "2. If successful, test the full flow from frontend"
echo "3. Add your Google Maps API key to nocte-backend/.env for better geocoding"
