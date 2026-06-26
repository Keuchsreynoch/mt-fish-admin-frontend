import { computed, ref } from "vue";
import { frontendMessages, type FrontendLocale } from "./messages";

const STORAGE_KEY = "lang";
const localeState = ref<FrontendLocale>("en");
const initialized = ref(false);

function getValue(source: unknown, path: string): string {
  const value = path.split(".").reduce<unknown>((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, source);

  return typeof value === "string" ? value : path;
}

function normalizeLocale(value: string | null | undefined): FrontendLocale {
  return value === "km" || value === "kh" ? "km" : "en";
}

export type { FrontendLocale } from "./messages";

export function useFrontendI18n() {
  if (import.meta.client && !initialized.value) {
    localeState.value = normalizeLocale(localStorage.getItem(STORAGE_KEY));
    initialized.value = true;
  }

  const locale = computed(() => localeState.value);

  function setLocale(nextLocale: FrontendLocale) {
    localeState.value = nextLocale;
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, nextLocale);
    }
  }

  function t(key: string, params?: Record<string, string | number>) {
    let text = getValue(frontendMessages[localeState.value], key);

    if (params) {
      for (const [paramKey, paramValue] of Object.entries(params)) {
        text = text.replaceAll(`{${paramKey}}`, String(paramValue));
      }
    }

    return text;
  }

  return {
    locale,
    setLocale,
    t,
  };
}
