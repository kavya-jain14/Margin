import React from "react";
import { createRoot } from "react-dom/client";
import MarginApp from "./components/margin/MarginApp";
import "./app/globals.css";

createRoot(document.getElementById("root")!).render(<React.StrictMode><MarginApp/></React.StrictMode>);
