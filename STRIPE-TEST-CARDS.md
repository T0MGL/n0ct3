# 🧪 Guía de Pruebas - Stripe Checkout

Esta guía contiene todas las tarjetas de prueba de Stripe para verificar el correcto funcionamiento del checkout.

## 🎯 Cómo Probar

1. **Abre la aplicación**: http://localhost:8080
2. **Haz clic en**: "COMPRAR AHORA"
3. **Selecciona cantidad**: 1 o 2 unidades
4. **En el modal de Stripe**: Usa una de las tarjetas de prueba abajo

---

## 💳 Tarjetas de Prueba de Stripe

### ✅ TARJETA EXITOSA (RECOMENDADA PARA PRUEBAS NORMALES)

```
Número:      4242 4242 4242 4242
Vencimiento: 12/25
CVC:         123
Nombre:      Test Success
```

**Resultado esperado**: ✅ Pago exitoso, se mostrará confirmación

---

### ❌ TARJETA DECLINADA

```
Número:      4000 0000 0000 0002
Vencimiento: 12/25
CVC:         123
Nombre:      Test Declined
```

**Resultado esperado**: ❌ Error "Your card was declined"

---

### 💰 FONDOS INSUFICIENTES

```
Número:      4000 0000 0000 9995
Vencimiento: 12/25
CVC:         123
Nombre:      Test Insufficient Funds
```

**Resultado esperado**: ❌ Error "Your card has insufficient funds"

---

### 🔐 3D SECURE / AUTENTICACIÓN REQUERIDA

```
Número:      4000 0025 0000 3155
Vencimiento: 12/25
CVC:         123
Nombre:      Test 3D Secure
```

**Resultado esperado**: 🔐 Modal de autenticación 3D Secure → Completar o Fallar

---

## 🌎 Tarjetas Internacionales

### 🇺🇸 Visa USA
```
4242424242424242
```

### 🇦🇷 Visa Argentina
```
4000000320000021
```

### 🇧🇷 Visa Brasil
```
4000000760000002
```

### 🇲🇽 Visa México
```
4000004840000008
```

---

## 🍎 Apple Pay / 🤖 Google Pay

**Nota**: En desarrollo local, Apple Pay y Google Pay pueden no estar disponibles. Necesitas:
- ✅ HTTPS (usa ngrok o similar)
- ✅ Dominio verificado
- ✅ Dispositivo compatible

Para probar en local, usa las tarjetas normales arriba.

---

## 🧪 Escenarios de Prueba Recomendados

### Test 1: Flujo Exitoso Completo
1. Usa tarjeta **4242 4242 4242 4242**
2. Cantidad: **1 unidad** (280,000 PYG)
3. Verifica que se muestre confirmación
4. Revisa logs del backend

### Test 2: Upsell (2 unidades)
1. Usa tarjeta **4242 4242 4242 4242**
2. Cantidad: **2 unidades** (420,000 PYG)
3. Verifica monto correcto en checkout
4. Confirma pago exitoso

### Test 3: Manejo de Errores
1. Usa tarjeta **4000 0000 0000 0002** (declinada)
2. Verifica que se muestre error apropiado
3. Verifica que el modal NO se cierre
4. Usuario puede reintentar con otra tarjeta

### Test 4: 3D Secure
1. Usa tarjeta **4000 0025 0000 3155**
2. Debería aparecer modal de autenticación
3. Haz clic en "Complete" o "Fail"
4. Verifica comportamiento correcto

---

## 📊 Verificaciones Importantes

### ✅ Checklist de Prueba

- [ ] El widget de dev helper de Stripe **NO** aparece
- [ ] Los errores de TypeScript están resueltos (0 errores)
- [ ] El modal de checkout se abre correctamente
- [ ] Los montos son correctos (280,000 o 420,000 PYG)
- [ ] Apple Pay / Google Pay aparecen si están disponibles
- [ ] Las tarjetas exitosas procesan correctamente
- [ ] Las tarjetas declinadas muestran error apropiado
- [ ] El modal se cierra al completar pago exitoso
- [ ] Los logs del backend no muestran errores
- [ ] El frontend no muestra errores en consola

---

## 🔍 Debugging

### Ver logs del Backend
```bash
# Los logs ya están visibles en la terminal donde corre el backend
# Busca líneas como:
✅ Payment Intent created: pi_xxxxx
   Status: requires_payment_method
   Amount: 280000 PYG
```

### Ver logs del Frontend
1. Abre DevTools (F12)
2. Ve a la pestaña "Console"
3. Busca errores de Stripe o de la aplicación

### Dashboard de Stripe
1. Abre: https://dashboard.stripe.com/test/payments
2. Verifica que los pagos de prueba aparezcan
3. Revisa el estado de cada transacción

---

## 🚨 Problemas Comunes

### "No se puede crear Payment Intent"
- ✅ Verifica que el backend esté corriendo (http://localhost:3000)
- ✅ Verifica las variables de entorno (.env)
- ✅ Verifica que STRIPE_SECRET_KEY esté configurada

### "Widget de dev helper aparece"
- ✅ Verifica que los estilos CSS se hayan aplicado
- ✅ Limpia caché del navegador (Ctrl+Shift+R)
- ✅ Reinicia el servidor de desarrollo

### "Apple Pay no aparece"
- ⚠️ Apple Pay requiere HTTPS en producción
- ⚠️ En desarrollo local, usa tarjetas normales
- ⚠️ Necesitas dispositivo Apple compatible

### "Errores de TypeScript"
- ✅ Ejecuta: `npm run build`
- ✅ Si hay errores, revisa `src/components/checkout/StripeCheckoutModal.tsx`
- ✅ Todos los errores deberían estar resueltos

---

## 📚 Recursos

- [Stripe Testing Docs](https://stripe.com/docs/testing)
- [Test Cards](https://stripe.com/docs/testing#cards)
- [Payment Element](https://stripe.com/docs/payments/payment-element)
- [3D Secure Testing](https://stripe.com/docs/testing#regulatory-cards)

---

## 🎉 Resumen de Estado Actual

✅ **TypeScript**: 0 errores
✅ **Build**: Exitoso
✅ **Backend**: Funcionando en http://localhost:3000
✅ **Frontend**: Funcionando en http://localhost:8080
✅ **Payment Intents**: Creándose correctamente
✅ **Widget de Dev Helper**: Oculto con CSS

**Todo está listo para probar! 🚀**
