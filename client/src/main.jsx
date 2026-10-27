import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "./index.css";
import App from "./App.jsx";
import { EditorProvider } from "./context/EditorContext";

loader.config({ monaco });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <EditorProvider>
      <App />
    </EditorProvider>
  </StrictMode>
);