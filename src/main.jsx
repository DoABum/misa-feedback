import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// localStorage polyfill for window.storage
if (!window.storage) {
  window.storage = {
    get: async (key) => {
      const value = localStorage.getItem(key);
      return value ? { value } : null;
    },
    set: async (key, value) => {
      localStorage.setItem(key, value);
    },
  };
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
