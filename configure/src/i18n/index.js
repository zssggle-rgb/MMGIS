import { initReactI18next } from "react-i18next";
import { createI18n } from "./generated/engine";
import { browserLocale } from "./generated/locale";
import { createLocaleController } from "./generated/controller";
import { useUiTranslation } from "./generated/browser";
import resources from "./generated/resources.json";

const { instance, ready } = createI18n(resources, browserLocale(window), [initReactI18next]);
export const i18n = instance;
export const localeReady = ready.then(() => createLocaleController(instance, window, {
  rootPath: window.mmgisglobal?.ROOT_PATH || "",
}));

export function useMetadataText() {
  return useUiTranslation("metadata", instance).t;
}

export function switchLocale(locale) {
  return localeReady.then((controller) => controller.switchLanguage(locale));
}
