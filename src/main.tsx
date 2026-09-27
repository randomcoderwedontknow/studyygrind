import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource-variable/manrope";
import "@fontsource-variable/inter";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/pages.css";
import "./styles/motion.css";
import "./styles/web.css";
import "./styles/android.css";
import "./styles/liquid.css";
import { hideSplash, isAndroid, isNative } from "./lib/native";

if (isNative) document.body.classList.add("platform-native");
if (isAndroid) document.body.classList.add("platform-android");

const container = document.getElementById("root")!;
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const fallback = window.setTimeout(() => {
  void hideSplash();
}, 2500);

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.clearTimeout(fallback);
    void hideSplash();
  });
});
