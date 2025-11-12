# NOCTE Production Guide

## Quick Start for nocte.studio

### 1. Environment Setup

Copy `.env.production` and update these critical values:

```bash
# REQUIRED: Replace with your production Stripe key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE

# REQUIRED: Update to your backend URL
VITE_API_URL=https://api.nocte.studio
```

### 2. Deploy to Vercel

```bash
# Option A: Push to GitHub (recommended)
git add .
git commit -m "Production ready for nocte.studio"
git push origin main

# Option B: Deploy via CLI
vercel --prod
```

### 3. Configure Domain in Vercel

1. Go to Vercel Dashboard → Settings → Domains
2. Add `nocte.studio`
3. Configure DNS at your domain provider:
   ```
   A Record:     @ → 76.76.21.21
   CNAME Record: www → cname.vercel-dns.com
   ```

### 4. Set Environment Variables in Vercel

Go to Settings → Environment Variables and add:

```
VITE_DOMAIN=https://nocte.studio
VITE_META_PIXEL_ID=668376099194978
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
VITE_API_URL=https://api.nocte.studio
VITE_PRODUCT_PRICE=280000
VITE_PRODUCT_CURRENCY=pyg
VITE_PRODUCT_NAME=NOCTE® Red-Tinted Glasses
VITE_ENV=production
```

### 5. Verify Deployment

- [ ] Site loads: https://nocte.studio
- [ ] SSL certificate active (green lock)
- [ ] Meta Pixel tracking (check Events Manager)
- [ ] Stripe checkout works (test payment)
- [ ] Backend receives orders

## Files Updated for Production

### Domain References (nocte.com.py → nocte.studio)
- ✅ `index.html` - All meta tags and JSON-LD
- ✅ `public/sitemap.xml` - Sitemap URLs
- ✅ `public/robots.txt` - Sitemap reference
- ✅ `DEPLOYMENT.md` - Deployment guide

### Build Configuration
- ✅ `vite.config.ts` - Enhanced production optimizations
- ✅ `vercel.json` - Security headers and caching
- ✅ `.env.production` - Production environment template
- ✅ `.env.example` - Updated template

### Bundle Sizes (Production Build)
```
Total: ~556 KB → ~170 KB gzipped
- Main bundle: 224 KB → 62 KB
- React vendor: 153 KB → 50 KB  
- UI vendor: 166 KB → 53 KB
- Stripe vendor: 11 KB → 4 KB
- CSS: 76 KB → 13 KB
```

## Performance Targets

- **Lighthouse Score:** >90 (mobile), >95 (desktop)
- **LCP:** <2.5s
- **FID:** <100ms
- **CLS:** <0.1
- **TTFB:** <200ms

## Security Features

- [x] HTTPS enforced (HSTS)
- [x] XSS protection headers
- [x] Content sniffing prevention
- [x] Clickjacking prevention (X-Frame-Options)
- [x] Referrer policy configured
- [x] Permissions policy set

## Monitoring

### Vercel Analytics
Track Web Vitals, traffic, and performance in real-time.

### Meta Pixel Events
Monitor these conversions:
- PageView
- ViewContent
- InitiateCheckout
- AddToCart
- Purchase

## Important Notes

1. **Current .env has TEST Stripe key** - Update to production key before deploying
2. **Backend must be deployed** - Frontend needs working API
3. **DNS propagation** - Can take 24-48 hours
4. **Test thoroughly** - Run through complete checkout flow on production

## Support

- Issues: Check `PRODUCTION_CHECKLIST.md`
- Deployment: See `DEPLOYMENT.md`
- Vercel: https://vercel.com/docs
- Stripe: https://stripe.com/docs

---

**Status:** ✅ Production Ready for nocte.studio
**Last Updated:** 2025-11-12
