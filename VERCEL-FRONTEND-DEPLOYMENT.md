# Desplegar Frontend en Vercel

## 🚀 Paso a Paso

### 1. Deploy en Vercel

1. Ve a: **https://vercel.com/new**
2. Conecta tu cuenta de GitHub
3. Importa el repositorio: **`T0MGL/n0ct3`**
4. **Root Directory**: Déjalo en la raíz (`.` o vacío) - NO selecciones ninguna carpeta
5. **Framework Preset**: Vite
6. Click **"Deploy"**

---

### 2. Configurar Variables de Entorno en Vercel

**⚠️ IMPORTANTE**: Vercel NO lee automáticamente el archivo `.env.production`. Debes configurar las variables manualmente.

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables** y agrega:

#### Variables Requeridas:

```bash
# Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY
pk_test_51SS887Py3og5sQcdv7zagRWw6HI7OIR05nk7MFaqA2BHXcKZw56mx8ED1TDbx1zyrQxoxe4d7qGNkjoVljl7JoAg00TyeDjtEd

# Backend API URL (primero deployea el backend!)
VITE_API_URL
https://api.nocte.studio

# Domain
VITE_DOMAIN
https://nocte.studio

# Meta Pixel ID
VITE_META_PIXEL_ID
668376099194978

# Product Configuration
VITE_PRODUCT_PRICE
280000

VITE_PRODUCT_CURRENCY
pyg

VITE_PRODUCT_NAME
"NOCTE® Red-Tinted Glasses"

# Environment
VITE_ENV
production
```

#### Cómo agregar cada variable:

1. Click en **"Add New"**
2. **Name**: `VITE_STRIPE_PUBLISHABLE_KEY`
3. **Value**: `pk_test_51SS887Py3og5sQcd...`
4. **Environment**: Selecciona **Production**, **Preview**, **Development**
5. Click **"Save"**
6. Repite para cada variable

---

### 3. Redeploy

Después de agregar las variables:

1. Ve a **Deployments**
2. Click en el último deployment → tres puntos
3. Click **"Redeploy"**

---

## 🔗 Configurar Dominio Personalizado

### Opción A: Dominio propio (nocte.studio)

1. Ve a **Settings** → **Domains**
2. Agrega: `nocte.studio`
3. Configura los DNS en tu proveedor:

```
Type: A
Name: @
Value: 76.76.19.19

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

4. Espera propagación (5-60 minutos)

### Opción B: Subdominio de Vercel (gratis)

Tu sitio estará en: `https://n0ct3.vercel.app` o similar.

---

## ✅ Verificar Deploy

1. Abre tu URL de Vercel
2. Intenta hacer un purchase
3. Verifica en la consola del navegador (F12):
   - ❌ Si ves: `"Stripe is not configured"` → Las variables NO están configuradas
   - ✅ Si el checkout se abre → Todo está bien!

---

## 🔄 Deploy del Backend Primero

**⚠️ IMPORTANTE**: Antes de deployar el frontend, necesitas:

1. **Deployar el backend** siguiendo `nocte-backend/VERCEL-DEPLOYMENT.md`
2. **Obtener la URL del backend** (ej: `https://nocte-backend-xxx.vercel.app`)
3. **Actualizar** `VITE_API_URL` con esa URL

---

## 🐛 Troubleshooting

### Error: "Stripe is not configured. Please check your API keys."

**Causa**: Las variables de entorno NO están configuradas en Vercel.

**Solución**:
1. Ve a **Settings** → **Environment Variables**
2. Verifica que `VITE_STRIPE_PUBLISHABLE_KEY` exista
3. Debe empezar con `pk_test_...` o `pk_live_...`
4. Redeploy el proyecto

### Error: "Failed to fetch" o "Network Error"

**Causa**: El backend no está corriendo o la URL es incorrecta.

**Solución**:
1. Verifica que el backend esté deployado
2. Verifica que `VITE_API_URL` tenga la URL correcta
3. Prueba el backend: `https://tu-backend.vercel.app/api/health`

### Variables no aparecen en el build

**Causa**: Olvidaste poner el prefijo `VITE_` en las variables.

**Solución**: Todas las variables de entorno en Vite deben empezar con `VITE_`.

### Cambié las variables pero no se aplican

**Solución**: Debes hacer **Redeploy** después de cambiar variables:
1. Deployments → último deploy → tres puntos
2. "Redeploy"

---

## 🎯 Checklist de Deploy

- [ ] Backend deployado en Vercel
- [ ] Frontend deployado en Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` configurada
- [ ] `VITE_API_URL` apunta al backend en Vercel
- [ ] Redeploy realizado después de agregar variables
- [ ] Probado el checkout en producción
- [ ] Dominio personalizado configurado (opcional)

---

## 🔐 Producción vs Test Mode

### Actualmente estás en TEST MODE (recomendado para empezar)

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # Test mode
```

**Ventajas**:
- ✅ No se cobran pagos reales
- ✅ Puedes probar con tarjetas de prueba
- ✅ No necesitas activación de Stripe

**Para probar pagos**, usa estas tarjetas de prueba:
- **Éxito**: `4242 4242 4242 4242`
- **Requiere 3D Secure**: `4000 0027 6000 3184`
- **Falla**: `4000 0000 0000 0002`

Cualquier CVC (3 dígitos) y fecha futura funcionan.

### Cuando estés listo para cobrar de verdad (LIVE MODE)

1. Activa tu cuenta en Stripe: https://dashboard.stripe.com/account/onboarding
2. Obtén las LIVE keys: https://dashboard.stripe.com/apikeys
3. Actualiza en Vercel:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   ```
4. Actualiza el backend también con `sk_live_...`
5. Redeploy ambos proyectos

---

## 📊 Monitoreo Post-Deploy

### En Vercel:
- **Analytics**: Visitas y performance
- **Logs**: Errores del build/runtime
- **Speed Insights**: Core Web Vitals

### En Stripe:
- **Dashboard**: Pagos exitosos/fallidos
- **Logs**: API calls y webhooks
- **Customers**: Base de datos de clientes

---

**¿Listo para deploy?** 🚀

```bash
# 1. Commit final
git add .
git commit -m "Ready for production deployment"
git push

# 2. Ve a Vercel
https://vercel.com/new

# 3. Import y deploy!
```
