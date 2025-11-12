# Guía de Deployment en Vercel

## Pre-requisitos

1. Cuenta de Vercel (vercel.com)
2. Proyecto linkeado a GitHub (recomendado para auto-deploys)
3. Variables de entorno configuradas

## Pasos para Deploy

### 1. Preparación del Proyecto

El proyecto ya está listo para producción con:
- ✅ Build optimizado con code splitting
- ✅ Minificación con Terser (console.log removidos en producción)
- ✅ Headers de seguridad configurados (vercel.json)
- ✅ SEO tags completos
- ✅ PWA manifest configurado
- ✅ Sin vulnerabilidades de seguridad

### 2. Conectar a Vercel

**Opción A: Desde GitHub (Recomendado)**
1. Push tu código a GitHub
2. Ve a vercel.com → New Project
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente el framework (Vite)

**Opción B: Desde CLI**
```bash
npm install -g vercel
vercel
```

### 3. Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables, añade:

```env
VITE_DOMAIN=https://nocte.studio
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
VITE_API_URL=https://api.nocte.studio
VITE_PRODUCT_PRICE=280000
VITE_PRODUCT_CURRENCY=pyg
VITE_PRODUCT_NAME=NOCTE® Red-Tinted Glasses
VITE_META_PIXEL_ID=668376099194978
VITE_ENV=production
```

**IMPORTANTE:**
- Usa las keys de **producción** de Stripe (pk_live_...)
- Cambia `VITE_API_URL` a tu backend real en producción
- El backend también debe estar deployado (Render, Railway, Vercel Functions, etc.)

### 4. Build Settings

Vercel detectará automáticamente:
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

Si necesitas cambiarlos, ve a Settings → Build & Development Settings

### 5. Deploy

1. Click "Deploy"
2. Espera a que el build termine (2-3 minutos)
3. Vercel te dará una URL de preview
4. Si todo funciona, asigna tu dominio custom

## Configuración del Dominio

### Dominio Custom (nocte.studio)

1. Ve a Settings → Domains
2. Añade `nocte.studio` y `www.nocte.studio`
3. Configura los DNS records en tu proveedor:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

### SSL/HTTPS

Vercel proporciona SSL automático (Let's Encrypt). Se configura solo.

## Post-Deployment Checklist

### Verificaciones Obligatorias

- [ ] El sitio carga correctamente en la URL de Vercel
- [ ] Las imágenes se ven correctamente
- [ ] El formulario de checkout funciona
- [ ] La integración con Stripe funciona (hacer un pago de prueba)
- [ ] El backend recibe las órdenes correctamente
- [ ] Meta Pixel está trackeando (verifica en Facebook Events Manager)
- [ ] El sitio es responsive (probar en móvil)
- [ ] Los links funcionan
- [ ] No hay errores 404
- [ ] El favicon aparece
- [ ] Las meta tags de SEO están presentes (ver source)

### Testing en Producción

1. **Probar checkout completo:**
   - Click en "Comprar ahora"
   - Completar selección de cantidad
   - Probar pago con Stripe (usa tarjeta de test)
   - Verificar que llega la orden al backend/n8n

2. **Verificar Analytics:**
   - Abrir Facebook Events Manager
   - Verificar que se trackean eventos (PageView, InitiateCheckout, Purchase)

3. **Test de Performance:**
   - Usar Google PageSpeed Insights: https://pagespeed.web.dev/
   - Objetivo: >90 en mobile, >95 en desktop

4. **Test SEO:**
   - Ver el source del HTML (click derecho → Ver código fuente)
   - Verificar que todas las meta tags están presentes
   - Usar herramienta: https://www.opengraph.xyz/

## Troubleshooting

### El build falla

**Error: "Module not found"**
- Verifica que todas las dependencias estén en `package.json`
- Run `npm install` localmente primero

**Error: Variables de entorno**
- Asegúrate de que todas las variables `VITE_*` estén configuradas en Vercel
- Las variables deben empezar con `VITE_` para ser expuestas al frontend

### El sitio carga pero hay errores

**Error: "Stripe not configured"**
- Verifica `VITE_STRIPE_PUBLISHABLE_KEY` en environment variables
- Debe ser la key de producción (pk_live_...)

**Error: "Failed to fetch"**
- Verifica `VITE_API_URL` apunta al backend correcto
- Verifica que el backend está corriendo y accesible
- Verifica CORS en el backend

### Las imágenes no cargan

- Verifica que las imágenes existen en `/src/assets/`
- Verifica que el build incluyó las imágenes en `/dist/assets/`
- El build debe mostrar las imágenes en el output

## Optimizaciones Adicionales

### Performance

El bundle actual:
- index.js: ~220KB (gzipped: 61KB)
- react-vendor: ~155KB (gzipped: 50KB)
- ui-vendor: ~163KB (gzipped: 52KB)
- Total: ~538KB → ~164KB gzipped

Esto es **excelente** para un sitio con Stripe + Framer Motion + Radix UI.

### Caching

Vercel cachea automáticamente:
- Static assets: 1 año
- HTML: Sin cache (para actualizaciones instantáneas)
- API routes: Configurable

### CDN

Vercel usa su Edge Network global automáticamente. Tu sitio se sirve desde el servidor más cercano al usuario.

## Rollback

Si necesitas volver a una versión anterior:
1. Ve a Deployments en Vercel Dashboard
2. Click en el deployment anterior
3. Click en "Promote to Production"

## Monitoreo

### Analytics de Vercel
- Ve a Analytics tab para ver:
  - Visitors
  - Page views
  - Top pages
  - Real User Monitoring (Web Vitals)

### Meta Pixel
- Facebook Events Manager para conversiones y ROAS

## Soporte

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- Stripe Docs: https://stripe.com/docs

## Notas Finales

**Backend separado:** Esta app es solo el frontend. Necesitas deployar también el backend (nocte-backend) que maneja:
- Payment intents de Stripe
- Webhook de n8n
- Geocoding

**Costo:** Vercel es gratis para hobbies. Para producción con dominio custom, considera el plan Pro ($20/mes) para mejor performance y analytics.
