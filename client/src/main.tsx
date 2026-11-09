import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setDemoMediaBase } from "../../shared/model";
import { basePath } from "./base";
import { SiteProvider } from "./store";
import { MusicProvider } from "./components/Music";
import App from "./App";
import "./styles.css";
import "./themes.css";
import "./themes/retro.css";
setDemoMediaBase(basePath);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SiteProvider>
      <MusicProvider>
        <App />
      </MusicProvider>
    </SiteProvider>
  </StrictMode>,
);
