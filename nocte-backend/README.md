# NOCTE Backend API

Backend para procesar pagos de Stripe en localhost (desarrollo).

## 🚀 Quick Start

### 1. Obtener tu Stripe Secret Key

1. Ve a: https://dashboard.stripe.com/test/apikeys
2. Busca **"Secret key"** (empieza con `sk_test_...`)
3. Haz clic en **"Reveal test key"**
4. Copia la key completa

### 2. Configurar .env

Edita el archivo `.env` en esta carpeta y pega tu Secret Key:

```bash
STRIPE_SECRET_KEY=sk_test_TU_KEY_COMPLETA_AQUI
```

### 3. Ejecutar el servidor

```bash
npm start
```

Deberías ver:

```
═══════════════════════════════════════════
  🚀 NOCTE Backend API - Development Mode
═══════════════════════════════════════════
  ✓ Server:        http://localhost:3000
  ✓ Health Check:  http://localhost:3000/api/health
  ✓ Environment:   development
  ✓ Stripe Key:    ✓ Configured
═══════════════════════════════════════════
```

### 4. Verificar que funciona

Abre en tu navegador: http://localhost:3000/api/health

Deberías ver:

```json
{
  "status": "ok",
  "timestamp": "2025-11-11T...",
  "stripe_configured": true
}
```

## ✅ ¡Listo!

El backend está corriendo. Ahora el frontend podrá procesar pagos.

## 🔄 Workflow de Desarrollo

### Terminal 1 - Backend
```bash
cd nocte-backend
npm start
```

### Terminal 2 - Frontend
```bash
cd ..
npm run dev
```

## 📝 Endpoints Disponibles

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | Info del servidor |
| `/api/health` | GET | Health check |
| `/api/create-payment-intent` | POST | Crear intento de pago |
| `/api/webhook` | POST | Webhooks de Stripe |

## 🧪 Probar el Backend

### Con curl:

```bash
# Health check
curl http://localhost:3000/api/health

# Crear payment intent (ejemplo)
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100000,
    "currency": "pyg",
    "email": "test@example.com",
    "paymentMethodId": "pm_test_123"
  }'
```

## 🐛 Troubleshooting

### Error: "Stripe Key: ✗ Missing"

**Solución**: Configura tu `.env` con la Secret Key correcta.

```bash
# Editar .env
nano .env

# Agregar:
STRIPE_SECRET_KEY=sk_test_tu_key_aqui
```

### Error: "Address already in use"

**Causa**: El puerto 3000 ya está siendo usado.

**Solución 1**: Cambiar el puerto en `.env`:
```bash
PORT=3001
```

**Solución 2**: Matar el proceso en puerto 3000:
```bash
lsof -ti:3000 | xargs kill
```

### Error de CORS

**Causa**: Frontend en puerto diferente.

**Solución**: Agregar el puerto en `.env`:
```bash
CORS_ORIGIN=http://localhost:8080,http://localhost:TU_PUERTO
```

## 📦 Estructura

```
nocte-backend/
├── server.js          # Servidor Express con Stripe
├── package.json       # Dependencias
├── .env              # Variables de entorno (NO commitear)
└── README.md         # Esta documentación
```

## 🔒 Seguridad

- ✅ `.env` está en `.gitignore` (no se commitea)
- ✅ Secret Key nunca se expone al frontend
- ✅ CORS configurado solo para localhost
- ⚠️ Este setup es solo para desarrollo local

## 🚀 Para Producción

Cuando estés listo para producción:

1. Cambiar a Live Key: `sk_live_...`
2. Configurar dominio real en CORS
3. Agregar HTTPS
4. Configurar webhooks de Stripe
5. Agregar base de datos
6. Deploy a Vercel/Railway/Render

---

**¿Problemas?** Verifica que:
1. Node.js esté instalado (`node -v`)
2. Dependencies instaladas (`npm install`)
3. Secret Key correcta en `.env`
4. Puerto 3000 disponible
