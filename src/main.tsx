import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CartApp from "./CartApp";
import "./standalone.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="remote-page">
      <CartApp />
    </main>
  </StrictMode>
);
