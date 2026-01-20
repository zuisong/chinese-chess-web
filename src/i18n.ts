import { createEffect, createSignal } from "solid-js";

export type Locale = "zh-CN" | "zh-TW" | "ja";

// Load from localStorage or default to zh-CN
const savedLocale = localStorage.getItem("locale") as Locale | null;
export const [locale, setLocale] = createSignal<Locale>(savedLocale || "zh-CN");

// Save to localStorage when changed
// We need to create this effect in a root or it might not track correctly outside component tree?
// Actually top-level createEffect works in Solid client-side.
createEffect(() => {
  localStorage.setItem("locale", locale());
});
