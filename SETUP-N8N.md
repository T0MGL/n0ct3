# 🚀 Setup Rápido - Integración n8n Webhook

## ⚡ TL;DR - Pasos Rápidos

```bash
# 1. Configurar variables de entorno
cd nocte-backend
nano .env  # O usa tu editor favorito

# 2. Agregar esta línea (ya está, solo necesitas verificar):
N8N_WEBHOOK_URL=https://n8n.thebrightidea.ai/webhook/nocteorder

# 3. Opcionalmente agregar Google Maps API:
GOOGLE_MAPS_API_KEY=tu_api_key_aqui

# 4. Reiniciar backend
npm run dev

# 5. Testear integración
./test-webhook.sh
```

## 📋 Checklist de Setup

### 1. ✅ Webhook n8n (Ya configurado)

Tu URL ya está en `/nocte-backend/.env`:
```env
N8N_WEBHOOK_URL=https://n8n.thebrightidea.ai/webhook/nocteorder
```

**¿Qué hace?**
- Cada vez que un usuario completa el checkout, se envía un POST request a esta URL
- n8n recibe todos los datos del cliente (nombre, teléfono, ubicación, etc.)

**Verifica que funcione:**
```bash
cd nocte-backend
npm run dev
# En otra terminal:
./test-webhook.sh
```

### 2. ⚠️ Google Maps API (Opcional pero recomendado)

**¿Por qué lo necesitas?**
- Convierte direcciones de texto a coordenadas precisas
- Genera links de Google Maps clicleables
- Sin API: link funciona pero es menos preciso

**Cómo obtener la API key:**

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Crea un proyecto nuevo (o usa uno existente)
3. Click en "Create Credentials" → "API Key"
4. Copia la API key
5. Ve a: https://console.cloud.google.com/apis/library
6. Busca "Geocoding API" y habilítala
7. Pega tu API key en `/nocte-backend/.env`:
   ```env
   GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

**Costos:**
- ✅ Primeros 40,000 requests/mes: GRATIS
- ✅ Después: $5 USD por 1,000 requests
- ✅ Para testing: probablemente nunca pagues

**Si NO configuras la API:**
- Todo sigue funcionando ✅
- Los links de Google Maps se generan con la dirección de texto
- Menos preciso pero suficiente para testing

## 🧪 Testing

### Test Manual (Recomendado)

```bash
cd nocte-backend
npm run dev
```

En otra terminal:
```bash
cd nocte-backend
./test-webhook.sh
```

Deberías ver:
```
🧪 Testing n8n Webhook Integration
==================================

1️⃣ Testing backend health...
✅ Backend is running

2️⃣ Testing geocode API (fallback mode)...
✅ Geocode API working

3️⃣ Testing send order to n8n...
✅ Order sent to n8n successfully
```

### Test desde Frontend (Full Flow)

1. Inicia el backend:
   ```bash
   cd nocte-backend
   npm run dev
   ```

2. En otra terminal, inicia el frontend:
   ```bash
   npm run dev
   ```

3. Ve a: http://localhost:8080

4. Completa el flujo de compra:
   - Click "Comprar Ahora"
   - Selecciona cantidad (1 o 2)
   - Usa tarjeta test: `4242 4242 4242 4242`, exp: cualquier futuro, CVC: cualquier 3 dígitos
   - Permite geolocalización (recomendado) O ingresa ubicación manual
   - Ingresa nombre y teléfono

5. Verifica en la consola del backend:
   ```
   📦 Sending order to n8n...
   Order data: {...}
   ✅ Order sent to n8n successfully
   ```

6. Verifica en n8n que el webhook recibió los datos

## 📦 Estructura del Payload que recibe n8n

```json
{
  "orderNumber": "#NOCTE-20251111-1234",
  "timestamp": "2025-11-11T20:30:00.000Z",
  "customer": {
    "name": "Juan López",
    "phone": "+595 971 234567",
    "email": null
  },
  "location": {
    "city": "Asunción",
    "address": "Av. Mariscal López 1234, entre Brasilia y Sacramento",
    "googleMapsLink": "https://www.google.com/maps?q=-25.2968294,-57.6311821"
  },
  "order": {
    "quantity": 2,
    "product": "NOCTE® Red Light Blocking Glasses",
    "total": 420000,
    "currency": "PYG"
  },
  "payment": {
    "method": "stripe",
    "status": "succeeded",
    "paymentIntentId": "pi_xxxxxxxxxxxxx"
  },
  "source": "nocte-landing-page"
}
```

## 🔍 Troubleshooting

### ❌ Error: "n8n webhook failed: 404"

**Problema:** n8n no está escuchando o la URL está mal

**Solución:**
1. Verifica que la URL en `.env` sea correcta
2. Verifica que n8n esté activo
3. Prueba la URL con curl:
   ```bash
   curl -X POST https://n8n.thebrightidea.ai/webhook/nocteorder \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### ❌ Error: "Webhook URL not configured"

**Problema:** `.env` no tiene `N8N_WEBHOOK_URL`

**Solución:**
```bash
cd nocte-backend
nano .env
# Agrega:
# N8N_WEBHOOK_URL=https://n8n.thebrightidea.ai/webhook/nocteorder
```

### ❌ Backend no inicia (Puerto 3000 ocupado)

**Problema:** Ya hay un proceso en puerto 3000

**Solución:**
```bash
lsof -ti:3000 | xargs kill -9
cd nocte-backend
npm run dev
```

### ❌ Link de Google Maps no funciona

**Problema:** API key inválida o sin créditos

**Solución:**
1. Verifica la API key en Google Cloud Console
2. Asegúrate de que Geocoding API esté habilitada
3. Si no tienes API key, el sistema usa fallback (funciona igual, menos preciso)

## 📊 Ejemplo de Workflow n8n

```
[Webhook Trigger]
    ↓
[Función: Formatear datos]
    ↓
[WhatsApp/Telegram/Email]
    ↓
[Google Sheets (opcional)]
```

### Template de Mensaje para WhatsApp:

```
🔴 NUEVO PEDIDO NOCTE {{orderNumber}}

👤 Cliente: {{customer.name}}
📱 WhatsApp: {{customer.phone}}

📍 Ubicación:
{{location.city}}
{{location.address}}

🗺️ Ver en mapa: {{location.googleMapsLink}}

📦 Pedido:
{{order.quantity}}x {{order.product}}
Total: {{order.total}} {{order.currency}}

💳 Pago: {{payment.method}} - {{payment.status}}

---
⚠️ Stock llega en 30-45 días. Contactar para confirmar.
```

## ✅ Estado Actual

- ✅ Backend configurado con endpoints `/api/geocode` y `/api/send-order`
- ✅ Frontend integrado con `sendOrderToN8N()`
- ✅ Webhook URL de n8n configurada
- ✅ Geolocalización funcionando (captura lat/long)
- ✅ Google Maps links (fallback sin API key)
- ⏳ Pendiente: Agregar Google Maps API key (opcional)
- ⏳ Pendiente: Testear con flujo completo

## 🎯 Next Steps

1. **Agrega Google Maps API key** (recomendado):
   ```bash
   cd nocte-backend
   nano .env
   # Agrega: GOOGLE_MAPS_API_KEY=tu_key_aqui
   ```

2. **Testa el flujo completo**:
   ```bash
   # Terminal 1:
   cd nocte-backend && npm run dev

   # Terminal 2:
   npm run dev

   # Browser:
   http://localhost:8080
   ```

3. **Configura n8n para procesar los datos**:
   - Crea workflow en n8n
   - Usa el webhook: https://n8n.thebrightidea.ai/webhook/nocteorder
   - Formatea los datos
   - Envía a WhatsApp/Email/Sheets

4. **Mide métricas**:
   - CPL (Costo Por Lead)
   - Tasa de Conversión
   - ROAS (Return on Ad Spend)

## 📚 Documentación Completa

Para detalles técnicos completos, ver:
- `N8N-WEBHOOK-INTEGRATION.md` - Documentación técnica completa
- `nocte-backend/server.js` - Código del backend (endpoints `/api/geocode` y `/api/send-order`)
- `src/services/orderService.ts` - Servicio frontend para envío de datos

## 🆘 Ayuda

Si algo no funciona:
1. Lee `N8N-WEBHOOK-INTEGRATION.md` (troubleshooting completo)
2. Corre `./test-webhook.sh` para diagnosticar
3. Revisa logs del backend (consola donde corre `npm run dev`)
4. Revisa logs del frontend (browser console F12)
