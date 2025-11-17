# NOCTE ® - Lentes Rojos Anti-Luz Azul

Landing page para NOCTE, lentes rojos que bloquean la luz azul para mejorar la calidad del sueño.

## Tecnologías

Este proyecto está construido con:

- **Vite** - Build tool
- **React 18** - Framework UI
- **TypeScript** - Type safety
- **shadcn-ui** - Componentes UI (Radix UI primitives)
- **Tailwind CSS** - Styling
- **Framer Motion** - Animaciones
- **React Router DOM** - Routing
- **TanStack Query** - State management

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:8080)
npm run dev

# Build de producción
npm run build

# Build de desarrollo
npm run build:dev

# Linting
npm run lint

# Preview del build
npm run preview
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes de negocio
│   ├── ui/             # Componentes shadcn-ui
│   ├── HeroSection.tsx
│   ├── ProductGallery.tsx
│   ├── BenefitsSection.tsx
│   └── ...
├── pages/              # Páginas
│   ├── Index.tsx
│   └── NotFound.tsx
├── lib/                # Utilidades
│   └── utils.ts
└── main.tsx           # Entry point

```

## Alias de Importación

El proyecto usa alias `@/` que resuelve a `src/`:

```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

## Sistema de Diseño

- **Colores**: Tema oscuro con acento rojo (#EF4444) y dorado (#D4AF37)
- **Tipografía**: Line height 1.6 para texto, 1.2 para títulos
- **Animaciones**: Smooth transitions, máximo 600ms
- **Iconos**: Heroicons (@heroicons/react)

## Desarrollo

El servidor de desarrollo corre en el puerto 8080. Todos los cambios se recargan automáticamente.

---

**Desarrollado por Bright Idea ® Todos los Derechos Reservados**
