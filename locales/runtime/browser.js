import { useCallback } from 'react'
import { initReactI18next, useTranslation } from 'react-i18next'
import { createI18n } from './engine'
import { browserLocale } from './locale'
import { createLocaleController } from './controller'
import resources from './resources.json'

export async function createBrowserRuntime(environment, options = {}) {
    const locale = browserLocale(environment)
    const { instance, ready } = createI18n(resources, locale, [initReactI18next])
    await ready
    return { i18n: instance, controller: createLocaleController(instance, environment, options) }
}

// Only React text rendering disables interpolation escaping. Legacy callers
// retain the engine's escaped default and must not insert untrusted raw HTML.
export function useUiTranslation(namespace, instance) {
    const translation = useTranslation(namespace, { i18n: instance })
    const t = useCallback((key, options) => translation.t(key, {
        ...options,
        interpolation: { escapeValue: false },
    }), [translation.t])
    return { ...translation, t }
}
