# Desplegar Backend en Vercel

## 🚀 Opción 1: Deploy desde Vercel Dashboard (Recomendado)

### 1. Preparar el proyecto

Ya está listo! Este directorio (`nocte-backend/`) contiene:
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `server.js` - Servidor Express
- ✅ `.env.example` - Template de variables de entorno
- ✅ `.gitignore` - Protege tu `.env`

### 2. Subir a GitHub (si aún no lo hiciste)

```bash
cd ..
git add nocte-backend/
git commit -m "Add backend with Vercel configuration"
git push
```

### 3. Deploy en Vercel

1. Ve a: https://vercel.com/new
2. Conecta tu cuenta de GitHub
3. Importa el repositorio: `T0MGL/n0ct3`
4. **IMPORTANTE**: En "Root Directory", selecciona `nocte-backend`
5. Click en "Deploy"

### 4. Configurar Variables de Entorno

Una vez desplegado:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega estas variables:

```
STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
NODE_ENV=production
CORS_ORIGIN=https://nocte.studio
```

**⚠️ IMPORTANTE:**
- Para producción usa `sk_live_...` (no `sk_test_...`)
- Obtén las keys en: https://dashboard.stripe.com/apikeys

### 5. Redeploy

Después de agregar las variables:
- Deployments → tres puntos → Redeploy

---

## 🚀 Opción 2: Deploy desde CLI

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Deploy

```bash
cd nocte-backend
vercel
```

Sigue las instrucciones:
- Set up and deploy? `Y`
- Which scope? (tu cuenta)
- Link to existing project? `N`
- Project name: `nocte-backend` o el que prefieras
- In which directory? `./`
- Override settings? `N`

### 4. Configurar Variables de Entorno

```bash
vercel env add STRIPE_SECRET_KEY
# Pega tu sk_live_... key

vercel env add STRIPE_WEBHOOK_SECRET
# Pega tu whsec_... secret

vercel env add NODE_ENV
# Escribe: production

vercel env add CORS_ORIGIN
# Escribe: https://nocte.studio
```

### 5. Deploy a Producción

```bash
vercel --prod
```

---

## ✅ Verificar el Deploy

Tu backend estará disponible en:
```
https://nocte-backend-xxx.vercel.app
```

Prueba el health check:
```
https://nocte-backend-xxx.vercel.app/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2025-11-12T...",
  "stripe_configured": true
}
```

---

## 🔗 Conectar Frontend con Backend

### 1. Actualizar .env.production del Frontend

Edita `/Users/gastonlopez/Documents/Code/NOCTE ®/.env.production`:

```bash
# Backend API URL (Production)
VITE_API_URL=https://nocte-backend-xxx.vercel.app
```

Reemplaza `nocte-backend-xxx.vercel.app` con tu URL real de Vercel.

### 2. Rebuild y Deploy del Frontend

```bash
cd ..
npm run build
# Luego deploy tu frontend a Vercel también
```

---

## 🔒 Configurar Webhooks de Stripe

1. Ve a: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://nocte-backend-xxx.vercel.app/api/webhook`
4. Eventos a escuchar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
5. Guarda el **Signing secret** (empieza con `whsec_...`)
6. Agrégalo como variable de entorno en Vercel:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_tu_secret_aqui
   ```

---

## 🐛 Troubleshooting

### Error: "Missing Stripe Secret Key"

**Solución**: Verifica que agregaste las variables de entorno en Vercel:
- Settings → Environment Variables
- Debe haber `STRIPE_SECRET_KEY` con tu `sk_live_...`

### Error: CORS

**Solución**: Agrega tu dominio en `CORS_ORIGIN`:
```
CORS_ORIGIN=https://nocte.studio,https://www.nocte.studio
```

### Error: 404 en /api/health

**Solución**: Verifica que `vercel.json` tenga las rutas correctas.

### Backend no actualiza

**Solución**: Force redeploy:
1. Vercel Dashboard → tu proyecto
2. Deployments → último deploy → tres puntos
3. "Redeploy"

---

## 📊 Monitoreo

En Vercel puedes ver:
- **Logs**: Runtime logs de cada request
- **Analytics**: Uso y performance
- **Deployments**: Historial de deploys

---

## 🔐 Seguridad Checklist

- ✅ `.env` en `.gitignore` (no se commitea)
- ✅ Variables de entorno en Vercel (no en código)
- ✅ CORS configurado solo para tu dominio
- ✅ Webhook signature verification habilitado
- ✅ Usando `sk_live_...` en producción (no `sk_test_...`)
- ✅ HTTPS habilitado (Vercel lo hace automáticamente)

---

## 💰 Costos

- **Vercel Free Tier**:
  - 100GB bandwidth
  - Suficiente para empezar
  - Escala automáticamente

- **Si necesitas más**:
  - Pro plan: $20/mes
  - Bandwidth ilimitado
  - Más funciones

---

**¿Listo para deploy?** 🚀

1. `git add . && git commit -m "Backend ready for Vercel"`
2. `git push`
3. Ve a https://vercel.com/new
4. Importa el repo y selecciona `nocte-backend/` como Root Directory
5. Deploy! 🎉
