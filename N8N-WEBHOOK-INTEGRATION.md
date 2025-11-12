# Integración n8n Webhook - NOCTE Pre-Launch

## 📋 Resumen

Esta integración envía automáticamente los datos de cada compra a tu webhook de n8n para que puedas contactar a los clientes por WhatsApp.

## 🎯 Flujo Completo

```
Usuario hace clic en "Comprar"
    ↓
1. Upsell Modal (1 o 2 NOCTE)
    ↓
2. Stripe Checkout (pago en modo test)
    ↓
3. Location Modal (geolocalización o manual)
    ↓
4. Phone/Name Form (nombre, teléfono, referencia)
    ↓
5. ✅ Envío automático a n8n webhook
    ↓
6. Success Page
```

## 📦 Datos Enviados al Webhook n8n

El payload JSON que recibe tu webhook tiene esta estructura:

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

### Campos Importantes para WhatsApp:

- **`customer.name`**: Nombre completo del cliente
- **`customer.phone`**: Teléfono con formato +595 XXX XXXXXX (listo para WhatsApp)
- **`location.city`**: Ciudad/departamento
- **`location.address`**: Dirección completa con referencias
- **`location.googleMapsLink`**: Link clickeable a Google Maps con ubicación exacta
- **`order.quantity`**: Cantidad de productos (1 o 2)
- **`order.total`**: Total pagado en guaraníes

## 🔧 Configuración

### 1. Variables de Entorno (Backend)

Archivo: `/nocte-backend/.env`

```env
# n8n Webhook URL
N8N_WEBHOOK_URL=https://n8n.thebrightidea.ai/webhook/nocteorder

# Google Maps API (opcional, pero recomendado)
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

### 2. Obtener Google Maps API Key (Opcional)

**Si NO configuras la API key:**
- El sistema generará links de Google Maps con la dirección de texto
- Formato: `https://www.google.com/maps/search/?api=1&query=Asuncion+Paraguay`
- Funciona, pero es menos preciso

**Para configurar la API key (recomendado):**

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Crea un nuevo proyecto o selecciona uno existente
3. Click en "Create Credentials" → "API Key"
4. Habilita la **Geocoding API**:
   - Ve a: https://console.cloud.google.com/apis/library
   - Busca "Geocoding API"
   - Click en "Enable"
5. Copia tu API key y pégala en `/nocte-backend/.env`

**Costos:**
- Primeros 40,000 requests/mes: GRATIS
- Después: $5 USD por 1,000 requests adicionales
- Para tu caso (testing de ads): probablemente nunca pagues

### 3. Reiniciar Backend

```bash
cd nocte-backend
npm run dev
```

Deberías ver en la consola:
```
📝 Endpoints:
   POST /api/create-payment-intent
   POST /api/geocode
   POST /api/send-order
   POST /api/webhook
   GET  /api/health
```

## 🧪 Testing

### Test Manual (con cURL)

```bash
curl -X POST http://localhost:3000/api/send-order \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Usuario",
    "phone": "+595 971 123456",
    "location": "Asunción",
    "address": "Test Address 123",
    "quantity": 1,
    "total": 280000,
    "orderNumber": "#NOCTE-TEST-001"
  }'
```

Deberías recibir:
```json
{
  "success": true,
  "message": "Order sent to n8n successfully",
  "orderNumber": "#NOCTE-TEST-001",
  "n8nResponse": {...}
}
```

### Test del Flujo Completo

1. Inicia el frontend: `npm run dev`
2. Inicia el backend: `cd nocte-backend && npm run dev`
3. Ve a: http://localhost:8080
4. Completa el flujo de compra:
   - Click en "Comprar Ahora"
   - Selecciona cantidad (1 o 2)
   - Usa tarjeta de test Stripe: `4242 4242 4242 4242`
   - Permite geolocalización O ingresa ubicación manual
   - Ingresa nombre y teléfono
5. Verifica en la consola del backend:
   ```
   📦 Sending order to n8n...
   ✅ Order sent to n8n successfully
   ```
6. Verifica que n8n recibió el webhook

## 📍 Geolocalización - Cómo Funciona

### Escenario 1: Usuario acepta geolocalización
```
Usuario click "Usar mi ubicación actual"
    ↓
Browser pide permiso de ubicación
    ↓
Usuario acepta
    ↓
Se captura lat/long (-25.2968294, -57.6311821)
    ↓
Se genera link: https://www.google.com/maps?q=-25.2968294,-57.6311821
    ↓
Link directo a ubicación EXACTA (precisión de metros)
```

### Escenario 2: Usuario ingresa manualmente
```
Usuario selecciona ciudad: "Asunción"
    ↓
Usuario ingresa dirección: "Av. Mariscal López 1234"
    ↓
Backend envía a Google Geocoding API (si está configurada)
    ↓
Google devuelve lat/long de esa dirección
    ↓
Se genera link: https://www.google.com/maps?q=-25.2968294,-57.6311821
    ↓
Link con buena precisión (cuadra aproximada)
```

### Escenario 3: Sin Google Maps API
```
Usuario ingresa dirección manualmente
    ↓
Se genera link simple:
https://www.google.com/maps/search/?api=1&query=Av+Mariscal+López+1234+Asuncion
    ↓
Google Maps hace búsqueda de la dirección
    ↓
Funciona, pero puede ser menos preciso
```

## 🔍 Logs y Debugging

### Frontend (Browser Console)
```
📦 Preparing to send order to n8n...
📍 Google Maps link from coordinates: https://www.google.com/maps?q=-25.2968294,-57.6311821
✅ Order sent to n8n successfully: {...}
```

### Backend (Terminal)
```
📦 Sending order to n8n...
Order data: {
  "name": "Juan López",
  "phone": "+595 971 234567",
  ...
}
✅ Order sent to n8n successfully
n8n response: {...}
```

## ❌ Troubleshooting

### Error: "n8n webhook failed: 404"
**Causa:** La URL del webhook está mal o n8n no está escuchando
**Solución:** Verifica que `N8N_WEBHOOK_URL` en `.env` sea correcta

### Error: "Webhook URL not configured"
**Causa:** `N8N_WEBHOOK_URL` no está en `.env`
**Solución:** Agrega la variable al archivo `.env` del backend

### Link de Google Maps no funciona
**Causa:** API key inválida o sin créditos
**Solución:** Verifica la API key en Google Cloud Console

### Geolocalización no funciona
**Causa:** Browser bloqueó permisos o HTTPS no está habilitado
**Solución:**
- Verifica que el usuario dio permisos
- En localhost funciona sin HTTPS
- En producción necesitas HTTPS

## 📊 Estructura del Webhook n8n Recomendada

```
[Webhook Trigger]
    ↓
[Formatear Mensaje WhatsApp]
    ↓
[Enviar WhatsApp]
```

### Ejemplo de Mensaje WhatsApp:

```
🔴 NUEVO PEDIDO NOCTE #NOCTE-20251111-1234

👤 Cliente: Juan López
📱 WhatsApp: +595 971 234567

📍 Ubicación:
Asunción
Av. Mariscal López 1234, entre Brasilia y Sacramento

🗺️ Ver en mapa: https://www.google.com/maps?q=-25.2968294,-57.6311821

📦 Pedido:
2x NOCTE® Red Light Blocking Glasses
Total: 420,000 Gs

💳 Pago: Stripe Test (no procesado)

---
⚠️ RECORDAR: Stock llega en 30-45 días. Devolver pago y confirmar por WhatsApp.
```

## 🚀 Próximos Pasos

1. ✅ Configurar Google Maps API key (recomendado)
2. ✅ Testear el flujo completo
3. ✅ Configurar n8n para enviar WhatsApp automático
4. ✅ Medir métricas: CPL, Conversión, ROAS
5. ✅ Cuando llegue stock: procesar envíos reales

## 🎯 Objetivo Final

Cada vez que alguien complete el checkout:
1. ✅ Se simula el pago en Stripe
2. ✅ Se captura toda la info del cliente
3. ✅ Se envía automáticamente a n8n
4. ✅ n8n te envía mensaje/notificación
5. ✅ Contactas al cliente por WhatsApp
6. ✅ Le explicas que stock llega en X días
7. ✅ Mides conversión real

**NO es mentira. NO es estafa. Es testing de demanda real con transparencia post-compra.**
