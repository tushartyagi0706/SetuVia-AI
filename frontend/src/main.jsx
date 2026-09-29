import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { TripProvider } from "./context/TripContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { HostProvider } from "./context/HostContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <TripProvider>
          <HostProvider>
            <App />
          </HostProvider>
        </TripProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
