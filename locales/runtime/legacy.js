const { createI18n } = require('../../API/i18n/generated/engine')
const { browserLocale } = require('../../API/i18n/generated/locale')
const { createLocaleController } = require('../../API/i18n/generated/controller')
const resources = require('../../API/i18n/generated/legacy-resources.json')
const { createFeedback } = require('../../API/i18n/generated/feedback')

const locale = browserLocale(window)
const { instance, ready } = createI18n(resources, locale)
window.MMGISI18n = {
    i18n: instance,
    ready: ready.then(() => createLocaleController(instance, window, {
        rootPath: document.documentElement.dataset.mmgisRoot || '',
        externalRootPath: document.documentElement.dataset.mmgisExternalRoot || '',
    })),
}
// These messages are assigned with textContent by authentication pages.
const feedback = createFeedback(resources, (key, params) => instance.t(key, { ...params, interpolation: { escapeValue: false } }))
const authKeys = new Map(Object.entries(resources.en.auth || {}).map(([key, text]) => [text, key]))
window.MMGISAuth = {
    text: (text) => authKeys.has(text) ? instance.t(authKeys.get(text), { ns: 'auth' }) : text,
    message: feedback.message,
    link: (path) => {
        const next = new URL(path, window.location.href)
        next.searchParams.set('lang', instance.language)
        return next.href
    },
    switchLanguage: (locale) => window.MMGISI18n.ready.then((controller) => controller.switchLanguage(locale)),
}
window.MMGISI18n.ready.then((controller) => controller.subscribe((next) => {
    // Pug labels are rendered on the server. Reload after the controller's
    // queued operation has persisted the new URL and cookie, including when
    // another tab changed the language.
    if (next !== locale) setTimeout(() => window.location.reload(), 0)
}))
