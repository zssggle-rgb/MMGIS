import { initReactI18next } from 'react-i18next'
import { createI18n } from './generated/engine'
import { browserLocale } from './generated/locale'
import { createLocaleController } from './generated/controller'
import { useUiTranslation } from './generated/browser'
import resources from './generated/resources.json'

const { instance, ready } = createI18n(resources, browserLocale(window), [initReactI18next])
export const i18n = instance
export const localeReady = ready.then(() => createLocaleController(instance, window, {
    rootPath: window.mmgisglobal?.ROOT_PATH || '',
}))

export function useMapText() {
    return useUiTranslation('map', instance).t
}

// Legacy markup retains escaped interpolation. React callers use useMapText,
// which relies on React's own text escaping instead of duplicating entities.
export function mapText(key, parameters) {
    return instance.t(key, { ...parameters, ns: 'map' })
}

export function switchLocale(locale) {
    return localeReady.then((controller) => controller.switchLanguage(locale))
}
