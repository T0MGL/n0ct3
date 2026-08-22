import { createRoot } from "react-dom/client";
import { Cert } from "./pages/Cert";
import "./index.css";

// Entry propio de /cert. No monta el SPA de la landing a proposito: alguien que
// escanea el QR de una tarjeta de garantia llega desde el celular y con datos
// moviles, y esta pagina no necesita router, checkout, pixel ni animaciones.
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found. Make sure there is a <div id='root'></div> in cert.html");
}
createRoot(rootElement).render(<Cert />);
