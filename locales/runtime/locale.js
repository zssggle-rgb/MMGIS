const SUPPORTED_LOCALES = ['en', 'zh-CN']
const DEFAULT_LOCALE = 'zh-CN'
const COOKIE_NAME = 'MMGISLocale'

function normalizeLocale(value) {
    return SUPPORTED_LOCALES.includes(value) ? value : null
}

function readLocaleCookie(cookie = '') {
    if (typeof cookie !== 'string') return null
    const entry = cookie.split(';').find((part) => part.trim().startsWith(COOKIE_NAME + '='))
    if (!entry) return null
    try {
        return normalizeLocale(decodeURIComponent(entry.trim().slice(COOKIE_NAME.length + 1)))
    } catch (error) {
        return null // A malformed cookie must not prevent the UI from starting.
    }
}

function resolveLocale({ url = '', cookie = '' } = {}) {
    let fromUrl = null
    try {
        fromUrl = normalizeLocale(new URL(url, 'http://localhost').searchParams.get('lang'))
    } catch (error) {
        fromUrl = null
    }
    return fromUrl || readLocaleCookie(cookie) || DEFAULT_LOCALE
}

function browserLocale(environment) {
    let cookie = ''
    try {
        cookie = environment.document.cookie
    } catch (error) {
        cookie = '' // Sandboxed frames may deny cookie access.
    }
    return resolveLocale({ url: environment.location.href, cookie })
}

function normalizeRootPath(rootPath = '', externalRootPath = '') {
    const segments = [externalRootPath, rootPath].map((value) => {
        if (typeof value !== 'string' || /[?#;\s\\]/.test(value)) throw new Error('Invalid deployment root path.')
        return value.split('/').filter(Boolean)
    }).flat()
    if (segments.some((segment) => segment === '.' || segment === '..')) throw new Error('Invalid deployment root path.')
    return segments.length ? '/' + segments.join('/') : '/'
}

function withLocale(url, locale) {
    if (!normalizeLocale(locale)) throw new Error('Unsupported UI language.')
    const next = new URL(url, 'http://localhost')
    next.searchParams.set('lang', locale)
    return next.href
}

function localeCookie(locale, rootPath = '/', secure = false) {
    if (!normalizeLocale(locale)) throw new Error('Unsupported UI language.')
    return `${COOKIE_NAME}=${locale}; Path=${normalizeRootPath(rootPath)}; Max-Age=31536000; SameSite=Lax${secure ? '; Secure' : ''}`
}

module.exports = { SUPPORTED_LOCALES, DEFAULT_LOCALE, COOKIE_NAME, normalizeLocale, readLocaleCookie, resolveLocale, browserLocale, normalizeRootPath, withLocale, localeCookie }
