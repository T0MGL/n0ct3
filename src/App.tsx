import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PoliticaPrivacidad from "./pages/PoliticaPrivacidad";
import TerminosCondiciones from "./pages/TerminosCondiciones";
import { RouteTracker } from "@/components/RouteTracker";
import { useDisableDevTools } from "@/hooks/useDisableDevTools";
import { VariantProvider } from "@/lib/variant-context";

// /cert se sirve desde su propio entry (cert.html). Esta ruta es el respaldo
// para que la URL impresa en las tarjetas de garantia no caiga en el 404 si el
// rewrite de Vercel se llega a tocar.
const Cert = lazy(() => import("./pages/Cert"));

// Optimized QueryClient configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce re-fetches and background updates for landing page
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      retry: 1,
    },
  },
});

const App = () => {
  // Disable right-click and DevTools shortcuts
  useDisableDevTools();

  return (
    <QueryClientProvider client={queryClient}>
      <VariantProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <RouteTracker />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/politica-de-privacidad" element={<PoliticaPrivacidad />} />
              <Route path="/terminos-y-condiciones" element={<TerminosCondiciones />} />
              <Route
                path="/cert"
                element={
                  <Suspense fallback={<div className="min-h-[100dvh] bg-background" />}>
                    <Cert />
                  </Suspense>
                }
              />
              {/* Las formas largas redirigen con 301 desde vercel.json. Estas dos
                  rutas son el mismo respaldo que /cert: la URL corta va impresa
                  en tarjetas y no puede depender de una sola capa. */}
              <Route path="/certificados" element={<Navigate to="/cert" replace />} />
              <Route path="/certificates" element={<Navigate to="/cert" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </VariantProvider>
    </QueryClientProvider>
  );
};

export default App;
