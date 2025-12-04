import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Meta Pixel is initialized in index.html for faster loading
// No need to initialize again here to avoid duplicate PageView events

createRoot(document.getElementById("root")!).render(<App />);
