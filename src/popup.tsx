import React from "react";
import ReactDOM from "react-dom/client";
import { PopupApp } from "./components/PopupApp";

const rootElement = document.getElementById("root")!;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>
);
