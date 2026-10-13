const { normalizeLocale, normalizeRootPath, withLocale, localeCookie } = require('./locale')
const STORAGE_KEY = 'MMGISLocaleEvent'

function access(operation) {
    try {
        return operation()
    } catch (error) {
        return undefined // Browsers may block cookies/history/storage; keep in-memory language usable.
    }
}

function parseEvent(value) {
    try {
        const event = JSON.parse(value)
        if (!event || !normalizeLocale(event.locale) || !Number.isSafeInteger(event.revision) || event.revision < 0 ||
            typeof event.source !== 'string' || !event.source || event.source.length > 128) return null
        return event
    } catch (error) {
        return null
    }
}

function newer(a, b) {
    return a.revision > b.revision || (a.revision === b.revision && a.source > b.source)
}

function createLocaleController(instance, environment, { rootPath = '', externalRootPath = '' } = {}) {
    const cookiePath = normalizeRootPath(rootPath, externalRootPath)
    const source = access(() => environment.crypto.randomUUID()) || `${Date.now()}-${Math.random()}`
    let latest = parseEvent(access(() => environment.localStorage.getItem(STORAGE_KEY))) || { revision: 0, source: '' }
    let disposed = false
    let pending = Promise.resolve()
    const subscribers = new Set()

    function notify(locale) {
        access(() => { environment.document.documentElement.lang = locale })
        subscribers.forEach((listener) => {
            try {
                listener(locale)
            } catch (error) {
                access(() => environment.console.error('Unable to update a UI language subscriber.'))
            }
        })
    }

    function persist(locale, event, broadcast) {
        access(() => environment.history.replaceState(environment.history.state, '', withLocale(environment.location.href, locale)))
        access(() => { environment.document.cookie = localeCookie(locale, cookiePath, environment.location.protocol === 'https:') })
        if (broadcast) access(() => environment.localStorage.setItem(STORAGE_KEY, JSON.stringify(event)))
    }

    function enqueue(event, broadcast) {
        const operation = pending.catch(() => undefined).then(async () => {
            if (disposed || (!broadcast && !newer(event, latest))) return false
            if (broadcast) {
                const revision = Math.max(latest.revision, Date.now()) + 1
                if (!Number.isSafeInteger(revision)) throw new Error('UI language revision limit reached.')
                event = { ...event, revision, source }
            }
            await instance.changeLanguage(event.locale)
            if (disposed) return false
            latest = event
            persist(event.locale, event, broadcast)
            return true
        })
        pending = operation
        return operation
    }

    function switchLanguage(locale) {
        if (!normalizeLocale(locale)) return Promise.reject(new Error('Unsupported UI language.'))
        return enqueue({ locale }, true)
    }

    function onStorage(event) {
        if (event.key !== STORAGE_KEY) return
        const incoming = parseEvent(event.newValue)
        if (incoming && incoming.source !== source) enqueue(incoming, false).catch((error) => {
            access(() => environment.console.error('Unable to synchronize UI language.', error.message))
        })
    }

    instance.on('languageChanged', notify)
    environment.addEventListener('storage', onStorage)
    notify(instance.language)
    return {
        switchLanguage,
        subscribe(listener) {
            if (disposed || typeof listener !== 'function') throw new Error('Invalid UI language subscription.')
            listener(instance.language)
            subscribers.add(listener)
            return () => subscribers.delete(listener)
        },
        dispose() {
            disposed = true
            subscribers.clear()
            instance.off('languageChanged', notify)
            environment.removeEventListener('storage', onStorage)
        },
    }
}

module.exports = { STORAGE_KEY, parseEvent, newer, createLocaleController }
