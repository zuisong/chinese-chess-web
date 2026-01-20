/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("game");

if (root instanceof HTMLElement) {
  render(() => <App />, root);
}
