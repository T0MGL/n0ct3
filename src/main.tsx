import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initMetaPixel, trackPageView } from "./lib/meta-pixel";

// Initialize Meta Pixel for conversion tracking
const metaPixelId = import.meta.env.VITE_META_PIXEL_ID;
if (metaPixelId) {
  initMetaPixel(metaPixelId);
  trackPageView();
} else {
  console.warn('⚠️ Meta Pixel ID not found. Set VITE_META_PIXEL_ID in .env to enable conversion tracking.');
}

createRoot(document.getElementById("root")!).render(<App />);
