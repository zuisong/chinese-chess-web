/* @refresh reload */
import { render } from "@solidjs/web";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("game");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute is misspelled?",
  );
}

render(() => <App />, root!);
