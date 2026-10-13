const { createInstance } = require('i18next')
const { normalizeLocale, SUPPORTED_LOCALES, DEFAULT_LOCALE } = require('./locale')

function createI18n(resources, locale = DEFAULT_LOCALE, plugins = []) {
    if (!normalizeLocale(locale)) throw new Error('Unsupported UI language.')
    const instance = createInstance()
    plugins.forEach((plugin) => instance.use(plugin))
    const ready = instance.init({
        resources,
        lng: locale,
        supportedLngs: SUPPORTED_LOCALES,
        fallbackLng: 'en',
        load: 'currentOnly',
        ns: Object.keys(resources.en),
        defaultNS: 'common',
        keySeparator: false,
        initImmediate: false,
        interpolation: { escapeValue: true },
        react: { useSuspense: false, bindI18n: 'languageChanged' },
    })
    return { instance, ready }
}

module.exports = { createI18n }
