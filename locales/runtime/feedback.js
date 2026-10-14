// Translate only declared messages. Never walk response data or translate IDs.
function createFeedback(resources, translate) {
    const entries = new Map()
    for (const namespace of ['auth', 'feedback']) {
        Object.entries(resources.en[namespace] || {}).forEach(([key, text]) => {
            entries.set(text, `${namespace}:${key}`)
        })
    }
    function allowed(key) {
        if (typeof key !== 'string') return false
        const [namespace, name, extra] = key.split(':')
        return !extra && ['auth', 'feedback'].includes(namespace) &&
            Object.prototype.hasOwnProperty.call(resources.en[namespace] || {}, name)
    }
    function parameters(key, params) {
        const [namespace, name] = key.split(':')
        const placeholders = resources.en[namespace][name].match(/{{\s*[\w.]+\s*}}/g) || []
        const result = {}
        placeholders.forEach((placeholder) => {
            const field = placeholder.replace(/[{}\s]/g, '')
            const value = params && Object.prototype.hasOwnProperty.call(params, field) ? params[field] : undefined
            if (['string', 'number', 'boolean'].includes(typeof value)) result[field] = value
            else result[field] = ''
        })
        return result
    }
    function descriptor(payload) {
        if (!payload || typeof payload !== 'object') return null
        if (allowed(payload.messageKey)) return { messageKey: payload.messageKey, messageParams: parameters(payload.messageKey, payload.messageParams) }
        const source = typeof payload.message === 'string' ? payload.message : payload.text
        if (entries.has(source)) return { messageKey: entries.get(source), messageParams: {} }
        const patterns = [
            [/^Successfully reset password for user: (.*)$/, 'resetUserSuccess', 'username'],
            [/^Failed to reset password for user: (.*)$/, 'resetUserFailure', 'username'],
            [/^'([^']*)' is logged in to this session\.$/, 'sessionUser', 'username'],
            [/^Unknown layer type: (.*)$/, 'unknownLayer', 'type'],
            [/^Websocket disconnected\. You will not be able to save until it reconnects or (\d+) more attempts? at saving to force it\.$/, 'wsForce', 'count'],
            [/^This configuration changed while you were working on it\. Cannot save without a refresh or (\d+) more attempts? at saving to force it\.$/, 'configForce', 'count'],
        ]
        if (typeof source === 'string') {
            for (const [pattern, key, param] of patterns) {
                const match = source.match(pattern)
                if (match) return { messageKey: 'feedback:' + key, messageParams: { [param]: match[1] } }
            }
        }
        if (typeof source !== 'string' || !source) return null
        if (!['success', 'failure', 'error'].includes(payload.status)) return null
        return { messageKey: payload.status === 'success' ? 'feedback:successDetails' : 'feedback:failureDetails', messageParams: { details: source } }
    }
    function text(source) {
        return entries.has(source) ? translate(entries.get(source)) : source
    }
    function message(payload) {
        const item = descriptor(payload)
        return item ? translate(item.messageKey, item.messageParams) : payload?.message || payload?.text || ''
    }
    return { allowed, parameters, descriptor, text, message }
}

module.exports = { createFeedback }
