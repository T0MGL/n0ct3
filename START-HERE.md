# 🎯 CÓMO EJECUTAR NOCTE CON STRIPE EN LOCALHOST

Guía completa para correr el sistema en tu máquina local.

---

## ✅ Estado Actual

- ✅ **Frontend**: Configurado y listo
- ✅ **Backend**: Creado y funcionando
- ✅ **Stripe**: Integrado (modo test)
- ✅ **Variables**: Todas configuradas

---

## 🚀 Inicio Rápido (2 Terminales)

### Terminal 1: Backend

```bash
# Navegar a la carpeta del backend
cd nocte-backend

# Ejecutar el servidor
npm start
```

**Deberías ver:**
```
═══════════════════════════════════════════
  🚀 NOCTE Backend API - Development Mode
═══════════════════════════════════════════
  ✓ Server:        http://localhost:3000
  ✓ Stripe Key:    ✓ Configured
═══════════════════════════════════════════
```

### Terminal 2: Frontend

```bash
# Navegar a la carpeta principal (si estás en nocte-backend)
cd ..

# Ejecutar el frontend
npm run dev
```

**Deberías ver:**
```
  VITE v5.4.19  ready in 110 ms

  ➜  Local:   http://localhost:8080/
```

### 3. Abrir en Navegador

Abre: **http://localhost:8080**

---

## 🎮 Cómo Probar el Sistema

### Test 1: Verificar que todo cargue
1. Abre http://localhost:8080
2. La página debería cargar sin errores
3. Abre DevTools (F12) y ve a Console
4. NO deberías ver errores de Stripe

### Test 2: Ver el botón de pago
1. En la página, busca el botón **"Comprar Ahora"**
2. Haz clic en él
3. Deberías ver:
   - **En iOS/Mac con Safari**: Botón de Apple Pay
   - **En otros navegadores**: Modal de Upsell (comportamiento normal sin Apple Pay)

### Test 3: Probar un pago (Si tienes dispositivo iOS)
1. Asegúrate de que ambos servidores estén corriendo
2. Abre en Safari (iOS o Mac)
3. Click en "Comprar Ahora"
4. Si aparece Apple Pay, puedes probar con:
   - **Tarjeta de prueba**: `4242 4242 4242 4242`
   - **Fecha**: Cualquier fecha futura
   - **CVC**: `123`

---

## 📋 Checklist de Verificación

Antes de probar, verifica:

- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 8080
- [ ] Archivo `.env` en raíz con Stripe Publishable Key
- [ ] Archivo `.env` en `nocte-backend/` con Stripe Secret Key
- [ ] Ambas keys son de TEST (empiezan con `pk_test_` y `sk_test_`)

---

## 🔑 Variables de Entorno

### Frontend (raíz del proyecto - `.env`)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SS887...  ✅ YA CONFIGURADA
VITE_API_URL=http://localhost:3000/api          ✅ YA CONFIGURADA
VITE_PRODUCT_PRICE=100000                        ✅ YA CONFIGURADA
VITE_PRODUCT_CURRENCY=pyg                        ✅ YA CONFIGURADA
```

### Backend (`nocte-backend/.env`)
```env
STRIPE_SECRET_KEY=sk_test_...  ⚠️ NECESITAS TU SECRET KEY
PORT=3000                      ✅ YA CONFIGURADA
```

**⚠️ IMPORTANTE**: Si el backend no funciona, revisa que tengas tu **Secret Key** correcta.

---

## 🔧 Obtener tu Secret Key

1. Ve a: https://dashboard.stripe.com/test/apikeys
2. Busca **"Secret key"** (NO "Publishable key")
3. Haz clic en **"Reveal test key"**
4. Copia la key (empieza con `sk_test_...`)
5. Pégala en `nocte-backend/.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_TU_KEY_AQUI
   ```

---

## 🐛 Solución de Problemas

### Backend no inicia

**Error**: "Stripe Key: ✗ Missing"

**Solución**:
```bash
cd nocte-backend
nano .env
# Agregar: STRIPE_SECRET_KEY=sk_test_...
```

---

### Frontend no conecta con Backend

**Error en Console**: "Failed to fetch" o "Network Error"

**Solución**:
1. Verifica que el backend esté corriendo:
   ```bash
   curl http://localhost:3000/api/health
   ```
2. Debería responder:
   ```json
   {"status":"ok","stripe_configured":true}
   ```
3. Si no responde, reinicia el backend:
   ```bash
   cd nocte-backend
   npm start
   ```

---

### Puerto ya en uso

**Error**: "Port 3000 is already in use"

**Solución**:
```bash
# Opción 1: Matar el proceso
lsof -ti:3000 | xargs kill

# Opción 2: Cambiar puerto en nocte-backend/.env
PORT=3001
```

---

### Apple Pay no aparece

**Razones comunes**:
1. No estás en Safari (iOS/Mac)
2. No tienes tarjeta en Apple Wallet
3. No estás en dispositivo Apple

**Comportamiento normal**:
- Sin Apple Pay → Muestra modal de Upsell (flujo normal)
- Con Apple Pay → Muestra botón de Apple Pay

---

## 📁 Estructura del Proyecto

```
NOCTE ®/
├── src/                          # Frontend React
│   ├── components/
│   │   ├── StripePaymentButton.tsx    ✅ Botón de pago
│   │   └── PaymentSuccessModal.tsx    ✅ Modal de éxito
│   ├── lib/
│   │   └── stripe.ts                  ✅ Config de Stripe
│   └── hooks/
│       └── useStripePayment.ts        ✅ Hook de pagos
│
├── nocte-backend/                # Backend Node.js
│   ├── server.js                 ✅ Servidor Express
│   ├── .env                      ⚠️ Configurar Secret Key
│   └── package.json              ✅ Dependencias
│
├── .env                          ✅ Variables frontend
└── package.json                  ✅ Frontend deps
```

---

## 🎯 Workflow de Desarrollo Diario

Cada vez que trabajes en el proyecto:

```bash
# 1. Abrir Terminal 1
cd "/Users/gastonlopez/Documents/Code/NOCTE ®/nocte-backend"
npm start

# 2. Abrir Terminal 2
cd "/Users/gastonlopez/Documents/Code/NOCTE ®"
npm run dev

# 3. Abrir navegador
# → http://localhost:8080
```

Para detener:
- `Ctrl + C` en cada terminal

---

## 💡 Tips Importantes

1. **Siempre inicia el backend primero** (puede tardar 2-3 segundos)
2. **No cierres las terminales** mientras trabajes
3. **Los logs del backend** te mostrarán cada pago procesado
4. **En modo test** no se cobra dinero real

---

## 📊 Verificar que todo funciona

### Test Completo:

```bash
# Terminal 1: Backend
cd nocte-backend && npm start

# Terminal 2: Frontend
cd .. && npm run dev

# Terminal 3: Health check
curl http://localhost:3000/api/health
# Debería responder: {"status":"ok","stripe_configured":true}

# Terminal 4: Verificar frontend
curl -s http://localhost:8080
# Debería devolver HTML
```

✅ **Si todos los comandos funcionan, estás listo!**

---

## 🎨 Flujos de Pago Disponibles

### Flujo 1: Con Apple Pay (iOS/Mac + Safari)
```
Click "Comprar Ahora"
  ↓
Botón Apple Pay aparece
  ↓
Face ID / Touch ID
  ↓
Pago procesado
  ↓
Modal de éxito
```

### Flujo 2: Sin Apple Pay (Otros navegadores)
```
Click "Comprar Ahora"
  ↓
Modal de Upsell (2x1 offer)
  ↓
Selección de cantidad
  ↓
[Flujo existente continúa...]
```

---

## 🚀 Siguientes Pasos

Una vez que todo funcione en localhost:

1. [ ] Probar pagos con tarjetas de prueba
2. [ ] Verificar emails de confirmación (logs del backend)
3. [ ] Probar en dispositivo iOS real
4. [ ] Personalizar mensajes de error
5. [ ] Agregar base de datos (opcional)

---

## 📞 ¿Problemas?

Si algo no funciona:

1. ✅ Verifica que Node.js esté instalado: `node -v`
2. ✅ Verifica que las dependencias estén instaladas: `npm install`
3. ✅ Verifica que las Secret Keys sean correctas
4. ✅ Verifica que ambos servidores estén corriendo
5. ✅ Revisa los logs de la terminal para ver errores

---

**¡Todo está listo! Solo necesitas ejecutar los 2 comandos y empezar a probar.**
