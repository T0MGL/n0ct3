# Setup Rápido de Stripe para NOCTE

## 1. Crear archivo .env

```bash
cp .env.example .env
```

## 2. Obtener tus Stripe Keys

### Paso A: Ir a Stripe Dashboard
1. Visita: https://dashboard.stripe.com/test/apikeys
2. Inicia sesión o crea una cuenta

### Paso B: Copiar Publishable Key
1. En la sección "Standard keys"
2. Busca "Publishable key" (empieza con `pk_test_...`)
3. Haz clic en "Reveal test key"
4. Copia la key completa

## 3. Configurar tu .env

Abre el archivo `.env` y pega tu key:

```env
# Stripe Publishable Key (safe to expose in frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Qwerty1234567890...

# Backend API URL (cambiar cuando tengas tu backend)
VITE_API_URL=http://localhost:3000/api

# Product Configuration
# Precio en guaraníes (100000 = 100,000 Gs)
VITE_PRODUCT_PRICE=100000
VITE_PRODUCT_CURRENCY=pyg
VITE_PRODUCT_NAME="NOCTE® Red-Tinted Glasses"
```

### Importante sobre el Precio:
- **PYG no usa decimales** (a diferencia del dólar)
- El precio se guarda directamente en guaraníes
- Ejemplos:
  - `100000` = 100,000 Gs
  - `280000` = 280,000 Gs
  - `1000` = 1,000 Gs (para testing)

## 4. Configurar Backend API

⚠️ **CRÍTICO**: Necesitas un backend para procesar pagos de forma segura.

### Opción A: Usar el ejemplo en STRIPE-INTEGRATION.md
Ver sección "Backend API (Ejemplo con Node.js/Express)" en `STRIPE-INTEGRATION.md`

### Opción B: Crear un backend simple con Express

```javascript
// server.js
const express = require('express');
const stripe = require('stripe')('sk_test_TU_SECRET_KEY_AQUI');
const app = express();

app.use(express.json());
app.use(express.cors());

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, email } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      receipt_email: email,
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Backend running on port 3000'));
```

## 5. Habilitar Apple Pay en Stripe

1. Ve a: https://dashboard.stripe.com/settings/payment_methods
2. Busca "Apple Pay"
3. Haz clic en "Enable"
4. **Verifica tu dominio**:
   - Agrega tu dominio (ej: `nocte.com`)
   - Descarga el archivo de verificación
   - Colócalo en: `/.well-known/apple-developer-merchantid-domain-association`

## 6. Probar la Integración

### Testing Local (con HTTPS):
```bash
# Instalar servidor HTTPS local
npm install -g local-ssl-proxy

# En terminal 1: Iniciar dev server
npm run dev

# En terminal 2: Proxy HTTPS
local-ssl-proxy --source 3001 --target 8080

# Abrir en navegador: https://localhost:3001
```

### Tarjetas de Prueba de Stripe:
- **Éxito**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- **Cualquier fecha futura** y **cualquier CVC**

### Probar Apple Pay:
- Necesitas dispositivo iOS o Mac con Safari
- Debe tener HTTPS (no funciona con HTTP)
- Agrega una tarjeta de prueba a Apple Pay en tu dispositivo

## 7. Ir a Producción

Cuando estés listo para aceptar pagos reales:

1. **Activar tu cuenta de Stripe**
   - Completa la información de negocio
   - Verifica tu identidad

2. **Cambiar a Live Keys**
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   VITE_API_URL=https://tu-dominio.com/api
   ```

3. **Backend con Live Secret Key**
   ```javascript
   const stripe = require('stripe')('sk_live_...');
   ```

4. **Verificar Dominio de Producción**
   - Re-verificar dominio en Stripe Dashboard para Apple Pay

## Troubleshooting

### "Stripe not initialized"
- Verifica que la key en `.env` sea correcta
- Reinicia el servidor de desarrollo: `npm run dev`

### "Apple Pay no está disponible"
- Verifica que tengas HTTPS
- Verifica que hayas verificado el dominio en Stripe
- Prueba en dispositivo iOS real (no simulador a veces)

### Error de CORS en backend
- Agrega `app.use(express.cors())` en tu backend
- O configura CORS específicamente:
  ```javascript
  app.use(cors({ origin: 'https://tu-dominio.com' }))
  ```

### Precio se muestra mal
- PYG: El precio NO se divide entre 100
- USD/EUR: El precio SÍ se divide entre 100
- Verifica `VITE_PRODUCT_CURRENCY` en `.env`

## Variables de Entorno - Referencia Rápida

```env
# STRIPE
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (Test) o pk_live_... (Producción)

# BACKEND
VITE_API_URL=http://localhost:3000/api (Local) o https://api.tudominio.com (Producción)

# PRODUCTO
VITE_PRODUCT_PRICE=100000 (en guaraníes, sin decimales)
VITE_PRODUCT_CURRENCY=pyg (Paraguay) o usd (Estados Unidos)
VITE_PRODUCT_NAME="NOCTE® Red-Tinted Glasses"
```

## Seguridad

✅ **NUNCA** expongas tu Secret Key (`sk_test_...` o `sk_live_...`) en el frontend
✅ **SIEMPRE** usa HTTPS en producción
✅ **VALIDA** los montos en el backend (nunca confíes en el frontend)

---

¿Problemas? Revisa la documentación completa en `STRIPE-INTEGRATION.md`
