# 🔥 Stripe con Face ID - NOCTE

Integración completa de Stripe Payment con Apple Pay (Face ID/Touch ID) para NOCTE.

## 📁 Archivos Importantes

- **`SETUP-STRIPE.md`** - 🚀 Guía paso a paso para configurar Stripe (EMPIEZA AQUÍ)
- **`STRIPE-INTEGRATION.md`** - 📖 Documentación técnica completa
- **`.env.example`** - 📝 Template de variables de entorno (frontend)
- **`backend-example.js`** - 🖥️ Ejemplo de backend listo para usar
- **`backend-example.env`** - 🔐 Template de variables de backend

## ⚡ Quick Start (3 pasos)

### 1. Frontend Setup
```bash
# Copiar template
cp .env.example .env

# Editar .env y agregar tu Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_PRODUCT_PRICE=100000
VITE_PRODUCT_CURRENCY=pyg
```

### 2. Backend Setup (en otra carpeta)
```bash
# Crear carpeta para backend
mkdir nocte-backend
cd nocte-backend

# Copiar el archivo de ejemplo
cp ../backend-example.js .
cp ../backend-example.env .env

# Instalar dependencias
npm init -y
npm install express stripe cors dotenv

# Editar .env y agregar tu Secret Key
STRIPE_SECRET_KEY=sk_test_...

# Ejecutar
node backend-example.js
```

### 3. Probar
```bash
# En la carpeta del frontend
npm run dev

# Abrir en navegador: http://localhost:8080
# Click en "Comprar Ahora"
# Si tienes Face ID configurado, debería aparecer Apple Pay
```

## 🎯 ¿Qué hace esta integración?

### ✅ Features Implementadas

1. **Apple Pay / Google Pay**
   - Botón nativo de pago
   - Face ID / Touch ID automático
   - Sin salir de la página

2. **Fallback Inteligente**
   - Si no hay API key → Flujo normal (UpsellModal)
   - Si Apple Pay no está disponible → Botón regular
   - Si pago falla → Flujo normal

3. **Multi-Currency**
   - Soporte para PYG (Guaraníes paraguayos)
   - Soporte para USD, EUR, etc.
   - Formateo automático de precios

4. **TypeScript Completo**
   - Types para todos los componentes
   - Validación en tiempo de compilación
   - Intellisense completo

5. **UI Intacta**
   - No rompe el diseño existente
   - Animaciones Framer Motion mantenidas
   - Responsive design preservado

## 🏗️ Arquitectura

```
Frontend (React + Vite + TypeScript)
├── src/lib/stripe.ts             # Configuración central
├── src/types/stripe.ts           # TypeScript types
├── src/hooks/useStripePayment.ts # Custom hook
├── src/components/
│   ├── StripePaymentButton.tsx   # Botón de pago
│   ├── PaymentSuccessModal.tsx   # Modal de éxito
│   └── HeroSection.tsx           # Integrado aquí
└── .env                          # Variables (frontend)

Backend (Node.js + Express)
├── backend-example.js            # Servidor API
├── .env                          # Variables (backend)
└── package.json
```

## 🔒 Seguridad

### ✅ Qué SÍ hacer:
- Usar `pk_test_` en `.env` del frontend (seguro exponer)
- Usar `sk_test_` SOLO en backend (nunca frontend)
- Validar montos en el backend
- Usar HTTPS en producción

### ❌ Qué NO hacer:
- ~~Exponer Secret Key en frontend~~
- ~~Confiar en montos del frontend~~
- ~~Usar HTTP en producción~~
- ~~Commitear archivos `.env` a git~~

## 📊 Estados del Sistema

| Condición | Comportamiento |
|-----------|----------------|
| Sin `.env` configurado | Botón normal → UpsellModal (flujo original) |
| Con `.env` + Apple Pay disponible | Botón Apple Pay → Face ID → Pago |
| Con `.env` + Apple Pay NO disponible | Botón normal → UpsellModal (fallback) |
| Error en Stripe | Fallback a flujo original automático |

## 💰 Pricing para PYG (Guaraníes)

```env
# PYG NO usa decimales (a diferencia de USD)
VITE_PRODUCT_PRICE=100000   # = 100,000 Gs
VITE_PRODUCT_PRICE=280000   # = 280,000 Gs
VITE_PRODUCT_PRICE=1000     # = 1,000 Gs (testing)

# El código maneja esto automáticamente:
# - PYG: precio / 1 (sin división)
# - USD: precio / 100 (para convertir cents)
```

## 🧪 Testing

### Tarjetas de Prueba (Stripe Test Mode)
- **Éxito**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Fecha**: Cualquier fecha futura
- **CVC**: Cualquier 3 dígitos

### Apple Pay Testing
- Dispositivo iOS o Mac con Safari
- HTTPS requerido (no HTTP)
- Tarjeta agregada a Apple Wallet

## 🚀 Ir a Producción

1. **Activar cuenta Stripe** (verificación de identidad)
2. **Cambiar a Live Keys**:
   ```env
   # Frontend
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

   # Backend
   STRIPE_SECRET_KEY=sk_live_...
   ```
3. **Verificar dominio** para Apple Pay en Stripe Dashboard
4. **Configurar webhooks** para confirmar pagos
5. **HTTPS obligatorio** en producción

## 📝 Variables de Entorno - Cheatsheet

### Frontend (.env)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...   # Stripe publishable key
VITE_API_URL=http://localhost:3000/api    # Backend URL
VITE_PRODUCT_PRICE=100000                 # Precio en Gs
VITE_PRODUCT_CURRENCY=pyg                 # Código de moneda
VITE_PRODUCT_NAME="NOCTE® Red-Tinted Glasses"
```

### Backend (.env)
```env
STRIPE_SECRET_KEY=sk_test_...             # ⚠️ NUNCA en frontend
STRIPE_WEBHOOK_SECRET=whsec_...           # Para webhooks
PORT=3000                                 # Puerto del servidor
```

## 🛠️ Troubleshooting

| Problema | Solución |
|----------|----------|
| "Stripe not initialized" | Verifica API key en `.env`, reinicia `npm run dev` |
| "Apple Pay no disponible" | Necesitas HTTPS + dominio verificado + dispositivo iOS |
| Precio mal formateado | Verifica `VITE_PRODUCT_CURRENCY=pyg` en `.env` |
| Error CORS | Agrega `cors()` en backend o configura origins |
| Backend no responde | Verifica que esté corriendo en puerto 3000 |

## 📚 Documentación Adicional

- [Stripe Docs - Payment Request Button](https://stripe.com/docs/stripe-js/elements/payment-request-button)
- [Stripe Docs - Apple Pay](https://stripe.com/docs/apple-pay)
- [Stripe Testing](https://stripe.com/docs/testing)

## 🎨 UI Components Creados

- `StripePaymentButton` - Botón de pago con Apple Pay
- `PaymentSuccessModal` - Modal de confirmación de pago
- `useStripePayment` - Hook para lógica de pago

## ✨ Features Adicionales Posibles

- [ ] Google Pay button (ya incluido, automático)
- [ ] Checkout de múltiples productos
- [ ] Cupones de descuento
- [ ] Subscripciones recurrentes
- [ ] Guardado de métodos de pago
- [ ] Link (one-click checkout de Stripe)

---

**¿Necesitas ayuda?** Revisa `SETUP-STRIPE.md` para instrucciones detalladas.
