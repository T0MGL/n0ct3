# STRIPE-INTEGRATION.md

Guía completa para integrar Stripe Payment con Face ID/Touch ID en NOCTE.

## Arquitectura de Integración

### Flujo de Pago
```
Usuario Click "Comprar"
  ↓
Apple Pay Dialog (Face ID/Touch ID automático)
  ↓
Payment Intent creado en backend
  ↓
Stripe procesa pago
  ↓
Confirmación y redirección
```

## Requisitos Previos

### 1. Cuenta de Stripe
- Crear cuenta en https://stripe.com
- Activar Apple Pay en Dashboard de Stripe
- Verificar dominio para Apple Pay

### 2. Certificado SSL
- **REQUERIDO**: Apple Pay solo funciona con HTTPS
- Desarrollo local: usar `localhost` (permitido por Apple)
- Producción: dominio con certificado SSL válido

## Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Stripe Keys (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
VITE_STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_xxxxxxxxxxxxxxxxxxxx

# Backend API URL
VITE_API_URL=http://localhost:3000/api
VITE_API_URL_PRODUCTION=https://tu-dominio.com/api

# Producto
VITE_PRODUCT_PRICE=9900
VITE_PRODUCT_CURRENCY=usd
VITE_PRODUCT_NAME="NOCTE® Red-Tinted Glasses"
```

### Obtener las Keys de Stripe

1. **Ir a Stripe Dashboard**: https://dashboard.stripe.com
2. **Developers → API Keys**
3. Copiar:
   - **Publishable key** (empieza con `pk_test_` o `pk_live_`)
   - **Secret key** (empieza con `sk_test_` o `sk_live_`) - ⚠️ SOLO BACKEND

**Modo Test vs Live**:
- `pk_test_` / `sk_test_`: Para desarrollo (tarjetas de prueba)
- `pk_live_` / `sk_live_`: Para producción (dinero real)

## Configuración del Proyecto

### 1. Instalar Dependencias

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Estructura de Archivos

```
src/
├── lib/
│   └── stripe.ts              # Configuración de Stripe
├── components/
│   ├── StripePaymentButton.tsx # Botón de pago con Apple Pay
│   └── PaymentSuccessModal.tsx # Modal de confirmación
├── hooks/
│   └── useStripePayment.ts    # Hook para lógica de pago
└── types/
    └── stripe.ts              # TypeScript types
```

## Implementación Frontend

### 1. Configuración Inicial (`src/lib/stripe.ts`)

```typescript
import { loadStripe, Stripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  throw new Error('Missing Stripe publishable key');
}

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export const PRODUCT_CONFIG = {
  price: parseInt(import.meta.env.VITE_PRODUCT_PRICE || '9900'),
  currency: import.meta.env.VITE_PRODUCT_CURRENCY || 'usd',
  name: import.meta.env.VITE_PRODUCT_NAME || 'NOCTE Glasses',
};
```

### 2. Componente de Pago (`src/components/StripePaymentButton.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { PaymentRequest, PaymentRequestPaymentMethodEvent } from '@stripe/stripe-js';
import { getStripe, PRODUCT_CONFIG } from '@/lib/stripe';
import { Button } from '@/components/ui/button';

export const StripePaymentButton = () => {
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    const initPaymentRequest = async () => {
      const stripe = await getStripe();
      if (!stripe) return;

      const pr = stripe.paymentRequest({
        country: 'US',
        currency: PRODUCT_CONFIG.currency,
        total: {
          label: PRODUCT_CONFIG.name,
          amount: PRODUCT_CONFIG.price,
        },
        requestPayerName: true,
        requestPayerEmail: true,
        requestShipping: true,
        shippingOptions: [
          {
            id: 'standard',
            label: 'Standard Shipping',
            detail: '5-7 business days',
            amount: 0,
          },
        ],
      });

      // Verificar si Apple Pay/Google Pay está disponible
      const canMake = await pr.canMakePayment();
      if (canMake) {
        setPaymentRequest(pr);
        setCanMakePayment(true);
      }

      // Manejar el evento de pago
      pr.on('paymentmethod', async (ev: PaymentRequestPaymentMethodEvent) => {
        // Aquí se conecta con tu backend
        const response = await fetch(`${import.meta.env.VITE_API_URL}/create-payment-intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: PRODUCT_CONFIG.price,
            paymentMethodId: ev.paymentMethod.id,
            shipping: ev.shippingAddress,
            email: ev.payerEmail,
          }),
        });

        const { clientSecret, error } = await response.json();

        if (error) {
          ev.complete('fail');
          return;
        }

        // Confirmar pago
        const { error: confirmError } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: ev.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          ev.complete('fail');
        } else {
          ev.complete('success');
          // Mostrar modal de éxito
        }
      });
    };

    initPaymentRequest();
  }, []);

  if (!canMakePayment) {
    return (
      <Button className="w-full bg-gradient-to-r from-[#EF4444] to-[#DC2626]">
        Buy Now - ${(PRODUCT_CONFIG.price / 100).toFixed(2)}
      </Button>
    );
  }

  return (
    <div id="payment-request-button" className="w-full">
      {/* Stripe renderiza aquí el botón de Apple Pay/Google Pay */}
    </div>
  );
};
```

### 3. Hook Personalizado (`src/hooks/useStripePayment.ts`)

```typescript
import { useState } from 'react';
import { getStripe } from '@/lib/stripe';

interface PaymentData {
  email: string;
  amount: number;
  shippingAddress?: any;
}

export const useStripePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = async (data: PaymentData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createPaymentIntent, loading, error };
};
```

## Backend API (Ejemplo con Node.js/Express)

### Variables de Entorno Backend (`.env`)

```env
# Stripe Secret Key (⚠️ NUNCA exponer en frontend)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY_LIVE=sk_live_xxxxxxxxxxxxxxxxxxxx

# Webhook Secret (para eventos de Stripe)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx

# Server
PORT=3000
NODE_ENV=development
```

### Endpoint de Pago (`server.js` o similar)

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(express.json());

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, paymentMethodId, email, shipping } = req.body;

    // Crear Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method: paymentMethodId,
      receipt_email: email,
      shipping: {
        name: shipping.recipient,
        address: {
          line1: shipping.addressLine[0],
          city: shipping.city,
          state: shipping.region,
          postal_code: shipping.postalCode,
          country: shipping.country,
        },
      },
      metadata: {
        product: 'NOCTE Glasses',
      },
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Webhook para eventos de Stripe
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar eventos
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Enviar email de confirmación, actualizar base de datos, etc.
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    case 'payment_intent.payment_failed':
      // Manejar fallo de pago
      break;
  }

  res.json({ received: true });
});

app.listen(3000);
```

## Configuración de Apple Pay en Stripe Dashboard

### 1. Verificar Dominio
1. Ir a: https://dashboard.stripe.com/settings/payment_methods
2. Clic en "Apple Pay"
3. Agregar dominio (ej: `nocte.com`)
4. Descargar archivo de verificación
5. Colocar en: `/.well-known/apple-developer-merchantid-domain-association`

### 2. Habilitar Payment Methods
- Apple Pay ✓
- Google Pay ✓
- Cards ✓

## Testing

### Tarjetas de Prueba (Modo Test)

```
Apple Pay Test:
- Usar dispositivo real con iOS o simulador con tarjeta de prueba agregada

Tarjetas de prueba Stripe:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155
```

### Comandos de Testing

```bash
# Desarrollo local con HTTPS (requerido para Apple Pay)
npm run dev -- --host --https

# Test webhook localmente (instalar Stripe CLI)
stripe listen --forward-to localhost:3000/api/webhook
```

## Checklist de Implementación

- [ ] Crear cuenta de Stripe
- [ ] Obtener API keys (test y live)
- [ ] Crear archivo `.env` con variables
- [ ] Instalar dependencias npm
- [ ] Implementar `src/lib/stripe.ts`
- [ ] Crear componente `StripePaymentButton.tsx`
- [ ] Configurar backend con endpoint `/create-payment-intent`
- [ ] Verificar dominio para Apple Pay en Stripe Dashboard
- [ ] Habilitar HTTPS en desarrollo
- [ ] Probar con tarjetas de test
- [ ] Configurar webhook endpoint
- [ ] Agregar manejo de errores y loading states
- [ ] Implementar modal de confirmación
- [ ] Testing en dispositivo iOS real
- [ ] Cambiar a keys de producción (`pk_live_`, `sk_live_`)

## Seguridad

### ⚠️ IMPORTANTE

1. **NUNCA** exponer `STRIPE_SECRET_KEY` en frontend
2. **SIEMPRE** usar HTTPS en producción
3. **VALIDAR** webhooks con `STRIPE_WEBHOOK_SECRET`
4. **VERIFICAR** montos en backend (nunca confiar en frontend)
5. **RATE LIMIT** endpoints de pago

### Variables Seguras

**Frontend** (`.env`):
- ✅ `VITE_STRIPE_PUBLISHABLE_KEY` (seguro exponer)
- ❌ `STRIPE_SECRET_KEY` (NUNCA incluir)

**Backend** (`.env`):
- ✅ `STRIPE_SECRET_KEY` (solo backend)
- ✅ `STRIPE_WEBHOOK_SECRET` (solo backend)

## Costos de Stripe

- **Por transacción**: 2.9% + $0.30 USD
- **Apple Pay/Google Pay**: Sin costo adicional
- **Chargebacks**: $15 USD por disputa
- **Modo Test**: Gratis (ilimitado)

## Recursos Adicionales

- [Stripe Docs - Payment Request Button](https://stripe.com/docs/stripe-js/elements/payment-request-button)
- [Stripe Docs - Apple Pay](https://stripe.com/docs/apple-pay)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Testing Stripe](https://stripe.com/docs/testing)

## Soporte

Si tienes problemas:
1. Verificar que el dominio tenga HTTPS
2. Revisar console del navegador para errores
3. Verificar que las API keys sean correctas
4. Probar en dispositivo iOS real (simulador puede tener limitaciones)
5. Revisar logs de Stripe Dashboard

---

**Siguiente Paso**: ¿Quieres que implemente el código completo en el proyecto NOCTE?
