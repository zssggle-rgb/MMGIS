const { createI18n } = require('../../API/i18n/generated/engine')
const { browserLocale } = require('../../API/i18n/generated/locale')
const { createLocaleController } = require('../../API/i18n/generated/controller')
const resources = require('../../API/i18n/generated/legacy-resources.json')

const locale = browserLocale(window)
const { instance, ready } = createI18n(resources, locale)
window.MMGISI18n = {
    i18n: instance,
    ready: ready.then(() => createLocaleController(instance, window, {
        rootPath: document.documentElement.dataset.mmgisRoot || '',
        externalRootPath: document.documentElement.dataset.mmgisExternalRoot || '',
    })),
}
