import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { captureFbclid } from "./lib/meta-matching";

// Meta Pixel is initialized in index.html for faster loading
// Capture fbclid into _fbc cookie before React mounts so every subsequent
// event that reads getFbc() sees it, including Purchase.
captureFbclid();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure there is a <div id='root'></div> in your HTML.");
}
createRoot(rootElement).render(<App />);
