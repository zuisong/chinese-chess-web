import { atom } from "nanostores";

export type Locale = "zh-CN" | "zh-TW" | "ja";

// Load from localStorage or default to zh-CN
const savedLocale = localStorage.getItem("locale") as Locale | null;
export const locale = atom<Locale>(savedLocale || "zh-CN");

// Save to localStorage when changed
locale.subscribe((value) => {
    localStorage.setItem("locale", value);
});
