import { i18n } from './index'
import { useUiTranslation } from './generated/browser'
import resources from './generated/resources.json'

const messageKeys = Object.fromEntries(Object.entries(resources.en.legacy || {}).map(([key, message]) => [message, key]))

export function uiText(message, options) {
    return i18n.t(messageKeys[message] || message, { ns: 'legacy', nsSeparator: false, defaultValue: message, ...options })
}

export function useLegacyText() {
    const { t } = useUiTranslation('legacy', i18n)
    return (message, options) => t(messageKeys[message] || message, { nsSeparator: false, defaultValue: message, ...options })
}

function hasTranslation(message) {
    return Object.hasOwn(messageKeys, message)
}

export function bindUiAttribute(element, attribute, message) {
    element.setAttribute(`data-mmgis-ui-${attribute}`, encodeURIComponent(message))
    element.setAttribute(attribute, uiText(message, { interpolation: { escapeValue: false } }))
}

export function uiAttribute(attribute, message) {
    return `${attribute}="${attributeText(message)}" data-mmgis-ui-${attribute}="${encodeURIComponent(message)}"`
}

export function uiTitle(message) {
    return { get title() { return uiText(message) }, uiTitleSource: message }
}

export function uiCanonical(element) {
    if (!element) return ''
    const label = element.matches('[data-mmgis-ui-text]') ? element : element.querySelector('[data-mmgis-ui-text]')
    return label ? decodeURIComponent(label.getAttribute('data-mmgis-ui-text')) : element.textContent
}

export function uiLabel(message) {
    const key = String(message).trim()
    const escaped = String(message).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const prefix = String(message).slice(0, String(message).indexOf(key))
    const suffix = String(message).slice(String(message).indexOf(key) + key.length)
    return hasTranslation(key) ? `<span data-mmgis-ui-text="${encodeURIComponent(key)}">${prefix}${uiText(key)}${suffix}</span>` : escaped
}

export function uiDropdownItems(items) {
    return items.map((message) => uiLabel(message))
}

export function bindUiTooltips(instances, message) {
    const list = Array.isArray(instances) ? instances : [instances]
    for (const instance of list) {
        if (instance?.reference) instance.reference.setAttribute('data-mmgis-ui-tooltip', encodeURIComponent(message))
    }
    return instances
}

// Adapter for explicitly selected third-party control containers. Call after
// their construction; leave editable values and user data outside these roots.
export function localizeControls(root, messages = {}) {
    if (!root) return
    for (const attribute of ['title', 'placeholder', 'aria-label']) {
        const elements = [root, ...root.querySelectorAll(`[${attribute}]`)]
        for (const element of elements) {
            const original = element.getAttribute(attribute)
            const message = messages[original] || original
            if (hasTranslation(message)) bindUiAttribute(element, attribute, message)
        }
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)
    for (const node of nodes) {
        const original = node.textContent.trim()
        const message = messages[original] || original
        if (!hasTranslation(message) || node.parentElement.closest('input, textarea, script, style, [data-mmgis-ui-text]')) continue
        const label = document.createElement('span')
        label.setAttribute('data-mmgis-ui-text', encodeURIComponent(message))
        label.textContent = node.textContent.replace(original, uiText(message, { interpolation: { escapeValue: false } }))
        node.replaceWith(label)
    }
}

function attributeText(message) {
    return uiText(message).replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function uiTemplate(strings, ...values) {
    return strings.reduce((markup, fragment, index) => markup + uiMarkup(fragment) + (index < values.length ? values[index] : ''), '')
}

export function uiRenderedMarkup(markup) {
    if (typeof markup !== 'string' || !markup.includes('data-mmgis-ui-')) return markup
    let result = markup.replace(/<option\b([^>]*)>\s*<span data-mmgis-ui-text="([^"]+)">([^<>]*)<\/span>\s*<\/option>/gi, (match, attributes, key) => {
        const message = decodeURIComponent(key)
        const value = /\bvalue\s*=/.test(attributes) ? '' : ` value="${message.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`
        return `<option${attributes}${value} data-mmgis-ui-text="${key}">${uiText(message)}</option>`
    })
    result = result.replace(/(<(?:span|option)\b[^>]*data-mmgis-ui-text="([^"]+)"[^>]*>)[^<>]*(<\/(?:span|option)>)/gi, (match, opening, key, closing) => opening + uiText(decodeURIComponent(key)) + closing)
    return result.replace(/<[^>]+>/g, (tag) => {
        for (const attribute of ['title', 'placeholder', 'aria-label']) {
            const marker = tag.match(new RegExp(`data-mmgis-ui-${attribute}="([^"]+)"`))
            if (marker) tag = tag.replace(new RegExp(`(\\b${attribute}\\s*=\\s*)(['"])(.*?)\\2`), (match, prefix, quote) => prefix + quote + attributeText(decodeURIComponent(marker[1])) + quote)
        }
        return tag
    })
}

// Only call this for source-owned static HTML fragments. Dynamic data and
// stored values must never pass through a phrase lookup.
export function uiMarkup(markup) {
    if (hasTranslation(markup.trim())) return uiLabel(markup)
    let result = markup.replace(/\b(title|placeholder|aria-label)\s*=\s*(['"])(.*?)\2/g, (match, attribute, quote, message) => {
        if (!hasTranslation(message)) return match
        return `${attribute}=${quote}${attributeText(message)}${quote} data-mmgis-ui-${attribute}="${encodeURIComponent(message)}"`
    })
    // An option's visible label must not change its implicit stored value.
    result = result.replace(/<option\b([^>]*)>([^<>]+)<\/option>/gi, (match, attributes, message) => {
        const key = message.trim()
        if (!hasTranslation(key)) return match
        const value = /\bvalue\s*=/.test(attributes) ? '' : ` value="${message.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`
        return `<option${attributes}${value} data-mmgis-ui-text="${encodeURIComponent(key)}">${uiText(key)}</option>`
    })
    return result.replace(/>([^<>]+)(<|$)/g, (match, message, ending, offset) => {
        const key = message.trim()
        if (!hasTranslation(key)) return match
        const openingTag = result.slice(0, offset + 1).match(/<([\w-]+)\b[^>]*>$/)
        if (openingTag && /^(option|textarea|script|style)$/i.test(openingTag[1])) return match
        const translated = message.replace(key, uiText(key))
        return `><span data-mmgis-ui-text="${encodeURIComponent(key)}">${translated}</span>${ending}`
    })
}

function refreshMarkedLabels() {
    // Explicit source annotations only; no DOM observer or unmarked data rewrite.
    document.querySelectorAll('[data-mmgis-ui-text]').forEach((element) => {
        element.textContent = uiText(decodeURIComponent(element.dataset.mmgisUiText), {
            interpolation: { escapeValue: false },
        })
    })
    for (const attribute of ['title', 'placeholder', 'aria-label']) {
        document.querySelectorAll(`[data-mmgis-ui-${attribute}]`).forEach((element) => {
            const key = decodeURIComponent(element.getAttribute(`data-mmgis-ui-${attribute}`))
            element.setAttribute(attribute, uiText(key, { interpolation: { escapeValue: false } }))
        })
    }
    document.querySelectorAll('[data-mmgis-ui-tooltip]').forEach((element) => {
        if (element._tippy) element._tippy.setContent(uiText(decodeURIComponent(element.getAttribute('data-mmgis-ui-tooltip'))))
    })
}

i18n.on('languageChanged', refreshMarkedLabels)
